import { createHash } from "node:crypto";
import type { MatchStatus, ResultType } from "@/generated/prisma";

// League-stage standings, computed on read from matches + innings totals
// (CLAUDE.md: stats are derived, never stored). Pure — the service loads the
// rows and calls computePoolStandings once per pool. No database here, so the
// tie-break cascade can be tested directly.
//
// Ordering (architecture.md §1.2), applied as a cascade, not one sort:
//   1. points
//   2. net run rate, compared at its published 4 decimal places
//   3. head-to-head result (two teams level)
//   4. most wins in the matches among the tied teams (three or more level)
//   5. most wickets taken in the league stage
//   6. a random draw, seeded so the page doesn't reshuffle on every load
// Whenever a level splits a tied group, each smaller group that is still level
// starts again from step 3 with only its own members — so a three-way tie that
// leaves two teams level is settled between those two by their own match.

export type StandingsTeam = { id: string; name: string };

export type StandingsInnings = {
  battingEntryId: string;
  runs: number;
  wickets: number;
  legalBalls: number;
  allOut: boolean;
};

export type StandingsMatch = {
  id: string;
  teamOneId: string;
  teamTwoId: string;
  status: MatchStatus;
  resultType: ResultType | null;
  winnerId: string | null;
  /** The match's overs per side: its own override, else the series' max overs. */
  oversQuota: number;
  /** Regular innings only (no super overs). */
  innings: StandingsInnings[];
};

export type StandingsAdjustmentInput = { teamEntryId: string; pointsDelta: number; runsDelta: number };

export type PointsScale = { win: number; loss: number; tie: number; noResult: number };

export type TieBreakLevel = "HEAD_TO_HEAD" | "WINS_AMONG_TIED" | "WICKETS_TAKEN" | "DRAW";

export const TIE_BREAK_LABEL: Record<TieBreakLevel, string> = {
  HEAD_TO_HEAD: "head-to-head result",
  WINS_AMONG_TIED: "wins in matches between the tied teams",
  WICKETS_TAKEN: "wickets taken",
  DRAW: "a drawn lot",
};

export type StandingsRow = {
  position: number;
  team: StandingsTeam;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  /** Net run rate rounded to 4 decimal places — the value that's published and compared. */
  nrr: number;
  runsFor: number;
  ballsFaced: number;
  runsAgainst: number;
  ballsBowled: number;
  wicketsTaken: number;
  /** Set when the team was level on points and NRR with a neighbour: what put it in this place. */
  tieBreak: TieBreakLevel | null;
};

/** Matches that were played but can't be scored (unknown CricClubs wording, no winner). */
export type UncountedMatch = { matchId: string };

type Tally = Omit<StandingsRow, "position" | "nrr" | "tieBreak">;

function emptyTally(team: StandingsTeam): Tally {
  return {
    team,
    played: 0,
    won: 0,
    lost: 0,
    tied: 0,
    noResult: 0,
    points: 0,
    runsFor: 0,
    ballsFaced: 0,
    runsAgainst: 0,
    ballsBowled: 0,
    wicketsTaken: 0,
  };
}

type Outcome = { kind: "WIN"; winnerId: string } | { kind: "TIE" } | { kind: "NO_RESULT" } | null;

/** How a match counts in the table, or null if it doesn't (not played, or a result we can't score). */
function outcomeOf(m: StandingsMatch): Outcome {
  if (m.status === "ABANDONED" || m.resultType === "NO_RESULT") return { kind: "NO_RESULT" };
  if (m.status !== "COMPLETED") return null;
  if (m.resultType === "TIE") return { kind: "TIE" };
  if (m.winnerId === m.teamOneId || m.winnerId === m.teamTwoId) return { kind: "WIN", winnerId: m.winnerId };
  return null;
}

