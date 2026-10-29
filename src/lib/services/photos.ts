import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { diffRecords, recordAudit } from "@/lib/services/audit";
import { findCurrentSeries } from "@/lib/services/series";
import { deleteObject, publicUrl, putObject } from "@/lib/storage/r2";
import { matchLabel } from "@/lib/match-label";
import { mockMomEnabled, mockMomEntry, mockMomPhotos } from "@/lib/mock-mom";
import { getPublicFixture, type ScheduleMatch } from "@/lib/services/schedule";
import { formatMatchDay } from "@/lib/time";
import { photoUpdateSchema, photoUploadSchema } from "@/lib/validation/photo";

/** How many of the newest photos the homepage carousel shows. */
export const HOME_CAROUSEL_PHOTO_LIMIT = 10;

const EXTENSIONS = { "image/jpeg": "jpg", "image/webp": "webp" } as const;

export type PublicPhoto = {
  id: string;
  url: string;
  caption: string | null;
  /** Optional headline and text shown on the carousel slide. */
  title: string | null;
  body: string | null;
  width: number;
  height: number;
  /** The match this photo is linked to, with its fixture page. */
  match: { id: string; label: string; href: string } | null;
};

const matchSelect = {
  id: true,
  startsAt: true,
  teamOne: { select: { displayName: true } },
  teamTwo: { select: { displayName: true } },
  teamOneSource: true,
  teamTwoSource: true,
} as const;

type MatchRow = {
  id: string;
  startsAt: Date | null;
  teamOne: { displayName: string } | null;
  teamTwo: { displayName: string } | null;
  teamOneSource: string | null;
  teamTwoSource: string | null;
};

function describeMatch(m: MatchRow) {
  const label = matchLabel(
    m.teamOne && { name: m.teamOne.displayName },
    m.teamTwo && { name: m.teamTwo.displayName },
    m.teamOneSource,
    m.teamTwoSource,
  );
  return { id: m.id, label, when: m.startsAt ? formatMatchDay(m.startsAt) : "Date TBD" };
}

/**
 * Newest photos for the public carousel. Never throws: the homepage must render
 * even if the DB is unreachable or R2 isn't configured (no public URL → empty).
 */
export async function listHomePhotos(): Promise<PublicPhoto[]> {
  const photos = await listUploadedPhotos();
  // TEMPORARY, see lib/mock-mom.ts: mock photos fill the carousel only until real ones are uploaded.
  if (photos.length === 0 && mockMomEnabled()) return mockMomPhotos();
  return photos;
}

async function listUploadedPhotos(): Promise<PublicPhoto[]> {
  try {
    const rows = await prisma.photo.findMany({
      orderBy: { createdAt: "desc" },
      take: HOME_CAROUSEL_PHOTO_LIMIT,
      include: { match: { select: matchSelect } },
    });
    return rows.flatMap((row) => {
      const url = publicUrl(row.storageKey);
      if (!url) return [];
      const match = row.match ? describeMatch(row.match) : null;
      return [
        {
          id: row.id,
          url,
          caption: row.caption,
          title: row.title,
          body: row.body,
          width: row.width,
          height: row.height,
          match: match && {
            id: match.id,
            label: `${match.label} · ${match.when}`,
            href: `/league/fixtures/${match.id}`,
          },
        },
      ];
    });
  } catch (error) {
    console.error("Failed to load homepage photos:", error);
    return [];
  }
}

/** One photo with the match it is linked to, for its own page (/mom/[id]). */
export type MomEntry = {
  id: string;
  url: string;
  width: number;
  height: number;
  caption: string | null;
  title: string | null;
  body: string | null;
  createdAt: Date;
  /** The linked match with its result and scores, or null if the photo isn't linked to one. */
  match: ScheduleMatch | null;
};

/** A photo and its linked match for the detail page, or null. Never throws. */
export async function getMomEntry(id: string): Promise<MomEntry | null> {
  if (mockMomEnabled()) {
    const mock = mockMomEntry(id); // TEMPORARY, see lib/mock-mom.ts
    if (mock) return mock;
  }
  try {
    const row = await prisma.photo.findUnique({ where: { id } });
    if (!row) return null;
    const url = publicUrl(row.storageKey);
    if (!url) return null;
    const fixture = row.matchId ? await getPublicFixture(row.matchId) : null;
    return {
      id: row.id,
      url,
      width: row.width,
      height: row.height,
      caption: row.caption,
      title: row.title,
      body: row.body,
      createdAt: row.createdAt,
      match: fixture?.match ?? null,
    };
  } catch (error) {
    console.error("Failed to load photo:", id, error);
    return null;
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
    title: row.title,
    body: row.body,
    matchId: row.matchId,
    width: row.width,
    height: row.height,
    createdAt: row.createdAt,
    uploadedBy: row.uploadedBy?.name || row.uploadedBy?.email || null,
  }));
}

