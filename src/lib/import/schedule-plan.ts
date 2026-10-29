import type { AssignmentSource, MatchStage, MatchStatus } from "@/generated/prisma";
import { formatMatchWhen, leagueWallTimeToUtc, matchDayKey, type MatchWhen } from "@/lib/time";
import { indexTeamNames } from "@/lib/teams/names";
import {
  normalizeMatchRow,
  normalizeName,
  parseScoreSummary,
  type NormalizedMatchRow,
  type ParsedResult,
  type RawMatchRecord,
  type RowProblem,
} from "./cricclubs-matches";

// Works out what a CricClubs schedule import would change, without touching
// the database: the service loads current state, calls planScheduleImport,
// shows the plan as the preview, and applies the same plan on commit.
//
// Matching. The export has no match ID, so a match is identified by its stage
// plus its two teams (order-free). Each pair meets at most once per stage —
// true for all 110 league games of 2025-26 — so a match that moves to another
// day or ground is recognised as the same match, and anything hanging off it
// (umpire nominations) survives the move.
//
// Unscheduled matches. A blank Date (or Time) in the file means the committee
// hasn't fixed it yet — see MatchWhen. When a later file fills it in, the same
// match is updated. A file that knows less than what's saved (a blank date, or
// a blank time on the saved date) never wipes it: the saved date/time is kept
// and the preview says so.

export type PlanTeam = {
  id: string; // TeamEntry id
  displayName: string;
  /** Every name this team is known by: display name, canonical Team name, admin-mapped aliases. */
  names: string[];
  pool: string | null;
};

export type ExistingMatch = {
  id: string;
  stage: MatchStage;
  teamOneId: string | null;
  teamTwoId: string | null;
  startsAt: Date | null;
  timeTbd: boolean;
  groundName: string | null;
  status: MatchStatus;
  umpiringTeamId: string | null;
  umpiringTeamSource: AssignmentSource | null;
  resultText: string | null;
  umpireNames: string[];
  /** Saved innings totals (not super overs), in batting order. */
  innings: PlannedInnings[];
};

/** One team's innings total, ready to store as an Innings row. */
export type PlannedInnings = {
  number: number;
  battingEntryId: string;
  runs: number;
  wickets: number;
  legalBalls: number;
  allOut: boolean;
};

export type PlannedMatch = {
  key: string;
  rowNumber: number;
  stage: MatchStage;
  /** Null: date TBD. See MatchWhen. */
  startsAt: Date | null;
  timeTbd: boolean;
  teamOneId: string;
  teamTwoId: string;
  ground: string;
  /** People named in CricClubs' umpire slots (not teams). Admin-only. */
  umpireNames: string[];
  result: ParsedResult & { winnerId: string | null };
  /**
   * Innings totals from the "Score Summary" column. Null means the cell
   * couldn't be read (see SchedulePlan.scoreProblems): the saved innings are
   * left as they are.
   */
  innings: PlannedInnings[] | null;
  /** What the match's umpiring team should be after the import. */
  umpiringTeamId: string | null;
  umpiringTeamSource: AssignmentSource | null;
};

export type PlannedUpdate = { matchId: string; planned: PlannedMatch; changes: string[] };

export type SchedulePlan = {
  /** Rows that can't be read. Blocking — a skipped row would look like a cancelled match. */
  problems: RowProblem[];
  /** Team names in the file that match no team in the series. Blocking until mapped. */
  unmatchedTeams: string[];
  /**
   * "Umpire One" values on unplayed matches that aren't a known team. The
   * committee puts the umpiring team's name there, so these are most likely
   * misspellings for the admin to map. Not blocking: the match imports with
   * no umpiring team and an admin can set one on the schedule page.
   */
  unmatchedUmpiringTeams: { name: string; rowNumbers: number[] }[];
  warnings: string[];
  /**
   * "Score Summary" cells that couldn't be turned into innings totals. Not
   * blocking — the result still imports — but the match is left out of net
   * run rate until a later file has readable scores.
   */
  scoreProblems: { rowNumber: number; label: string; message: string }[];
  creates: PlannedMatch[];
  updates: PlannedUpdate[];
  unchangedCount: number;
  /** Saved matches the file no longer has. They're marked cancelled, not deleted. */
  cancels: { matchId: string; label: string }[];
  /** Matches whose umpiring team was set on this site and CricClubs now names a different team. Site value kept. */
  umpireConflicts: { matchId: string; label: string; siteTeam: string; cricclubsTeam: string }[];
  poolChanges: { teamEntryId: string; teamName: string; from: string | null; to: string }[];
};

