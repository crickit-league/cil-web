import { z } from "zod";
import type { MatchStage, MatchStatus, ResultType } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { recordAudit } from "@/lib/services/audit";
import { findCurrentSeries } from "@/lib/services/series";
import { compareMatchWhen } from "@/lib/time";
import { pickMatchday, type Matchday } from "@/lib/matchday";

export class MatchNotFoundError extends Error {
  constructor() {
    super("That match no longer exists.");
    this.name = "MatchNotFoundError";
  }
}

export class InvalidUmpiringTeamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUmpiringTeamError";
  }
}

const scheduleSelect = {
  id: true,
  stage: true,
  startsAt: true,
  timeTbd: true,
  status: true,
  resultType: true,
  resultText: true,
  marginRuns: true,
  marginWickets: true,
  winner: { select: { id: true, displayName: true } },
  teamOne: { select: { id: true, displayName: true } },
  teamTwo: { select: { id: true, displayName: true } },
  teamOneSource: true,
  teamTwoSource: true,
  umpiringTeam: { select: { id: true, displayName: true } },
  field: { select: { label: true, ground: { select: { name: true } } } },
  // Phones are selected only to turn into `hasPhones` in toScheduleMatch;
  // the numbers themselves never leave this file (see umpire-nominations.ts).
  umpireNomination: {
    select: { umpireOneName: true, umpireOnePhone: true, umpireTwoName: true, umpireTwoPhone: true },
  },
  innings: {
    where: { isSuperOver: false },
    select: { battingEntryId: true, runs: true, wickets: true, legalBalls: true },
    orderBy: { number: "asc" },
  },
} as const;

/**
 * How a played match is shown on a fixture card. "win" splits out the winner
 * so it can be emphasised ("Sharks" + "won by 5 wickets"); everything else is
 * one line. Null while the match is still to be played.
 */
export type MatchResult =
  | { kind: "win"; winner: { id: string; name: string }; text: string }
  | { kind: "other"; text: string }
  | null;

/** One side's total on a played match, from the imported score summary. */
export type MatchScore = {
  team: { id: string; name: string };
  runs: number;
  wickets: number;
  legalBalls: number;
};

/** Scheduled or completed, for the fixture badge. Abandoned matches are completed (no result). */
export type FixtureStatus = "SCHEDULED" | "COMPLETED";

export type ScheduleMatch = {
  id: string;
  stage: MatchStage;
  /** Null while the date is TBD; see MatchWhen in lib/time.ts. */
  startsAt: Date | null;
  timeTbd: boolean;
  status: MatchStatus;
  fixtureStatus: FixtureStatus;
  result: MatchResult;
  /** Innings totals in batting order; empty until scores are imported (or when no ball was bowled). */
  scores: MatchScore[];
  resultText: string | null;
  teamOne: { id: string; name: string } | null;
  teamTwo: { id: string; name: string } | null;
  /** Placeholder like "A1" or "W:PQ4" when the team isn't known yet. */
  teamOneSource: string | null;
  teamTwoSource: string | null;
  umpiringTeam: { id: string; name: string } | null;
  ground: string | null;
  /** Nominated umpires' names (public). Never the phone numbers. */
  umpires: { one: string | null; two: string | null; hasPhones: boolean };
};

