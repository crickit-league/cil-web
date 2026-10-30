import { z } from "zod";

/** Longest edge we store, px. The client resizes to this before upload. */
export const PHOTO_MAX_EDGE = 2000;
/** Hard cap on the uploaded file, bytes — the client's output is well under this. */
export const PHOTO_MAX_BYTES = 3 * 1024 * 1024;
export const PHOTO_CONTENT_TYPES = ["image/jpeg", "image/webp"] as const;

export const captionSchema = z
  .string()
  .trim()
  .max(140, "Keep captions under 140 characters.")
  .transform((value) => (value === "" ? null : value));

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value));

export const photoTitleSchema = optionalText(50, "Keep titles under 50 characters.");
export const photoBodySchema = optionalText(500, "Keep the text under 500 characters.");
/** The match a photo is linked to; empty means none. */
export const photoMatchIdSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value));

export const photoUploadSchema = z.object({
  caption: captionSchema,
  title: photoTitleSchema,
  body: photoBodySchema,
  matchId: photoMatchIdSchema,
  contentType: z.enum(PHOTO_CONTENT_TYPES),
  width: z.coerce.number().int().min(1).max(PHOTO_MAX_EDGE),
  height: z.coerce.number().int().min(1).max(PHOTO_MAX_EDGE),
  size: z.number().int().min(1).max(PHOTO_MAX_BYTES, "That photo is too large."),
});

export const photoUpdateSchema = z.object({
  id: z.string().min(1),
  caption: captionSchema,
  title: photoTitleSchema,
  body: photoBodySchema,
  matchId: photoMatchIdSchema,
});
