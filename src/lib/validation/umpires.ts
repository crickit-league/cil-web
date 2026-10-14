import { z } from "zod";

/** "(404) 555-0123", "404.555.0123", "+1 404 555 0123" → "404-555-0123"; null if it isn't a US number. */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const name = z
  .string()
  .trim()
  .max(80, "Keep names under 80 characters.")
  .transform((v) => v.replace(/\s+/g, " "));

// Blank means "keep the saved number" — the form never shows stored numbers,
// so leaving it empty can't mean "clear it" (clearing the name does that).
const phone = (label: string) =>
  z
    .string()
    .trim()
    .max(30, `${label}: that doesn't look like a phone number.`)
    .refine((v) => v === "" || normalizePhone(v) !== null, {
      message: `${label}: enter a 10-digit US phone number.`,
    })
    .transform((v) => (v === "" ? null : normalizePhone(v)));

export const umpireNominationSchema = z.object({
  umpireOneName: name,
  umpireOnePhone: phone("Umpire 1 phone"),
  umpireTwoName: name,
  umpireTwoPhone: phone("Umpire 2 phone"),
});
export type UmpireNominationInput = z.input<typeof umpireNominationSchema>;

export const umpireEntryLockSchema = z.object({ locked: z.boolean() });
