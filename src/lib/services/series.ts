import { Prisma, type RosterRole } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { recordAudit } from "@/lib/services/audit";
import { createSeriesSchema, setPoolSchema } from "@/lib/validation/league";

export class NoCurrentSeasonError extends Error {
  constructor() {
    super("There is no current season to add a series to.");
    this.name = "NoCurrentSeasonError";
  }
}

export class SeriesNotFoundError extends Error {
  constructor() {
    super("That series no longer exists.");
    this.name = "SeriesNotFoundError";
  }
}

export class TeamEntryNotFoundError extends Error {
  constructor() {
    super("That team is no longer in the series.");
    this.name = "TeamEntryNotFoundError";
  }
}

// Registrations in these states never become teams; everything else counts
// as submitted (the committee's call: every submitted team plays).
const EXCLUDED_REGISTRATION_STATUSES = ["WITHDRAWN", "REJECTED"] as const;

/**
 * The season the site is currently about: the newest one that isn't
 * upcoming or archived. 2026-27 is still REGISTRATION_OPEN in production
 * (see STATUS.md), so that status counts as current too.
 */
async function findCurrentSeason() {
  return prisma.season.findFirst({
    where: { status: { in: ["REGISTRATION_OPEN", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * The current season's main series — the earliest-starting one, which is the
 * Winter Championship; side series like E8 start later in the season.
 */
export async function findCurrentSeries() {
  const season = await findCurrentSeason();
  if (!season) return { season: null, series: null };
  const series = await prisma.series.findFirst({
    where: { seasonId: season.id },
    orderBy: { startDate: "asc" },
  });
  return { season, series };
}

const leadershipSelect = {
  where: { role: { in: ["CAPTAIN", "VICE_CAPTAIN"] as RosterRole[] } },
  select: { role: true, person: { select: { fullName: true } } },
} satisfies Prisma.TeamEntry$rosterArgs;

function leadersOf(roster: { role: RosterRole; person: { fullName: string } }[]) {
  return {
    captain: roster.find((r) => r.role === "CAPTAIN")?.person.fullName ?? null,
    viceCaptain: roster.find((r) => r.role === "VICE_CAPTAIN")?.person.fullName ?? null,
  };
}

/** Everything the admin Teams screen needs, in one call. */
export async function getSeriesAdminView(user: SessionUser) {
  if (!can(user, "manage-league")) {
    throw new ForbiddenError();
  }

  const { season, series } = await findCurrentSeries();
  if (!season) return { season: null, series: null, teams: [], pendingRegistrations: 0 };

  const pendingRegistrations = await prisma.registration.count({
    where: {
      seasonId: season.id,
      status: { notIn: [...EXCLUDED_REGISTRATION_STATUSES] },
      teamEntry: null,
    },
  });

  if (!series) {
    return { season: { id: season.id, name: season.name }, series: null, teams: [], pendingRegistrations };
  }

  const entries = await prisma.teamEntry.findMany({
    where: { seriesId: series.id },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true, pool: true, roster: leadershipSelect },
  });

  return {
    season: { id: season.id, name: season.name },
    series: {
      id: series.id,
      name: series.name,
      startDate: series.startDate,
      maxOvers: series.maxOvers,
      playersPerSide: series.playersPerSide,
      groupCount: series.groupCount,
      winPoints: series.winPoints,
      tiePoints: series.tiePoints,
      noResultPoints: series.noResultPoints,
    },
    teams: entries.map((e) => ({ id: e.id, name: e.displayName, pool: e.pool, ...leadersOf(e.roster) })),
    pendingRegistrations,
  };
}

/**
 * Creates the current season's series. Format columns keep their schema
 * defaults, which are the Winter Championship's (15 overs, 10 a side, two
 * pools, 2/0/1/1 points).
 */
export async function createSeries(user: SessionUser, input: unknown) {
  if (!can(user, "manage-league")) {
    throw new ForbiddenError();
  }
  const data = createSeriesSchema.parse(input);

  const season = await findCurrentSeason();
  if (!season) {
    throw new NoCurrentSeasonError();
  }

  return prisma.$transaction(async (tx) => {
    const series = await tx.series.create({
      data: {
        seasonId: season.id,
        name: data.name,
        status: "UPCOMING",
        startDate: new Date(`${data.startDate}T00:00:00Z`),
      },
    });
    await recordAudit(tx, user, {
      action: "series.create",
      entityType: "Series",
      entityId: series.id,
      summary: `created series "${series.name}"`,
    });
    return series;
  });
}

/**
 * Reuses a Person with the same email when there is one (a captain who also
 * registered last year, or who already has a site account), otherwise creates
 * one. Links the Person to a User account with that email if neither is
 * linked yet, so a captain's sign-in finds their team later.
 */
async function findOrCreatePerson(
  tx: Prisma.TransactionClient,
  fullName: string,
  email: string | null,
  phone: string | null,
) {
  const normalizedEmail = email?.trim().toLowerCase() || null;

  if (normalizedEmail) {
    const existing = await tx.person.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      orderBy: { createdAt: "asc" },
    });
    if (existing) return existing;
  }

  const user = normalizedEmail
    ? await tx.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" }, person: null },
        select: { id: true },
      })
    : null;

  return tx.person.create({
    data: {
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      userId: user?.id,
    },
  });
}

export type AddTeamsResult = {
  added: string[];
  skipped: { teamName: string; reason: string }[];
};

/**
 * Turns every submitted registration in the series' season that isn't yet a
 * team into one: Team (reused by exact name, so a returning team keeps its
 * history), TeamEntry, and the captain/vice-captain as People on the roster.
 * The registration is marked APPROVED. Safe to re-run — registrations that
 * already have a team are skipped. Each registration is its own transaction,
 * so one bad row (e.g. the same captain on two teams) doesn't block the rest.
 */
export async function addRegistrationsToSeries(user: SessionUser, seriesId: string): Promise<AddTeamsResult> {
  if (!can(user, "manage-league")) {
    throw new ForbiddenError();
  }

  const series = await prisma.series.findUnique({ where: { id: seriesId } });
  if (!series) {
    throw new SeriesNotFoundError();
  }

  const registrations = await prisma.registration.findMany({
    where: {
      seasonId: series.seasonId,
      status: { notIn: [...EXCLUDED_REGISTRATION_STATUSES] },
      teamEntry: null,
    },
    orderBy: { createdAt: "asc" },
  });

  const result: AddTeamsResult = { added: [], skipped: [] };

  for (const reg of registrations) {
    const teamName = reg.teamName.trim();
    try {
      await prisma.$transaction(async (tx) => {
        const team = await tx.team.upsert({
          where: { name: teamName },
          update: {},
          create: { name: teamName },
        });

        const entry = await tx.teamEntry.create({
          data: { seriesId: series.id, teamId: team.id, displayName: teamName, registrationId: reg.id },
        });

        const captain = await findOrCreatePerson(tx, reg.captainName, reg.captainEmail, reg.captainMobile);
        await tx.rosterEntry.create({
          data: { teamEntryId: entry.id, seriesId: series.id, personId: captain.id, role: "CAPTAIN" },
        });

        if (reg.viceCaptainName?.trim()) {
          const vice = await findOrCreatePerson(
            tx,
            reg.viceCaptainName,
            reg.viceCaptainEmail,
            reg.viceCaptainMobile,
          );
          // Same email as the captain means the same person — one roster row.
          if (vice.id !== captain.id) {
            await tx.rosterEntry.create({
              data: { teamEntryId: entry.id, seriesId: series.id, personId: vice.id, role: "VICE_CAPTAIN" },
            });
          }
        }

        if (reg.status === "SUBMITTED") {
          await tx.registration.update({
            where: { id: reg.id },
            data: { status: "APPROVED", reviewedBy: user.email ?? user.id, reviewedAt: new Date() },
          });
        }

        await recordAudit(tx, user, {
          action: "teamEntry.create",
          entityType: "TeamEntry",
          entityId: entry.id,
          summary: `added "${teamName}" to "${series.name}" from its registration`,
        });
      });
      result.added.push(teamName);
    } catch (error) {
      result.skipped.push({ teamName, reason: describeAddFailure(error) });
    }
  }

  return result;
}

function describeAddFailure(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = JSON.stringify(error.meta ?? {});
    if (target.includes("personId")) {
      return "Its captain or vice-captain is already on another team in this series.";
    }
    if (target.includes("displayName") || target.includes("teamId")) {
      return "A team with this name is already in the series.";
    }
  }
  console.error("Adding a registration to the series failed:", error);
  return "Something went wrong adding this team.";
}

/**
 * Moves one team to a pool, or back to unassigned (null). Pools normally come
 * from the imported schedule (see schedule-import.ts); this is the manual fix.
 */
export async function setTeamPool(user: SessionUser, teamEntryId: string, input: unknown) {
  if (!can(user, "manage-league")) {
    throw new ForbiddenError();
  }
  const { pool } = setPoolSchema.parse(input);

  const entry = await prisma.teamEntry.findUnique({ where: { id: teamEntryId } });
  if (!entry) {
    throw new TeamEntryNotFoundError();
  }
  if (entry.pool === pool) return entry;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.teamEntry.update({ where: { id: teamEntryId }, data: { pool } });
    await recordAudit(tx, user, {
      action: "teamEntry.setPool",
      entityType: "TeamEntry",
      entityId: teamEntryId,
      summary: `moved "${entry.displayName}" to ${pool ? `Pool ${pool}` : "unassigned"}`,
      changes: { pool: [entry.pool, pool] },
    });
    return updated;
  });
}
