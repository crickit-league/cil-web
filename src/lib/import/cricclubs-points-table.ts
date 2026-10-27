import {
  pointsTableRowSchema,
  type PointsTableRowData,
  type PointsTableRowInput,
} from "@/lib/validation/points-table";

// Parsing for CricClubs' "Points Table" export (viewPointsTableExcel.csv).
// The file is one block per group:
//
//   (blank lines)
//   ,,,Group A
//     SNO ,TEAM , MAT, WON, LOST , N/R, TIE, PTS, WIN%,NET RR, FOR, AGAINST
//   1,KCC Yoddhas,10,8,0,2,0,18.0,100.00%,1.8753,519/104.4,370/120
//   …
//
// Header cells carry stray spaces, so columns are found by trimmed name.
// Two steps, as with the matches import: readCsvLines keeps the file's lines
// verbatim (stored in import_rows), and parsePointsTable turns them into
// groups. Neither touches the database.

export type CsvLine = { lineNumber: number; cells: string[] };

export class PointsTableFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PointsTableFileError";
  }
}

/** Splits CSV text into cells per line. Handles quoted cells ("a, b" and ""). */
export function readCsvLines(text: string): CsvLine[] {
  const lines: CsvLine[] = [];
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  let lineNumber = 1;
  const src = text.replace(/^﻿/, "");

  const endLine = () => {
    cells.push(cell);
    lines.push({ lineNumber, cells });
    cells = [];
    cell = "";
    lineNumber++;
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        if (ch === "\n") lineNumber++;
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      cells.push(cell);
      cell = "";
    } else if (ch === "\n") {
      endLine();
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell !== "" || cells.length > 0) endLine();
  return lines;
}

/** CricClubs header text → the field it feeds. Matched after trimming and upper-casing. */
const COLUMNS: Record<string, keyof PointsTableRowInput> = {
  SNO: "position",
  TEAM: "teamName",
  MAT: "played",
  WON: "won",
  LOST: "lost",
  "N/R": "noResult",
  TIE: "tied",
  PTS: "points",
  "WIN%": "winPercent",
  "NET RR": "netRunRate",
  FOR: "runsFor",
  AGAINST: "runsAgainst",
};
const REQUIRED: (keyof PointsTableRowInput)[] = [
  "position",
  "teamName",
  "played",
  "won",
  "lost",
  "points",
  "netRunRate",
];
// Optional columns read as blank when missing, so older or trimmed exports still load.
const OPTIONAL_DEFAULTS: Partial<PointsTableRowInput> = {
  noResult: "0",
  tied: "0",
  winPercent: "",
  runsFor: "",
  runsAgainst: "",
};

export type ParsedGroup = { name: string; rows: (PointsTableRowData & { lineNumber: number })[] };
export type PointsTableProblem = { lineNumber: number; message: string };
export type ParsedPointsTable = { groups: ParsedGroup[]; problems: PointsTableProblem[] };

const isBlank = (cells: string[]) => cells.every((c) => c.trim() === "");

/**
 * Turns the export's lines into groups of rows, in file order. Anything it
 * can't read becomes a problem with its line number rather than being
 * skipped silently; an upload with problems can't be published.
 */
export function parsePointsTable(lines: CsvLine[]): ParsedPointsTable {
  const groups: ParsedGroup[] = [];
  const problems: PointsTableProblem[] = [];
  let columns: Map<keyof PointsTableRowInput, number> | null = null;
  let current: ParsedGroup | null = null;

  const isHeader = (cells: string[]) => {
    const upper = cells.map((c) => c.trim().toUpperCase());
    return upper.includes("TEAM") && upper.includes("PTS");
  };
  // Some other file entirely (e.g. the matches export): one clear message, not one per line.
  if (!lines.some((l) => isHeader(l.cells))) {
    return {
      groups: [],
      problems: [
        {
          lineNumber: 0,
          message:
            'This doesn\'t look like a CricClubs points table export — no header row with "TEAM" and "PTS" was found.',
        },
      ],
    };
  }

  for (const { lineNumber, cells } of lines) {
    if (isBlank(cells)) continue;
    const filled = cells.map((c) => c.trim()).filter(Boolean);
    const upper = cells.map((c) => c.trim().toUpperCase());

    // Header row: names the columns for the rows under it.
    if (isHeader(cells)) {
      columns = new Map();
      upper.forEach((name, i) => {
        const field = COLUMNS[name];
        if (field && !columns!.has(field)) columns!.set(field, i);
      });
      const missing = REQUIRED.filter((f) => !columns!.has(f));
      if (missing.length > 0) {
        const names = Object.entries(COLUMNS)
          .filter(([, f]) => missing.includes(f))
          .map(([n]) => n);
        problems.push({ lineNumber, message: `The header is missing ${names.join(", ")}.` });
        columns = null;
      }
      // A header with no group title above it (a single-group export).
      if (!current) {
        current = { name: "Points Table", rows: [] };
        groups.push(current);
      }
      continue;
    }

    // Group title: a lone text cell, e.g. ",,,Group A".
    if (filled.length === 1 && !/^\d/.test(filled[0])) {
      current = { name: filled[0], rows: [] };
      groups.push(current);
      columns = null;
      continue;
    }

    if (!columns || !current) {
      problems.push({ lineNumber, message: "A team row comes before the column headers." });
      continue;
    }

    const input = { ...OPTIONAL_DEFAULTS } as PointsTableRowInput;
    for (const [field, index] of columns) input[field] = cells[index] ?? "";
    const result = pointsTableRowSchema.safeParse(input);
    if (!result.success) {
      const label = input.teamName?.trim() || "this row";
      problems.push({
        lineNumber,
        message: `${label}: ${result.error.issues.map((i) => i.message).join("; ")}.`,
      });
      continue;
    }
    const row = result.data;
    if (current.rows.some((r) => r.teamName.toLowerCase() === row.teamName.toLowerCase())) {
      problems.push({ lineNumber, message: `${row.teamName} appears twice in ${current.name}.` });
      continue;
    }
    if (current.rows.some((r) => r.position === row.position)) {
      problems.push({ lineNumber, message: `Position ${row.position} appears twice in ${current.name}.` });
      continue;
    }
    current.rows.push({ ...row, lineNumber });
  }

  // Group titles with no readable rows under them aren't shown.
  const withRows = groups.filter((g) => g.rows.length > 0);
  if (withRows.length === 0 && problems.length === 0) {
    problems.push({
      lineNumber: 0,
      message: "The file has no team rows.",
    });
  }
  return { groups: withRows, problems };
}
