import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { recordAudit } from "@/lib/services/audit";
import { deleteObject, publicUrl, putObject } from "@/lib/storage/r2";
import { photoUpdateSchema, photoUploadSchema } from "@/lib/validation/photo";

/** How many of the newest photos the homepage carousel shows. */
export const HOME_CAROUSEL_PHOTO_LIMIT = 10;

const EXTENSIONS = { "image/jpeg": "jpg", "image/webp": "webp" } as const;

export type PublicPhoto = { id: string; url: string; caption: string | null; width: number; height: number };

/**
 * Newest photos for the public carousel. Never throws: the homepage must render
 * even if the DB is unreachable or R2 isn't configured (no public URL → empty).
 */
export async function listHomePhotos(): Promise<PublicPhoto[]> {
  try {
    const rows = await prisma.photo.findMany({
      orderBy: { createdAt: "desc" },
      take: HOME_CAROUSEL_PHOTO_LIMIT,
    });
    return rows.flatMap((row) => {
      const url = publicUrl(row.storageKey);
      return url ? [{ id: row.id, url, caption: row.caption, width: row.width, height: row.height }] : [];
    });
  } catch (error) {
    console.error("Failed to load homepage photos:", error);
    return [];
  }
}

/** Every photo, newest first, for the admin tab. */
export async function listPhotosForAdmin(user: SessionUser) {
  if (!can(user, "manage-photos")) throw new ForbiddenError();

  const rows = await prisma.photo.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { email: true, name: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    url: publicUrl(row.storageKey),
    caption: row.caption,
    width: row.width,
    height: row.height,
    createdAt: row.createdAt,
    uploadedBy: row.uploadedBy?.name || row.uploadedBy?.email || null,
  }));
}

function sniffContentType(bytes: Uint8Array): "image/jpeg" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const tag = (offset: number) => String.fromCharCode(...bytes.slice(offset, offset + 4));
  if (tag(0) === "RIFF" && tag(8) === "WEBP") return "image/webp";
  return null;
}

export async function uploadPhoto(
  user: SessionUser,
  input: { bytes: Uint8Array; contentType: string; width: unknown; height: unknown; caption: unknown },
) {
  if (!can(user, "manage-photos")) throw new ForbiddenError();

  const parsed = photoUploadSchema.parse({
    caption: input.caption ?? "",
    contentType: input.contentType,
    width: input.width,
    height: input.height,
    size: input.bytes.byteLength,
  });
  // Don't trust the declared type: check the file's actual magic bytes.
  if (sniffContentType(input.bytes) !== parsed.contentType) {
    throw new Error("That file isn't a valid JPEG or WebP image.");
  }

  const key = `photos/${new Date().toISOString().slice(0, 10)}-${randomUUID()}.${EXTENSIONS[parsed.contentType]}`;
  await putObject(key, input.bytes, parsed.contentType);

  try {
    return await prisma.$transaction(async (tx) => {
      const photo = await tx.photo.create({
        data: {
          storageKey: key,
          caption: parsed.caption,
          width: parsed.width,
          height: parsed.height,
          uploadedById: user.id,
        },
      });
      await recordAudit(tx, user, {
        action: "photo.upload",
        entityType: "Photo",
        entityId: photo.id,
        summary: parsed.caption ? `uploaded photo "${parsed.caption}"` : "uploaded a photo",
      });
      return photo;
    });
  } catch (error) {
    // Don't leave an orphaned object behind if the row didn't commit.
    await deleteObject(key).catch(() => {});
    throw error;
  }
}

export async function updatePhotoCaption(user: SessionUser, raw: { id: string; caption: string }) {
  if (!can(user, "manage-photos")) throw new ForbiddenError();
  const { id, caption } = photoUpdateSchema.parse(raw);

  const existing = await prisma.photo.findUnique({ where: { id } });
  if (!existing || existing.caption === caption) return;

  await prisma.$transaction(async (tx) => {
    await tx.photo.update({ where: { id }, data: { caption } });
    await recordAudit(tx, user, {
      action: "photo.update",
      entityType: "Photo",
      entityId: id,
      summary: "edited a photo caption",
      changes: { caption: [existing.caption, caption] },
    });
  });
}

export async function deletePhoto(user: SessionUser, id: string) {
  if (!can(user, "manage-photos")) throw new ForbiddenError();

  const existing = await prisma.photo.findUnique({ where: { id } });
  if (!existing) return;

  await prisma.$transaction(async (tx) => {
    await tx.photo.delete({ where: { id } });
    await recordAudit(tx, user, {
      action: "photo.delete",
      entityType: "Photo",
      entityId: id,
      summary: existing.caption ? `deleted photo "${existing.caption}"` : "deleted a photo",
    });
  });

  // Best effort: the row is the source of truth, a stray object is harmless.
  await deleteObject(existing.storageKey).catch((error) => {
    console.error("Failed to delete photo object:", existing.storageKey, error);
  });
}
