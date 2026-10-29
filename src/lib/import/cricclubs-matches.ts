import ExcelJS from "exceljs";
import type { MatchStage, ResultType } from "@/generated/prisma";

// Parsing for CricClubs' per-series "Matches" admin export (.xlsx). Two
// steps, kept separate on purpose: readMatchesWorkbook turns the file into
// raw header→text records (stored verbatim in import_rows so a parser fix can
// be replayed), and normalizeMatchRow validates one record into the shape the
// planner uses. Neither touches the database.

export type RawMatchRecord = Record<string, string>;

const REQUIRED_HEADERS = ["Match Type", "Date", "Team One", "Team two", "Ground"] as const;
const UMPIRE_HEADERS = ["Umpire One", "Umpire Two", "Umpire Three", "Umpire Four"] as const;

export class MatchesFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatchesFileError";
  }
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    // Excel stores a time-only cell as a date on 1899-12-30; keep just the
    // part that matters for each case.
    const iso = value.toISOString();
    return iso.startsWith("1899-12-30") ? iso.slice(11, 19) : iso.slice(0, 10);
  }
  if (typeof value === "object") {
    if ("richText" in value)
      return value.richText
        .map((r) => r.text)
        .join("")
        .trim();
    if ("text" in value) return String(value.text).trim();
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    return "";
  }
  return String(value).trim();
}

/** Reads the first worksheet into one record per data row, keyed by header text. */
export async function readMatchesWorkbook(buffer: ArrayBuffer): Promise<RawMatchRecord[]> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new MatchesFileError("That file couldn't be read as an Excel workbook (.xlsx).");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new MatchesFileError("The workbook has no sheets.");

  // The header row is the first one (within the first few) containing "Team One".
  let headerRow = 0;
  for (let r = 1; r <= Math.min(5, sheet.rowCount); r++) {
    const texts = (sheet.getRow(r).values as ExcelJS.CellValue[]).map(cellText);
    if (texts.includes("Team One")) {
      headerRow = r;
      break;
    }
  }
  if (!headerRow) {
    throw new MatchesFileError(
      'This doesn\'t look like a CricClubs matches export — no "Team One" column header found.',
    );
  }

  const headers = (sheet.getRow(headerRow).values as ExcelJS.CellValue[]).map(cellText);
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new MatchesFileError(`The export is missing these columns: ${missing.join(", ")}.`);
  }

  const records: RawMatchRecord[] = [];
  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const values = sheet.getRow(r).values as ExcelJS.CellValue[];
    const record: RawMatchRecord = {};
    headers.forEach((header, i) => {
      if (header) record[header] = cellText(values[i]);
    });
    // Skip fully blank trailing rows.
    if (Object.values(record).some((v) => v !== "")) records.push(record);
  }
  return records;
}

const STAGES: Record<string, MatchStage> = {
  league: "LEAGUE",
  qualifier: "PRE_QUARTER_FINAL",
  "pre quarter final": "PRE_QUARTER_FINAL",
  "quarter final": "QUARTER_FINAL",
  "semi final": "SEMI_FINAL",
  final: "FINAL",
};

export type ParsedResult = {
  status: "SCHEDULED" | "COMPLETED" | "ABANDONED";
  resultType: ResultType | null;
  /** Team name as CricClubs wrote it; resolved to a team entry by the planner. */
  winnerName: string | null;
  marginRuns: number | null;
  marginWickets: number | null;
  text: string | null;
};

export function parseResult(text: string): ParsedResult {
  const t = text.trim();
  const none = { winnerName: null, marginRuns: null, marginWickets: null };
  if (!t) return { status: "SCHEDULED", resultType: null, text: null, ...none };

  let m = t.match(/^(.+?) won by (\d+) runs?$/i);
  if (m)
    return {
      ...none,
      status: "COMPLETED",
      resultType: "RUNS",
      winnerName: m[1],
      marginRuns: Number(m[2]),
      text: t,
    };
  m = t.match(/^(.+?) won by (\d+) wickets?$/i);
  if (m) {
    return {
      ...none,
      status: "COMPLETED",
      resultType: "WICKETS",
      winnerName: m[1],
      marginWickets: Number(m[2]),
      text: t,
    };
  }
  if (/^it is a tie/i.test(t)) return { ...none, status: "COMPLETED", resultType: "TIE", text: t };
  if (/^abandoned/i.test(t)) return { ...none, status: "ABANDONED", resultType: "NO_RESULT", text: t };
  m = t.match(/^forfeited\.?\s*winner:\s*(.+)$/i);
  if (m) return { ...none, status: "COMPLETED", resultType: "FORFEIT", winnerName: m[1].trim(), text: t };

  // Something CricClubs wrote that we don't model yet (e.g. a super over):
  // keep the wording, mark it played.
  return { ...none, status: "COMPLETED", resultType: null, text: t };
}

export type ParsedInningsTotal = {
  /** Team name as CricClubs wrote it; resolved to a team entry by the planner. */
  teamName: string;
  runs: number;
  wickets: number;
  legalBalls: number;
};

// One "Team: runs/wickets(overs)" entry. Overs are CricClubs' "overs.balls"
// form, so 11.5 is 11 overs and 5 balls.
const SCORE_ENTRY = /(\S.*?):\s*(\d+)\/(\d+)\s*\((\d+)(?:\.(\d+))?\)/g;

