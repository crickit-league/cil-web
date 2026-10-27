import { z } from "zod";

export const POOLS = ["A", "B"] as const;
export type Pool = (typeof POOLS)[number];

export const createSeriesSchema = z.object({
  name: z.string().trim().min(1, "Enter a series name.").max(120, "Keep the name under 120 characters."),
  // <input type="date"> value, interpreted as a calendar date (no time zone).
  startDate: z.iso.date("Pick a start date."),
});
export type CreateSeriesInput = z.infer<typeof createSeriesSchema>;

export const setPoolSchema = z.object({
  // Empty string from the "unassigned" option of a <select>.
  pool: z.enum(["", ...POOLS]).transform((value) => (value === "" ? null : value)),
});