export const STAGE_LABEL: Record<MatchStage, string> = {
  LEAGUE: "League",
  PRE_QUARTER_FINAL: "Pre-quarter-final",
  QUARTER_FINAL: "Quarter-final",
  SEMI_FINAL: "Semi-final",
  FINAL: "Final",
};

function matchKey(stage: MatchStage, a: string, b: string) {
  return `${stage}|${[a, b].sort().join("|")}`;
}

function sameWhen(a: MatchWhen, b: MatchWhen) {
  return a.timeTbd === b.timeTbd && (a.startsAt?.getTime() ?? null) === (b.startsAt?.getTime() ?? null);
}

/**
 * "date" or "time" when the file leaves out something the saved match
 * already has: a date, or the start time on the same date. Null otherwise —
 * including a move to another date with the time not yet set, which is news.
 */
function knowsLessThanSaved(saved: MatchWhen, file: MatchWhen): "date" | "time" | null {
  if (!saved.startsAt) return null;
  if (!file.startsAt) return "date";
  if (file.timeTbd && !saved.timeTbd && matchDayKey(file.startsAt) === matchDayKey(saved.startsAt)) {
    return "time";
  }
  return null;
}

function sameNames(a: string[], b: string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function sameInnings(a: PlannedInnings[], b: PlannedInnings[]) {
  const key = (i: PlannedInnings) =>
    `${i.number}|${i.battingEntryId}|${i.runs}|${i.wickets}|${i.legalBalls}|${i.allOut}`;
  return a.length === b.length && a.every((v, i) => key(v) === key(b[i]));
}

// Results whose margin is computed from both innings, so both must be there.
const NEEDS_TWO_INNINGS = new Set(["RUNS", "WICKETS", "TIE"]);

/**
 * Turns a row's score summary into innings for the match, or explains why it
 * can't. All out is the last wicket of the side's playing XI (9 wickets with
 * CIL's 10 players a side) — CricClubs' summary doesn't say so explicitly.
 */
function planInnings(
  row: NormalizedMatchRow,
  teamOne: PlanTeam,
  teamTwo: PlanTeam,
  byName: Map<string, PlanTeam>,
  rules: { playersPerSide: number; maxOvers: number },
): { innings: PlannedInnings[] } | { error: string } {
  const parsed = parseScoreSummary(row.scoreSummary);
  if ("error" in parsed) return parsed;

  const innings: PlannedInnings[] = [];
  for (const [i, entry] of parsed.innings.entries()) {
    const team = byName.get(normalizeName(entry.teamName));
    if (!team || (team.id !== teamOne.id && team.id !== teamTwo.id)) {
      return { error: `the score summary names "${entry.teamName}", which isn't either team in the match.` };
    }
    if (innings.some((x) => x.battingEntryId === team.id)) {
      return { error: `the score summary lists ${team.displayName} batting twice.` };
    }
    if (entry.wickets > rules.playersPerSide - 1) {
      return {
        error: `${team.displayName} lost ${entry.wickets} wickets with ${rules.playersPerSide} players a side.`,
      };
    }
    if (entry.legalBalls > rules.maxOvers * 6) {
      return { error: `${team.displayName} batted more than the ${rules.maxOvers}-over quota.` };
    }
    innings.push({
      number: i + 1,
      battingEntryId: team.id,
      runs: entry.runs,
      wickets: entry.wickets,
      legalBalls: entry.legalBalls,
      allOut: entry.wickets === rules.playersPerSide - 1,
    });
  }
  if (innings.length > 2) return { error: "the score summary has more than two innings." };
  if (row.result.resultType && NEEDS_TWO_INNINGS.has(row.result.resultType) && innings.length < 2) {
    return { error: "the result needs both teams' scores, and the score summary doesn't have them." };
  }
  return { innings };
}

export function planScheduleImport(input: {
  records: RawMatchRecord[];
  teams: PlanTeam[];
  existing: ExistingMatch[];
  groupCount: number;
  playersPerSide: number;
  maxOvers: number;
}): SchedulePlan {
  const { records, teams, existing, groupCount } = input;
  const rules = { playersPerSide: input.playersPerSide, maxOvers: input.maxOvers };

  const byName = indexTeamNames(teams);
  const nameOf = (id: string | null) => (id ? (teams.find((t) => t.id === id)?.displayName ?? "?") : "—");
  const label = (stage: MatchStage, a: string | null, b: string | null) =>
    `${nameOf(a)} v ${nameOf(b)} (${STAGE_LABEL[stage]})`;

  const plan: SchedulePlan = {
    problems: [],
    unmatchedTeams: [],
    unmatchedUmpiringTeams: [],
    warnings: [],
    scoreProblems: [],
    creates: [],
    updates: [],
    unchangedCount: 0,
    cancels: [],
    umpireConflicts: [],
    poolChanges: [],
  };

  // 1. Read rows and resolve team names.
  const unmatched = new Set<string>();
  const rows: NormalizedMatchRow[] = [];
  records.forEach((record, i) => {
    const result = normalizeMatchRow(record, i + 1);
    if ("problem" in result) plan.problems.push(result.problem);
    else rows.push(result.row);
  });
  for (const row of rows) {
    for (const name of [row.teamOne, row.teamTwo]) {
      if (!byName.has(normalizeName(name))) unmatched.add(name);
    }
  }
  plan.unmatchedTeams = [...unmatched].sort((a, b) => a.localeCompare(b));
  if (plan.problems.length > 0 || plan.unmatchedTeams.length > 0) return plan;

  // 2. Build the matches the file describes.
  const planned = new Map<string, PlannedMatch>();
  const unmatchedUmpiring = new Map<string, number[]>();
  for (const row of rows) {
    const teamOne = byName.get(normalizeName(row.teamOne))!;
    const teamTwo = byName.get(normalizeName(row.teamTwo))!;
    const key = matchKey(row.stage, teamOne.id, teamTwo.id);

    if (planned.has(key)) {
      plan.problems.push({
        rowNumber: row.rowNumber,
        message: `${teamOne.displayName} v ${teamTwo.displayName} appears twice at the ${STAGE_LABEL[row.stage]} stage (also row ${planned.get(key)!.rowNumber}).`,
      });
      continue;
    }

    // The first umpire slot naming a team is the umpiring team; every other
    // value is a person's name (typically typed in by the scorer).
    let umpiringTeamId: string | null = null;
    const umpireNames: string[] = [];
    for (const value of row.umpireValues) {
      const team = byName.get(normalizeName(value));
      if (team && !umpiringTeamId) {
        if (team.id === teamOne.id || team.id === teamTwo.id) {
          plan.warnings.push(
            `Row ${row.rowNumber}: ${team.displayName} is listed as umpiring its own match — ignored.`,
          );
        } else {
          umpiringTeamId = team.id;
        }
      } else if (!team) {
        umpireNames.push(value);
      }
    }
    // Before a match is played, "Umpire One" should name the umpiring team.
    // (Afterwards scorers often overwrite it with who actually stood.)
    if (row.result.status === "SCHEDULED" && row.umpireOne && !byName.has(normalizeName(row.umpireOne))) {
      const rowsForName = unmatchedUmpiring.get(row.umpireOne) ?? [];
      unmatchedUmpiring.set(row.umpireOne, [...rowsForName, row.rowNumber]);
    }

    let winnerId: string | null = null;
    if (row.result.winnerName) {
      winnerId = byName.get(normalizeName(row.result.winnerName))?.id ?? null;
      if (!winnerId) {
        plan.warnings.push(
          `Row ${row.rowNumber}: winner "${row.result.winnerName}" isn't one of the series' teams — result saved without a winner.`,
        );
      }
    }

    const scores = planInnings(row, teamOne, teamTwo, byName, rules);
    if ("error" in scores) {
      plan.scoreProblems.push({
        rowNumber: row.rowNumber,
        label: `${teamOne.displayName} v ${teamTwo.displayName}`,
        message: scores.error,
      });
    }

    planned.set(key, {
      key,
      rowNumber: row.rowNumber,
      stage: row.stage,
      // Date only: midnight Atlanta time on that date, flagged time TBD.
      startsAt: row.date ? leagueWallTimeToUtc(row.date, row.time ?? "00:00") : null,
      timeTbd: row.date !== null && row.time === null,
      teamOneId: teamOne.id,
      teamTwoId: teamTwo.id,
      ground: row.ground,
      umpireNames,
      result: { ...row.result, winnerId },
      innings: "error" in scores ? null : scores.innings,
      umpiringTeamId,
      umpiringTeamSource: umpiringTeamId ? "IMPORT" : null,
    });
  }
  plan.unmatchedUmpiringTeams = [...unmatchedUmpiring.entries()]
    .map(([name, rowNumbers]) => ({ name, rowNumbers }))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (plan.problems.length > 0) return plan;

  // 3. Compare with what's saved.
  const existingByKey = new Map<string, ExistingMatch>();
  for (const match of existing) {
    if (match.teamOneId && match.teamTwoId) {
      existingByKey.set(matchKey(match.stage, match.teamOneId, match.teamTwoId), match);
    }
  }

  for (const [key, next] of planned) {
    const current = existingByKey.get(key);
    if (!current) {
      plan.creates.push(next);
      continue;
    }

    // Umpiring team: an admin's choice on this site wins over the file; a
    // blank or person-name slot in the file never clears an assignment
    // (scorers overwrite "Umpire One" with whoever actually stood).
    if (next.umpiringTeamId === null) {
      next.umpiringTeamId = current.umpiringTeamId;
      next.umpiringTeamSource = current.umpiringTeamSource;
    } else if (current.umpiringTeamSource === "ADMIN" && current.umpiringTeamId !== next.umpiringTeamId) {
      plan.umpireConflicts.push({
        matchId: current.id,
        label: label(next.stage, next.teamOneId, next.teamTwoId),
        siteTeam: nameOf(current.umpiringTeamId),
        cricclubsTeam: nameOf(next.umpiringTeamId),
      });
      next.umpiringTeamId = current.umpiringTeamId;
      next.umpiringTeamSource = "ADMIN";
    } else if (current.umpiringTeamSource === "ADMIN") {
      next.umpiringTeamSource = "ADMIN";
    }

    const lessKnown = knowsLessThanSaved(current, next);
    if (lessKnown) {
      plan.warnings.push(
        `Row ${next.rowNumber}: ${label(next.stage, next.teamOneId, next.teamTwoId)} has no ${lessKnown} in the file — kept the saved ${formatMatchWhen(current)}.`,
      );
      next.startsAt = current.startsAt;
      next.timeTbd = current.timeTbd;
    }

    const changes: string[] = [];
    if (current.status === "CANCELLED") changes.push("back on the schedule");
    if (!sameWhen(current, next)) {
      changes.push(`date/time ${formatMatchWhen(current)} → ${formatMatchWhen(next)}`);
    }
    if (normalizeName(current.groundName ?? "") !== normalizeName(next.ground)) {
      changes.push(`ground ${current.groundName ?? "—"} → ${next.ground || "—"}`);
    }
    if (current.umpiringTeamId !== next.umpiringTeamId) {
      changes.push(`umpiring team ${nameOf(current.umpiringTeamId)} → ${nameOf(next.umpiringTeamId)}`);
    }
    if ((current.resultText ?? null) !== next.result.text) {
      changes.push(next.result.text ? `result: ${next.result.text}` : "result cleared");
    }

    // Scores normally arrive with the result; only call them out on their own.
    const inningsChanged = next.innings !== null && !sameInnings(current.innings, next.innings);
    if (inningsChanged && changes.length === 0) changes.push("scores updated");

    const silentChange =
      current.teamOneId !== next.teamOneId ||
      !sameNames(current.umpireNames, next.umpireNames) ||
      inningsChanged;

    if (changes.length > 0 || silentChange) {
      plan.updates.push({ matchId: current.id, planned: next, changes });
    }
    if (changes.length === 0) plan.unchangedCount++;
  }

  for (const match of existing) {
    if (match.status === "CANCELLED" || !match.teamOneId || !match.teamTwoId) continue;
    if (!planned.has(matchKey(match.stage, match.teamOneId, match.teamTwoId))) {
      plan.cancels.push({ matchId: match.id, label: label(match.stage, match.teamOneId, match.teamTwoId) });
    }
  }

  plan.poolChanges = inferPools([...planned.values()], teams, groupCount, plan.warnings);
  return plan;
}

const POOL_LABELS = ["A", "B", "C", "D"];

/**
 * League matches only happen within a pool, so the pools are the connected
 * groups of the league fixture graph. Keeps an existing labelling when it
 * already describes the same groups (an admin may have swapped A and B to
 * match CricClubs); otherwise labels groups A, B, … in order of first
 * appearance in the file.
 */
function inferPools(
  matches: PlannedMatch[],
  teams: PlanTeam[],
  groupCount: number,
  warnings: string[],
): SchedulePlan["poolChanges"] {
  const league = [...matches].filter((m) => m.stage === "LEAGUE").sort((a, b) => a.rowNumber - b.rowNumber);
  if (league.length === 0) return [];

  const parent = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    if (p === x) return x;
    const root = find(p);
    parent.set(x, root);
    return root;
  };
  const order: string[] = [];
  for (const m of league) {
    for (const id of [m.teamOneId, m.teamTwoId]) {
      if (!parent.has(id)) {
        parent.set(id, id);
        order.push(id);
      }
    }
    const [ra, rb] = [find(m.teamOneId), find(m.teamTwoId)];
    if (ra !== rb) parent.set(ra, rb);
  }

  const groups = new Map<string, string[]>();
  for (const id of order) {
    const root = find(id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(id);
  }
  const groupList = [...groups.values()];

  if (groupList.length !== groupCount || groupCount > POOL_LABELS.length) {
    warnings.push(
      `Pools weren't updated: the league fixtures form ${groupList.length} separate group${groupList.length === 1 ? "" : "s"} of teams, not ${groupCount}. Set pools on the Teams page if needed.`,
    );
    return [];
  }

  const poolOf = new Map(teams.map((t) => [t.id, t.pool]));
  const currentLabels = groupList.map((ids) => new Set(ids.map((id) => poolOf.get(id) ?? null)));
  // Every group already has one shared, non-empty label, and no two groups share it.
  const keepCurrent =
    currentLabels.every((s) => s.size === 1 && [...s][0] !== null) &&
    new Set(currentLabels.map((s) => [...s][0])).size === groupList.length;

  const changes: SchedulePlan["poolChanges"] = [];
  groupList.forEach((ids, i) => {
    const target = keepCurrent ? ([...currentLabels[i]][0] as string) : POOL_LABELS[i];
    for (const id of ids) {
      const from = poolOf.get(id) ?? null;
      if (from !== target) {
        changes.push({
          teamEntryId: id,
          teamName: teams.find((t) => t.id === id)?.displayName ?? "?",
          from,
          to: target,
        });
      }
    }
  });
  return changes;
}
