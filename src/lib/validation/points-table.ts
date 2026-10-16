import { z } from "zod";

// One team's line in CricClubs' points table export, after the CSV parser has
// picked the cells out by header. Everything arrives as text; this validates
// and converts it. Values are CricClubs' own — nothing is recalculated here.

const count = (label: string) =>
  z.string().trim().regex(/^\d+$/, `${label} must be a whole number`).transform(Number);

const decimal = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^[+-]?\d+(\.\d+)?$/, `${label} must be a number`)
    .transform(Number);

/** "519/104.4" — runs/overs, kept as text. Blank is allowed (the column is optional). */
const runsOvers = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^(\d+\/\d+(\.\d)?)?$/, `${label} must look like runs/overs, e.g. 519/104.4`)
    .transform((v) => v || null);

export const pointsTableRowSchema = z.object({
  position: count("SNO"),
  teamName: z.string().trim().min(1, "TEAM is blank"),
  played: count("MAT"),
  won: count("WON"),
  lost: count("LOST"),
  noResult: count("N/R"),
  tied: count("TIE"),
  points: decimal("PTS"),
  winPercent: z
    .string()
    .trim()
    .regex(/^(\d+(\.\d+)?%?)?$/, "WIN% must be a percentage, e.g. 77.78%")
    .transform((v) => (v ? Number(v.replace("%", "")) : null)),
  netRunRate: decimal("NET RR"),
  runsFor: runsOvers("FOR"),
  runsAgainst: runsOvers("AGAINST"),
});

export type PointsTableRowInput = z.input<typeof pointsTableRowSchema>;
export type PointsTableRowData = z.output<typeof pointsTableRowSchema>;
