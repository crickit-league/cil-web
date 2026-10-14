import { z } from "zod";
import type { MatchStage, MatchStatus } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { recordAudit } from "@/lib/services/audit";
import { findCurrentSeries } from "@/lib/services/series";

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
  status: true,
  resultText: true,
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
} as const;

export type ScheduleMatch = {
  id: string;
  stage: MatchStage;
  startsAt: Date;
  status: MatchStatus;
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
  startsAt: Date;
  status: MatchStatus;
  resultText: string | null;
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
};

function toScheduleMatch(m: ScheduleRow): ScheduleMatch {
  const team = (t: { id: string; displayName: string } | null) =>
    t ? { id: t.id, name: t.displayName } : null;
  return {
    id: m.id,
    stage: m.stage,
    startsAt: m.startsAt,
    status: m.status,
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
 * The Fixtures tab: matches still to be played (results land on the Results
 * tab), optionally for one team — playing or umpiring. Umpire names are
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
      status: "SCHEDULED",
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
    matches: matches.map(toScheduleMatch),
  };
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
    matches: matches.map((m) => ({ ...toScheduleMatch(m), umpiringTeamSource: m.umpiringTeamSource })),
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