/**
 * Whether a match feeds net run rate. Forfeits never do (rule book: "no NRR
 * change"); no-results don't either, as in the ICC's playing conditions
 * (still an open question for the committee — STATUS.md). A decided match
 * without both innings totals can't be included.
 */
function countsForNrr(m: StandingsMatch, outcome: Outcome) {
  if (!outcome || outcome.kind === "NO_RESULT") return false;
  if (m.resultType === "FORFEIT") return false;
  const sides = new Set(m.innings.map((i) => i.battingEntryId));
  return sides.has(m.teamOneId) && sides.has(m.teamTwoId);
}

/** Balls an innings is charged for NRR: the full quota if the side was bowled out. */
function chargedBalls(i: StandingsInnings, oversQuota: number) {
  return i.allOut ? oversQuota * 6 : i.legalBalls;
}

export function roundNrr(value: number) {
  const rounded = Math.round(value * 10_000) / 10_000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** Deterministic "random" order for the last-resort draw: sha256(seed:teamEntryId), ascending. */
export function drawKey(seed: string, teamEntryId: string) {
  return createHash("sha256").update(`${seed}:${teamEntryId}`).digest("hex");
}

/**
 * Builds one pool's table. `matches` may include matches outside the pool
 * (they're ignored), but should be league-stage only. `seed` drives the final
 * random draw — the service passes the series id, so the draw is fixed for a
 * season and only changes if the tied teams change.
 */
export function computePoolStandings(input: {
  teams: StandingsTeam[];
  matches: StandingsMatch[];
  adjustments: StandingsAdjustmentInput[];
  points: PointsScale;
  seed: string;
}): { rows: StandingsRow[]; uncounted: UncountedMatch[] } {
  const tallies = new Map(input.teams.map((t) => [t.id, emptyTally(t)]));
  const poolMatches = input.matches.filter((m) => tallies.has(m.teamOneId) && tallies.has(m.teamTwoId));
  const uncounted: UncountedMatch[] = [];
  const decided: { winnerId: string; loserId: string }[] = [];

  for (const m of poolMatches) {
    const outcome = outcomeOf(m);
    if (!outcome) {
      if (m.status === "COMPLETED") uncounted.push({ matchId: m.id });
      continue;
    }
    const one = tallies.get(m.teamOneId)!;
    const two = tallies.get(m.teamTwoId)!;
    one.played++;
    two.played++;

    if (outcome.kind === "WIN") {
      const [winner, loser] = outcome.winnerId === m.teamOneId ? [one, two] : [two, one];
      winner.won++;
      winner.points += input.points.win;
      loser.lost++;
      loser.points += input.points.loss;
      decided.push({ winnerId: winner.team.id, loserId: loser.team.id });
    } else if (outcome.kind === "TIE") {
      for (const t of [one, two]) {
        t.tied++;
        t.points += input.points.tie;
      }
    } else {
      for (const t of [one, two]) {
        t.noResult++;
        t.points += input.points.noResult;
      }
    }

    if (countsForNrr(m, outcome)) {
      for (const inn of m.innings) {
        const batting = tallies.get(inn.battingEntryId);
        const bowling = inn.battingEntryId === m.teamOneId ? two : one;
        if (!batting) continue;
        const balls = chargedBalls(inn, m.oversQuota);
        batting.runsFor += inn.runs;
        batting.ballsFaced += balls;
        bowling.runsAgainst += inn.runs;
        bowling.ballsBowled += balls;
        bowling.wicketsTaken += inn.wickets;
      }
    }
  }

  // Committee penalties sit on top of the computed figures, never replace them.
  for (const adj of input.adjustments) {
    const t = tallies.get(adj.teamEntryId);
    if (!t) continue;
    t.points += adj.pointsDelta;
    t.runsFor += adj.runsDelta;
  }

  const rows = rankTeams([...tallies.values()], decided, input.seed);
  return { rows, uncounted };
}

type Ranked = { tally: Tally; nrr: number; tieBreak: TieBreakLevel | null };

/** Splits `items` into runs of equal key, best (highest) key first. */
function partitionDesc<T>(items: T[], key: (item: T) => number | string): T[][] {
  const sorted = [...items].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return ka === kb ? 0 : ka > kb ? -1 : 1;
  });
  const groups: T[][] = [];
  for (const item of sorted) {
    const last = groups[groups.length - 1];
    if (last && key(last[0]) === key(item)) last.push(item);
    else groups.push([item]);
  }
  return groups;
}

