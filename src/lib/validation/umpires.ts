import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

const name = z
  .string()
  .trim()
  .max(80, "Keep names under 80 characters.")
  .transform((v) => v.replace(/\s+/g, " "));

// Blank means "keep the saved number" — the form never shows stored numbers,
// so leaving it empty can't mean "clear it" (clearing the name does that).
// Anything else must be exactly 10 digits (a leading +1 is dropped); it's
// stored as bare digits.
const phone = (label: string) =>
  z
    .string()
    .trim()
    .max(30, `${label}: that doesn't look like a phone number.`)
    .refine((v) => v === "" || normalizePhone(v) !== null, {
      message: `${label}: enter a 10-digit US phone number, e.g. (404) 555-0123.`,
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
