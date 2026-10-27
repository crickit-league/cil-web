"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { deletePhoto, updatePhotoCaption, uploadPhoto } from "@/lib/services/photos";
import { isStorageConfigured } from "@/lib/storage/r2";

export type PhotoActionResult = { ok: true } | { ok: false; message: string };

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/photos");
  revalidatePath("/admin/activity");
}

function failure(error: unknown, fallback: string): PhotoActionResult {
  return { ok: false, message: error instanceof Error ? error.message : fallback };
}

/** One photo per call — the client uploads a batch sequentially so progress is visible. */
export async function uploadPhotoAction(formData: FormData): Promise<PhotoActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "You must be signed in." };
  if (!isStorageConfigured()) {
    return {
      ok: false,
      message: "Photo storage isn't configured yet — see docs/service-setup.md (Cloudflare R2).",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, message: "No file received." };

  try {
    await uploadPhoto(session.user, {
      bytes: new Uint8Array(await file.arrayBuffer()),
      contentType: file.type,
      width: formData.get("width"),
      height: formData.get("height"),
      caption: formData.get("caption"),
    });
  } catch (error) {
    return failure(error, "Upload failed.");
  }

  refresh();
  return { ok: true };
}

export async function updateCaptionAction(id: string, caption: string): Promise<PhotoActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "You must be signed in." };

  try {
    await updatePhotoCaption(session.user, { id, caption });
  } catch (error) {
    return failure(error, "Couldn't save the caption.");
  }

  refresh();
  return { ok: true };
}

export async function deletePhotoAction(id: string): Promise<PhotoActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "You must be signed in." };

  try {
    await deletePhoto(session.user, id);
  } catch (error) {
    return failure(error, "Couldn't delete the photo.");
  }

  refresh();
  return { ok: true };
}
