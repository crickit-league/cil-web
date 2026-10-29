import { PHOTO_MAX_EDGE } from "@/lib/validation/photo";

export type ResizedImage = { blob: Blob; width: number; height: number };

const QUALITY = 0.82;

/**
 * Shrinks a photo in the browser before upload: longest edge capped at
 * PHOTO_MAX_EDGE, re-encoded as JPEG. Phone photos are 3–10 MB; this brings
 * them to a few hundred KB, which also keeps them under the server action's
 * body limit. Re-encoding via canvas strips EXIF (incl. GPS) and applies the
 * camera's orientation.
 */
export async function resizeImage(file: File): Promise<ResizedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser can't process images.");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob) throw new Error("Couldn't compress that image.");
  return { blob, width, height };
}