function rankTeams(
  tallies: Tally[],
  decided: { winnerId: string; loserId: string }[],
  seed: string,
): StandingsRow[] {
  const items: Ranked[] = tallies.map((tally) => ({ tally, nrr: netRunRate(tally), tieBreak: null }));

  const ordered: Ranked[] = [];
  for (const byPoints of partitionDesc(items, (r) => r.tally.points)) {
    for (const level of partitionDesc(byPoints, (r) => r.nrr)) {
      ordered.push(...breakTie(level, decided, seed));
    }
  }

  return ordered.map((r, i) => ({ position: i + 1, ...r.tally, nrr: r.nrr, tieBreak: r.tieBreak }));
}

/** Runs per over scored minus runs per over conceded, rounded to 4 places. */
function netRunRate(t: Tally) {
  const forRate = t.ballsFaced > 0 ? (t.runsFor * 6) / t.ballsFaced : 0;
  const againstRate = t.ballsBowled > 0 ? (t.runsAgainst * 6) / t.ballsBowled : 0;
  return roundNrr(forRate - againstRate);
}

/** Wins each team has over the others in `group`. */
function winsAmong(group: Ranked[], decided: { winnerId: string; loserId: string }[]) {
  const ids = new Set(group.map((r) => r.tally.team.id));
  const wins = new Map<string, number>(group.map((r) => [r.tally.team.id, 0]));
  for (const d of decided) {
    if (ids.has(d.winnerId) && ids.has(d.loserId)) wins.set(d.winnerId, wins.get(d.winnerId)! + 1);
  }
  return wins;
}

/**
 * Orders a group level on points and NRR (levels 3–6 of the cascade). Any
 * level that splits the group hands each still-level subgroup back to the
 * start of this function, so it's compared only among its own members.
 */
function breakTie(group: Ranked[], decided: { winnerId: string; loserId: string }[], seed: string): Ranked[] {
  if (group.length === 1) return group;

  const split = (parts: Ranked[][], level: TieBreakLevel) => {
    for (const r of group) r.tieBreak = level;
    return parts.flatMap((part) => breakTie(part, decided, seed));
  };

  // 3 (two teams) / 4 (three or more): wins in matches among the group. For
  // two teams that's exactly their head-to-head result; a tied, abandoned or
  // unplayed meeting leaves them level.
  const wins = winsAmong(group, decided);
  const byWins = partitionDesc(group, (r) => wins.get(r.tally.team.id)!);
  if (byWins.length > 1) return split(byWins, group.length === 2 ? "HEAD_TO_HEAD" : "WINS_AMONG_TIED");

  // 5: most wickets taken across the league stage.
  const byWickets = partitionDesc(group, (r) => r.tally.wicketsTaken);
  if (byWickets.length > 1) return split(byWickets, "WICKETS_TAKEN");

  // Nobody in the group has played yet (the start of the season): list them
  // alphabetically rather than by a draw nobody needs.
  if (group.every((r) => r.tally.played === 0)) {
    for (const r of group) r.tieBreak = null;
    return [...group].sort((a, b) => a.tally.team.name.localeCompare(b.tally.team.name));
  }

  // 6: the draw.
  for (const r of group) r.tieBreak = "DRAW";
  return [...group].sort((a, b) =>
    drawKey(seed, a.tally.team.id).localeCompare(drawKey(seed, b.tally.team.id)),
  );
}