/** The current series' matches, newest first, for the "linked match" picker. */
export async function listPhotoMatchOptions(user: SessionUser) {
  if (!can(user, "manage-photos")) throw new ForbiddenError();
  const { series } = await findCurrentSeries();
  if (!series) return [];

  const rows = await prisma.match.findMany({
    where: { seriesId: series.id, status: { not: "CANCELLED" } },
    select: matchSelect,
    orderBy: [{ startsAt: "desc" }, { id: "asc" }],
    take: 300,
  });
  return rows.map((m) => {
    const d = describeMatch(m);
    return { id: d.id, label: `${d.label} · ${d.when}` };
  });
}

/** Rejects a match id that isn't a match (a stale or forged form value). */
async function assertMatchExists(matchId: string | null) {
  if (matchId && !(await prisma.match.findUnique({ where: { id: matchId }, select: { id: true } }))) {
    throw new Error("That match no longer exists.");
  }
}

function sniffContentType(bytes: Uint8Array): "image/jpeg" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const tag = (offset: number) => String.fromCharCode(...bytes.slice(offset, offset + 4));
  if (tag(0) === "RIFF" && tag(8) === "WEBP") return "image/webp";
  return null;
}

export async function uploadPhoto(
  user: SessionUser,
  input: {
    bytes: Uint8Array;
    contentType: string;
    width: unknown;
    height: unknown;
    caption: unknown;
    title?: unknown;
    body?: unknown;
    matchId?: unknown;
  },
) {
  if (!can(user, "manage-photos")) throw new ForbiddenError();

  const parsed = photoUploadSchema.parse({
    caption: input.caption ?? "",
    title: input.title ?? "",
    body: input.body ?? "",
    matchId: input.matchId ?? "",
    contentType: input.contentType,
    width: input.width,
    height: input.height,
    size: input.bytes.byteLength,
  });
  // Don't trust the declared type: check the file's actual magic bytes.
  if (sniffContentType(input.bytes) !== parsed.contentType) {
    throw new Error("That file isn't a valid JPEG or WebP image.");
  }

  await assertMatchExists(parsed.matchId);

  const key = `photos/${new Date().toISOString().slice(0, 10)}-${randomUUID()}.${EXTENSIONS[parsed.contentType]}`;
  await putObject(key, input.bytes, parsed.contentType);

  try {
    return await prisma.$transaction(async (tx) => {
      const photo = await tx.photo.create({
        data: {
          storageKey: key,
          caption: parsed.caption,
          title: parsed.title,
          body: parsed.body,
          matchId: parsed.matchId,
          width: parsed.width,
          height: parsed.height,
          uploadedById: user.id,
        },
      });
      await recordAudit(tx, user, {
        action: "photo.upload",
        entityType: "Photo",
        entityId: photo.id,
        summary:
          parsed.title || parsed.caption
            ? `uploaded photo "${parsed.title ?? parsed.caption}"`
            : "uploaded a photo",
      });
      return photo;
    });
  } catch (error) {
    // Don't leave an orphaned object behind if the row didn't commit.
    await deleteObject(key).catch(() => {});
    throw error;
  }
}

export async function updatePhotoDetails(
  user: SessionUser,
  raw: { id: string; caption: string; title: string; body: string; matchId: string },
) {
  if (!can(user, "manage-photos")) throw new ForbiddenError();
  const { id, ...next } = photoUpdateSchema.parse(raw);

  const existing = await prisma.photo.findUnique({ where: { id } });
  if (!existing) return;
  const before = {
    caption: existing.caption,
    title: existing.title,
    body: existing.body,
    matchId: existing.matchId,
  };
  const changes = diffRecords(before, next);
  if (Object.keys(changes).length === 0) return;
  await assertMatchExists(next.matchId);

  await prisma.$transaction(async (tx) => {
    await tx.photo.update({ where: { id }, data: next });
    await recordAudit(tx, user, {
      action: "photo.update",
      entityType: "Photo",
      entityId: id,
      summary: "edited a photo's details",
      changes,
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