/**
 * Parses CricClubs' "Score Summary" cell — "Atlanta BlackCaps: 42/9(14)
 * Spades: 43/7(11.5)" — into innings totals in batting order. A blank cell is
 * no innings. CricClubs writes "Team: 0/0(0)" for a match that never started
 * (abandoned or forfeited); those entries are dropped, not stored as innings.
 * Returns an error message for anything it can't read in full, so the
 * preview can show it instead of storing half a scorecard.
 */
export function parseScoreSummary(text: string): { innings: ParsedInningsTotal[] } | { error: string } {
  const t = text.trim();
  if (!t) return { innings: [] };

  const innings: ParsedInningsTotal[] = [];
  let consumed = "";
  for (const m of t.matchAll(SCORE_ENTRY)) {
    consumed += m[0];
    const balls = m[5] === undefined ? 0 : Number(m[5]);
    if (m[5] !== undefined && (m[5].length > 1 || balls > 5)) {
      return { error: `"${m[0].trim()}" has ${m[4]}.${m[5]} overs, which isn't a valid overs count.` };
    }
    const entry = {
      teamName: m[1].trim(),
      runs: Number(m[2]),
      wickets: Number(m[3]),
      legalBalls: Number(m[4]) * 6 + balls,
    };
    if (entry.runs === 0 && entry.wickets === 0 && entry.legalBalls === 0) continue;
    innings.push(entry);
  }
  // Every non-space character must belong to an entry, or part of the cell
  // was silently skipped.
  if (consumed.replace(/\s/g, "") !== t.replace(/\s/g, "")) {
    return { error: `Couldn't read the score summary "${t}".` };
  }
  return { innings };
}

export type NormalizedMatchRow = {
  rowNumber: number;
  stage: MatchStage;
  /** YYYY-MM-DD, Atlanta calendar date. Null while the match isn't scheduled yet. */
  date: string | null;
  /** HH:MM, Atlanta wall-clock time. Null when it isn't fixed yet (always null without a date). */
  time: string | null;
  teamOne: string;
  teamTwo: string;
  ground: string;
  /** Non-empty umpire slot values, in slot order (team or person names). */
  umpireValues: string[];
  /** The "Umpire One" cell — where the committee puts the umpiring team's name. */
  umpireOne: string;
  result: ParsedResult;
  /** The "Score Summary" cell, verbatim. Parsed by parseScoreSummary. */
  scoreSummary: string;
};

export type RowProblem = { rowNumber: number; message: string };

/** A cell's trimmed text, with "TBD"/"TBA" treated as blank. */
function blankIfTbd(value: string | undefined): string {
  const t = (value ?? "").trim();
  return /^(tbd|tba)$/i.test(t) ? "" : t;
}

/**
 * Validates one raw record. rowNumber is 1-based among data rows, matching
 * what an admin sees counting down the spreadsheet under the header.
 */
export function normalizeMatchRow(
  record: RawMatchRecord,
  rowNumber: number,
): { row: NormalizedMatchRow } | { problem: RowProblem } {
  const fail = (message: string) => ({ problem: { rowNumber, message } });

  const stage = STAGES[(record["Match Type"] ?? "").trim().toLowerCase()];
  if (!stage) return fail(`Unknown match type "${record["Match Type"]}".`);

  // The committee sometimes publishes fixtures before they're scheduled, with
  // Date and/or Time left blank (or "TBD"). No date means the match isn't
  // scheduled yet — a time on its own is meaningless then. A date without a
  // time is kept, time TBD. Anything else that isn't a date or time is an error.
  const dateRaw = blankIfTbd(record["Date"]);
  if (dateRaw && !/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    return fail(`Date "${record["Date"]}" isn't in YYYY-MM-DD form.`);
  }

  // CricClubs labels this column "Time (IST)", but the values are Atlanta
  // local times (an 08:30 start would be 11pm the night before in Atlanta).
  const timeRaw = blankIfTbd(record["Time (IST)"] ?? record["Time"]);
  const time = timeRaw.match(/^(\d{1,2}):(\d{2})/);
  if (timeRaw && (!time || Number(time[1]) > 23 || Number(time[2]) > 59)) {
    return fail(`Time "${timeRaw}" isn't a time of day.`);
  }

  const teamOne = (record["Team One"] ?? "").trim();
  const teamTwo = (record["Team two"] ?? record["Team Two"] ?? "").trim();
  if (!teamOne || !teamTwo) return fail("Both teams are needed.");
  if (teamOne.toLowerCase() === teamTwo.toLowerCase()) return fail(`"${teamOne}" is listed against itself.`);

  return {
    row: {
      rowNumber,
      stage,
      date: dateRaw || null,
      time: dateRaw && time ? `${time[1].padStart(2, "0")}:${time[2]}` : null,
      teamOne,
      teamTwo,
      ground: (record["Ground"] ?? "").trim(),
      umpireValues: UMPIRE_HEADERS.map((h) => (record[h] ?? "").trim()).filter(Boolean),
      umpireOne: (record["Umpire One"] ?? "").trim(),
      result: parseResult(record["Result"] ?? ""),
      scoreSummary: (record["Score Summary"] ?? "").trim(),
    },
  };
}

/** Trimmed, lower-cased, single-spaced — the form NameAlias.rawName is stored in. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