type ScheduleRow = {
  id: string;
  stage: MatchStage;
  /** Null while the date is TBD; see MatchWhen in lib/time.ts. */
  startsAt: Date | null;
  timeTbd: boolean;
  status: MatchStatus;
  resultType: ResultType | null;
  resultText: string | null;
  marginRuns: number | null;
  marginWickets: number | null;
  winner: { id: string; displayName: string } | null;
  teamOne: { id: string; displayName: string } | null;
  teamTwo: { id: string; displayName: string } | null;
  teamOneSource: string | null;
  teamTwoSource: string | null;
  umpiringTeam: { id: string; displayName: string } | null;
  field: { label: string; ground: { name: string } } | null;
  umpireNomination: {
    umpireOneName: string | null;
    umpireOnePhone: string | null;
    umpireTwoName: string | null;
    umpireTwoPhone: string | null;
  } | null;
  innings: { battingEntryId: string; runs: number; wickets: number; legalBalls: number }[];
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Builds the result line from what the import stored on Match (see parseResult). */
function describeResult(m: ScheduleRow): MatchResult {
  if (m.status === "SCHEDULED" || m.status === "CANCELLED") return null;
  if (m.status === "ABANDONED") return { kind: "other", text: "No result — match abandoned" };

  const winner = m.winner ? { id: m.winner.id, name: m.winner.displayName } : null;
  switch (m.resultType) {
    case "RUNS":
      if (winner && m.marginRuns !== null)
        return { kind: "win", winner, text: `won by ${plural(m.marginRuns, "run")}` };
      break;
    case "WICKETS":
      if (winner && m.marginWickets !== null)
        return { kind: "win", winner, text: `won by ${plural(m.marginWickets, "wicket")}` };
      break;
    case "SUPER_OVER":
      if (winner) return { kind: "win", winner, text: "won the super over" };
      break;
    case "TIE":
      return { kind: "other", text: "Match tied" };
    case "NO_RESULT":
      return { kind: "other", text: "No result" };
    case "FORFEIT":
      // Not CricClubs' own wording ("Forfeited. Winner: Sharks"): that has the
      // name as it was then, and a renamed team must show its current name.
      if (winner) return { kind: "win", winner, text: "won by forfeit" };
      break;
  }
  return { kind: "other", text: m.resultText ?? "Result to be confirmed" };
}

/** The result as one line of text, with the winner's current name. */
export function resultSummary(result: MatchResult): string | null {
  if (!result) return null;
  return result.kind === "win" ? `${result.winner.name} ${result.text}` : result.text;
}

function toScheduleMatch(m: ScheduleRow): ScheduleMatch {
  const team = (t: { id: string; displayName: string } | null) =>
    t ? { id: t.id, name: t.displayName } : null;
  return {
    id: m.id,
    stage: m.stage,
    startsAt: m.startsAt,
    timeTbd: m.timeTbd,
    status: m.status,
    fixtureStatus: m.status === "SCHEDULED" ? "SCHEDULED" : "COMPLETED",
    result: describeResult(m),
    scores: m.innings.flatMap(({ battingEntryId, ...totals }) => {
      const batting = [m.teamOne, m.teamTwo].find((t) => t?.id === battingEntryId);
      return batting ? [{ team: { id: batting.id, name: batting.displayName }, ...totals }] : [];
    }),
    resultText: m.resultText,
    teamOne: team(m.teamOne),
    teamTwo: team(m.teamTwo),
    teamOneSource: m.teamOneSource,
    teamTwoSource: m.teamTwoSource,
    umpiringTeam: team(m.umpiringTeam),
    ground: m.field
      ? m.field.label
        ? `${m.field.ground.name} ${m.field.label}`
        : m.field.ground.name
      : null,
    umpires: {
      one: m.umpireNomination?.umpireOneName ?? null,
      two: m.umpireNomination?.umpireTwoName ?? null,
      hasPhones: Boolean(m.umpireNomination?.umpireOnePhone || m.umpireNomination?.umpireTwoPhone),
    },
  };
}

/**
 * The Fixtures tab: every match of the series, played or not, in fixture
 * order (compareMatchWhen: date-TBD first, newest day first, times
 * earliest first within a day) —
 * played ones carry their result — optionally for one team, playing or
 * umpiring. Cancelled matches (dropped from a later CricClubs file) are left out. Umpire names are
 * public; phone numbers are not in here (see revealUmpirePhones).
 */
export async function getPublicFixtures(filter: { teamEntryId?: string } = {}) {
  const { season, series } = await findCurrentSeries();
  if (!series) return { season, series: null, teams: [], selectedTeamId: null, matches: [] };

  const teams = await prisma.teamEntry.findMany({
    where: { seriesId: series.id },
    select: { id: true, displayName: true },
    orderBy: { displayName: "asc" },
  });
  const teamFilter = teams.some((t) => t.id === filter.teamEntryId) ? filter.teamEntryId : undefined;

  const matches = await prisma.match.findMany({
    where: {
      seriesId: series.id,
      status: { not: "CANCELLED" },
      ...(teamFilter
        ? { OR: [{ teamOneId: teamFilter }, { teamTwoId: teamFilter }, { umpiringTeamId: teamFilter }] }
        : {}),
    },
    select: scheduleSelect,
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
  });

  return {
    season,
    series: { name: series.name, umpireEntryLocked: series.umpireEntryLocked },
    teams: teams.map((t) => ({ id: t.id, name: t.displayName })),
    selectedTeamId: teamFilter ?? null,
    matches: matches.map(toScheduleMatch).sort(compareMatchWhen),
  };
}

export type HomeMatchday = Matchday<ScheduleMatch>;

/**
 * The home page's last-weekend results and this-weekend fixtures (see
 * pickMatchday). Never throws: the home page must render even if the DB is
 * unreachable, so a failure is logged and comes back as null.
 */
export async function getHomeMatchday(now = new Date()): Promise<HomeMatchday | null> {
  try {
    const { series, matches } = await getPublicFixtures();
    if (!series) return null;
    return pickMatchday(matches, now);
  } catch (error) {
    console.error("Failed to load the home page matchday:", error);
    return null;
  }
}

/** One fixture for its public page (the umpire form), or null. */
export async function getPublicFixture(matchId: string) {
  const match = await prisma.match.findFirst({
    where: { id: matchId, status: { not: "CANCELLED" } },
    select: { ...scheduleSelect, series: { select: { name: true, umpireEntryLocked: true } } },
  });
  if (!match) return null;
  return {
    match: toScheduleMatch(match),
    series: match.series,
    // What the public form may do; admins edit from the admin schedule instead.
    canEditUmpires: !match.series.umpireEntryLocked && match.status === "SCHEDULED",
  };
}

/** Admin schedule: every non-cancelled match plus where its umpiring team came from. */
export async function getAdminSchedule(user: SessionUser) {
  if (!can(user, "manage-league")) throw new ForbiddenError();

  const { series } = await findCurrentSeries();
  if (!series) return { series: null, teams: [], matches: [], lastImport: null };

  const [teams, matches, lastImport] = await Promise.all([
    prisma.teamEntry.findMany({
      where: { seriesId: series.id },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.match.findMany({
      where: { seriesId: series.id, status: { not: "CANCELLED" } },
      select: { ...scheduleSelect, umpiringTeamSource: true },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    }),
    prisma.importRun.findFirst({
      where: { seriesId: series.id, kind: "CRICCLUBS_MATCHES", status: "COMMITTED" },
      orderBy: { committedAt: "desc" },
      select: { fileName: true, committedAt: true, startedBy: { select: { email: true } } },
    }),
  ]);

  return {
    series: { id: series.id, name: series.name, umpireEntryLocked: series.umpireEntryLocked },
    teams: teams.map((t) => ({ id: t.id, name: t.displayName })),
    matches: matches
      .map((m) => ({ ...toScheduleMatch(m), umpiringTeamSource: m.umpiringTeamSource }))
      .sort(compareMatchWhen),
    lastImport,
  };
}

const setUmpiringTeamSchema = z.object({
  // "" = no umpiring team.
  teamEntryId: z.string().transform((v) => v || null),
});

/**
 * Admin override of a match's umpiring team. Marked ADMIN so later CricClubs
 * imports keep it (the import preview lists any disagreement instead).
 * Doesn't send email — umpire emails are always sent by hand.
 */
export async function setUmpiringTeam(user: SessionUser, matchId: string, input: unknown) {
  if (!can(user, "manage-league")) throw new ForbiddenError();
  const { teamEntryId } = setUmpiringTeamSchema.parse(input);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      seriesId: true,
      teamOneId: true,
      teamTwoId: true,
      umpiringTeamId: true,
      umpiringTeam: { select: { displayName: true } },
      teamOne: { select: { displayName: true } },
      teamTwo: { select: { displayName: true } },
    },
  });
  if (!match) throw new MatchNotFoundError();

  let newName: string | null = null;
  if (teamEntryId) {
    if (teamEntryId === match.teamOneId || teamEntryId === match.teamTwoId) {
      throw new InvalidUmpiringTeamError("A team can't umpire its own match.");
    }
    const entry = await prisma.teamEntry.findFirst({
      where: { id: teamEntryId, seriesId: match.seriesId },
      select: { displayName: true },
    });
    if (!entry) throw new InvalidUmpiringTeamError("That team isn't in this series.");
    newName = entry.displayName;
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: { umpiringTeamId: teamEntryId, umpiringTeamSource: "ADMIN" },
    });
    await recordAudit(tx, user, {
      action: "match.setUmpiringTeam",
      entityType: "Match",
      entityId: matchId,
      summary: `set the umpiring team for ${match.teamOne?.displayName ?? "TBD"} v ${match.teamTwo?.displayName ?? "TBD"} to ${newName ?? "none"}`,
      changes: { umpiringTeam: [match.umpiringTeam?.displayName ?? null, newName] },
    });
  });
}
