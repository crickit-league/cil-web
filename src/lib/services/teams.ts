import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { recordAudit } from "@/lib/services/audit";
import { normalizeName } from "@/lib/import/cricclubs-matches";
import { namesOf, planRename } from "@/lib/teams/names";
import { renameTeamSchema } from "@/lib/validation/league";

// TeamEntry.displayName is the single source of a team's name. renameTeam is
// the only code that changes it after the entry is created; every page reads
// the name through the TeamEntry relation, never a stored copy.

export class TeamNotFoundError extends Error {
  constructor() {
    super("That team is no longer in the series.");
    this.name = "TeamNotFoundError";
  }
}

export class TeamNameTakenError extends Error {
  constructor(newName: string, takenBy: string) {
    super(
      takenBy.toLowerCase() === newName.trim().toLowerCase()
        ? `"${takenBy}" is already a team in this series.`
        : `"${newName.trim()}" is already a name "${takenBy}" is known by in this series.`,
    );
    this.name = "TeamNameTakenError";
  }
}

const seriesTeamSelect = {
  id: true,
  displayName: true,
  teamId: true,
  team: { select: { name: true, aliases: { select: { rawName: true } } } },
} satisfies Prisma.TeamEntrySelect;

/** Every team in a series with all the names it answers to. Works with a transaction client too. */
export async function loadSeriesTeams(db: Prisma.TransactionClient, seriesId: string) {
  const entries = await db.teamEntry.findMany({
    where: { seriesId },
    select: { ...seriesTeamSelect, pool: true },
    orderBy: { displayName: "asc" },
  });
  return entries.map((e) => ({
    id: e.id,
    teamId: e.teamId,
    displayName: e.displayName,
    pool: e.pool,
    names: namesOf(e),
  }));
}

/**
 * Renames a team entry inside the caller's transaction, so a registration
 * edit and the rename it implies commit together. Returns false if the name
 * didn't change.
 */
export async function renameTeamInTransaction(
  tx: Prisma.TransactionClient,
  user: SessionUser,
  teamEntryId: string,
  newName: string,
): Promise<boolean> {
  if (!can(user, "manage-league")) throw new ForbiddenError();
  const entry = await tx.teamEntry.findUnique({
    where: { id: teamEntryId },
    select: { ...seriesTeamSelect, seriesId: true },
  });
  if (!entry) throw new TeamNotFoundError();

  const others = (await loadSeriesTeams(tx, entry.seriesId)).filter((t) => t.id !== entry.id);
  const plan = planRename({
    currentDisplayName: entry.displayName,
    newName,
    canonicalName: entry.team.name,
    aliases: entry.team.aliases.map((a) => a.rawName),
    otherTeams: others,
  });
  if (plan.kind === "unchanged") return false;
  if (plan.kind === "taken") throw new TeamNameTakenError(newName, plan.by);

  await tx.teamEntry.update({ where: { id: entry.id }, data: { displayName: plan.to } });
  if (plan.aliasToAdd) {
    // rawName is unique across all teams; the team that most recently used the
    // name is the one a file using it means.
    await tx.nameAlias.upsert({
      where: { rawName: plan.aliasToAdd },
      update: { teamId: entry.teamId, personId: null, fieldId: null },
      create: { rawName: plan.aliasToAdd, teamId: entry.teamId },
    });
  }
  await recordAudit(tx, user, {
    action: "teamEntry.rename",
    entityType: "TeamEntry",
    entityId: entry.id,
    summary: `renamed "${plan.from}" to "${plan.to}"`,
    changes: { displayName: [plan.from, plan.to] },
  });
  return true;
}

/**
 * The only way to change a team's name. Updates TeamEntry.displayName (which
 * every page reads), keeps the old name as an alias for imports, and logs it.
 * Team.name, the canonical cross-season key, is left alone.
 */
export async function renameTeam(user: SessionUser, teamEntryId: string, input: unknown) {
  if (!can(user, "manage-league")) throw new ForbiddenError();
  const { name } = renameTeamSchema.parse(input);
  return prisma.$transaction((tx) => renameTeamInTransaction(tx, user, teamEntryId, name));
}

/**
 * Records that a team name in an import file means this team entry, as a
 * NameAlias on its Team, so later imports (this season and next) match it.
 */
export async function saveTeamNameAlias(
  tx: Prisma.TransactionClient,
  user: SessionUser,
  entry: { teamId: string; displayName: string },
  rawName: string,
  source: string,
) {
  const alias = await tx.nameAlias.upsert({
    where: { rawName: normalizeName(rawName) },
    update: { teamId: entry.teamId, personId: null, fieldId: null },
    create: { rawName: normalizeName(rawName), teamId: entry.teamId },
  });
  await recordAudit(tx, user, {
    action: "nameAlias.map",
    entityType: "NameAlias",
    entityId: alias.id,
    summary: `mapped ${source} team name "${rawName.trim()}" to "${entry.displayName}"`,
  });
}
