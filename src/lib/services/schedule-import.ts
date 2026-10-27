import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { recordAudit } from "@/lib/services/audit";
import { loadSeriesTeams, saveTeamNameAlias } from "@/lib/services/teams";
import { findCurrentSeries } from "@/lib/services/series";
import {
  MatchesFileError,
  normalizeName,
  readMatchesWorkbook,
  type RawMatchRecord,
} from "@/lib/import/cricclubs-matches";
import {
  planScheduleImport,
  type ExistingMatch,
  type PlanTeam,
  type PlannedInnings,
  type PlannedMatch,
} from "@/lib/import/schedule-plan";

// CricClubs schedule import: upload → staged ImportRun (rows kept verbatim) →
// preview (plan computed fresh against current data) → commit (same plan,
// applied in one transaction). Nothing here sends email — the committee
// sends umpire emails by hand (STATUS.md / architecture.md §9).

export class ImportRunNotFoundError extends Error {
  constructor() {
    super("That import no longer exists or has already been committed or discarded.");
    this.name = "ImportRunNotFoundError";
  }
}

export class ImportBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportBlockedError";
  }
}

const MAX_FILE_BYTES = 2 * 1024 * 1024;

function requireLeagueAdmin(user: SessionUser) {
  if (!can(user, "manage-league")) throw new ForbiddenError();
}

/** Reads the uploaded export and stores it as a staged import for the current series. */
export async function stageScheduleImport(user: SessionUser, file: { name: string; bytes: ArrayBuffer }) {
  requireLeagueAdmin(user);

  if (file.bytes.byteLength === 0) throw new MatchesFileError("The file is empty.");
  if (file.bytes.byteLength > MAX_FILE_BYTES)
    throw new MatchesFileError("That file is too large for a schedule export.");

  const { series } = await findCurrentSeries();
  if (!series) throw new ImportBlockedError("Create the season's series on the Teams page first.");

  const records = await readMatchesWorkbook(file.bytes);
  if (records.length === 0) throw new MatchesFileError("The export has no match rows.");

  const run = await prisma.importRun.create({
    data: {
      kind: "CRICCLUBS_MATCHES",
      status: "STAGED",
      fileName: file.name,
      seriesId: series.id,
      startedById: user.id,
      rows: {
        create: records.map((raw, i) => ({ rowNumber: i + 1, raw: raw as Prisma.InputJsonValue })),
      },
    },
  });
  return run.id;
}

async function loadStagedRun(runId: string) {
  const run = await prisma.importRun.findUnique({
    where: { id: runId },
    include: { rows: { orderBy: { rowNumber: "asc" } }, series: true },
  });
  if (!run || run.status !== "STAGED" || run.kind !== "CRICCLUBS_MATCHES" || !run.series) {
    throw new ImportRunNotFoundError();
  }
  return { ...run, series: run.series };
}

function fieldLabel(field: { label: string; ground: { name: string } } | null) {
  if (!field) return null;
  return field.label ? `${field.ground.name} ${field.label}` : field.ground.name;
}

/** Current state the planner compares against. Works with a transaction client too. */
async function loadPlanInputs(db: Prisma.TransactionClient, seriesId: string) {
  const entries = await loadSeriesTeams(db, seriesId);
  const teams: PlanTeam[] = entries.map((e) => ({
    id: e.id,
    displayName: e.displayName,
    pool: e.pool,
    names: e.names,
  }));

  const matches = await db.match.findMany({
    where: { seriesId },
    select: {
      id: true,
      stage: true,
      teamOneId: true,
      teamTwoId: true,
      startsAt: true,
      status: true,
      resultText: true,
      umpiringTeamId: true,
      umpiringTeamSource: true,
      field: { select: { label: true, ground: { select: { name: true } } } },
      umpires: { select: { rawName: true }, orderBy: { slot: "asc" } },
      innings: {
        where: { isSuperOver: false },
        select: {
          number: true,
          battingEntryId: true,
          runs: true,
          wickets: true,
          legalBalls: true,
          allOut: true,
        },
        orderBy: { number: "asc" },
      },
    },
  });
  const existing: ExistingMatch[] = matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    teamOneId: m.teamOneId,
    teamTwoId: m.teamTwoId,
    startsAt: m.startsAt,
    groundName: fieldLabel(m.field),
    status: m.status,
    resultText: m.resultText,
    umpiringTeamId: m.umpiringTeamId,
    umpiringTeamSource: m.umpiringTeamSource,
    umpireNames: m.umpires.map((u) => u.rawName),
    innings: m.innings,
  }));

  return { teams, existing, entries };
}

function planRules(series: { groupCount: number; playersPerSide: number; maxOvers: number }) {
  return {
    groupCount: series.groupCount,
    playersPerSide: series.playersPerSide,
    maxOvers: series.maxOvers,
  };
}

/** The preview: what committing this import would do, computed against current data. */
export async function getScheduleImportPreview(user: SessionUser, runId: string) {
  requireLeagueAdmin(user);
  const run = await loadStagedRun(runId);
  const { teams, existing } = await loadPlanInputs(prisma, run.series.id);
  const records = run.rows.map((r) => r.raw as RawMatchRecord);
  const plan = planScheduleImport({ records, teams, existing, ...planRules(run.series) });

  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.displayName ?? "—";
  const describe = (m: PlannedMatch) => ({
    rowNumber: m.rowNumber,
    stage: m.stage,
    startsAt: m.startsAt,
    teamOne: teamName(m.teamOneId),
    teamTwo: teamName(m.teamTwoId),
    ground: m.ground,
    umpiringTeam: m.umpiringTeamId ? teamName(m.umpiringTeamId) : null,
  });

  return {
    run: {
      id: run.id,
      fileName: run.fileName,
      createdAt: run.createdAt,
      rowCount: run.rows.length,
      fileSeriesName: (run.rows[0]?.raw as RawMatchRecord | undefined)?.["Series Name"] ?? null,
    },
    series: { name: run.series.name },
    teamOptions: teams.map((t) => ({ id: t.id, name: t.displayName })),
    plan: {
      problems: plan.problems,
      unmatchedTeams: plan.unmatchedTeams,
      unmatchedUmpiringTeams: plan.unmatchedUmpiringTeams,
      warnings: plan.warnings,
      scoreProblems: plan.scoreProblems,
      creates: plan.creates.map(describe),
      updates: plan.updates
        .filter((u) => u.changes.length > 0)
        .map((u) => ({ ...describe(u.planned), changes: u.changes })),
      unchangedCount: plan.unchangedCount,
      cancels: plan.cancels,
      umpireConflicts: plan.umpireConflicts,
      poolChanges: plan.poolChanges,
    },
    canCommit: plan.problems.length === 0 && plan.unmatchedTeams.length === 0,
  };
}

/**
 * Maps a team name from the export to a team. `target` is a TeamEntry id in
 * the series, or "new" to add the name as a new team. The mapping is stored
 * as a NameAlias on the Team, so every later import (this season and next)
 * recognises the name.
 */
export async function mapImportTeamName(user: SessionUser, runId: string, rawName: string, target: string) {
  requireLeagueAdmin(user);
  const run = await loadStagedRun(runId);
  const name = rawName.trim();
  if (!name) throw new ImportBlockedError("No team name given.");

  await prisma.$transaction(async (tx) => {
    if (target === "new") {
      const team = await tx.team.upsert({ where: { name }, update: {}, create: { name } });
      const entry = await tx.teamEntry.create({
        data: { seriesId: run.series.id, teamId: team.id, displayName: name },
      });
      await recordAudit(tx, user, {
        action: "teamEntry.create",
        entityType: "TeamEntry",
        entityId: entry.id,
        summary: `added "${name}" to "${run.series.name}" from a CricClubs schedule import`,
      });
      return;
    }

    const entry = await tx.teamEntry.findFirst({
      where: { id: target, seriesId: run.series.id },
      select: { id: true, teamId: true, displayName: true },
    });
    if (!entry) throw new ImportBlockedError("That team isn't in this series.");

    await saveTeamNameAlias(tx, user, entry, name, "CricClubs");
  });
}

/** Adds every still-unmatched team name in the import as a new team. */
export async function addUnmatchedImportTeams(user: SessionUser, runId: string) {
  const preview = await getScheduleImportPreview(user, runId);
  for (const name of preview.plan.unmatchedTeams) {
    await mapImportTeamName(user, runId, name, "new");
  }
}

/** Splits "Nickajack Park 3" into ground "Nickajack Park" + field "3"; "Larry Bell" is a single-field ground. */
function splitGroundName(raw: string): { ground: string; label: string } {
  const m = raw.trim().match(/^(.*?)\s+(\d+)$/);
  return m ? { ground: m[1], label: m[2] } : { ground: raw.trim(), label: "" };
}

async function resolveFieldId(tx: Prisma.TransactionClient, raw: string, cache: Map<string, string>) {
  const key = normalizeName(raw);
  if (!key) return null;
  if (cache.has(key)) return cache.get(key)!;

  const alias = await tx.nameAlias.findUnique({ where: { rawName: key }, select: { fieldId: true } });
  if (alias?.fieldId) {
    cache.set(key, alias.fieldId);
    return alias.fieldId;
  }

  const { ground, label } = splitGroundName(raw);
  const groundRow = await tx.ground.upsert({ where: { name: ground }, update: {}, create: { name: ground } });
  const field = await tx.field.upsert({
    where: { groundId_label: { groundId: groundRow.id, label } },
    update: {},
    create: { groundId: groundRow.id, label },
  });
  cache.set(key, field.id);
  return field.id;
}

function matchData(m: PlannedMatch, fieldId: string | null) {
  return {
    stage: m.stage,
    startsAt: m.startsAt,
    fieldId,
    teamOneId: m.teamOneId,
    teamTwoId: m.teamTwoId,
    umpiringTeamId: m.umpiringTeamId,
    umpiringTeamSource: m.umpiringTeamSource,
    status: m.result.status,
    resultType: m.result.resultType,
    winnerId: m.result.winnerId,
    marginRuns: m.result.marginRuns,
    marginWickets: m.result.marginWickets,
    resultText: m.result.text,
  } satisfies Prisma.MatchUncheckedUpdateInput;
}

async function replaceUmpireNames(tx: Prisma.TransactionClient, matchId: string, names: string[]) {
  await tx.matchUmpire.deleteMany({ where: { matchId } });
  if (names.length > 0) {
    await tx.matchUmpire.createMany({
      data: names.slice(0, 4).map((rawName, i) => ({ matchId, slot: i + 1, rawName })),
    });
  }
}

/**
 * Makes the match's innings totals match the file: upserts by innings number
 * (so a re-import updates in place) and removes regular innings the file no
 * longer has. Null means the file's scores couldn't be read — leave them be.
 */
async function syncInnings(tx: Prisma.TransactionClient, matchId: string, innings: PlannedInnings[] | null) {
  if (innings === null) return;
  await tx.innings.deleteMany({
    where: { matchId, isSuperOver: false, number: { notIn: innings.map((i) => i.number) } },
  });
  for (const { number, ...totals } of innings) {
    await tx.innings.upsert({
      where: { matchId_number: { matchId, number } },
      update: { ...totals, isSuperOver: false },
      create: { matchId, number, ...totals },
    });
  }
}

export type CommitSummary = {
  created: number;
  updated: number;
  cancelled: number;
  poolChanges: number;
  umpireConflicts: number;
};

/**
 * Applies the import. Re-plans inside the transaction against current data,
 * so nothing that changed since the preview (an admin override, another
 * import) gets clobbered. Refuses while the file has unreadable rows or
 * unmapped team names.
 */
export async function commitScheduleImport(user: SessionUser, runId: string): Promise<CommitSummary> {
  requireLeagueAdmin(user);
  const run = await loadStagedRun(runId);
  const records = run.rows.map((r) => r.raw as RawMatchRecord);

  return prisma.$transaction(
    async (tx) => {
      const { teams, existing } = await loadPlanInputs(tx, run.series.id);
      const plan = planScheduleImport({ records, teams, existing, ...planRules(run.series) });

      if (plan.problems.length > 0 || plan.unmatchedTeams.length > 0) {
        throw new ImportBlockedError("Fix the problems listed in the preview before importing.");
      }

      const fieldCache = new Map<string, string>();

      for (const m of plan.creates) {
        const created = await tx.match.create({
          data: { seriesId: run.series.id, ...matchData(m, await resolveFieldId(tx, m.ground, fieldCache)) },
        });
        await replaceUmpireNames(tx, created.id, m.umpireNames);
        await syncInnings(tx, created.id, m.innings);
      }
      for (const u of plan.updates) {
        await tx.match.update({
          where: { id: u.matchId },
          data: matchData(u.planned, await resolveFieldId(tx, u.planned.ground, fieldCache)),
        });
        await replaceUmpireNames(tx, u.matchId, u.planned.umpireNames);
        await syncInnings(tx, u.matchId, u.planned.innings);
      }
      if (plan.cancels.length > 0) {
        await tx.match.updateMany({
          where: { id: { in: plan.cancels.map((c) => c.matchId) } },
          data: { status: "CANCELLED" },
        });
      }
      for (const p of plan.poolChanges) {
        await tx.teamEntry.update({ where: { id: p.teamEntryId }, data: { pool: p.to } });
      }

      const summary: CommitSummary = {
        created: plan.creates.length,
        updated: plan.updates.filter((u) => u.changes.length > 0).length,
        cancelled: plan.cancels.length,
        poolChanges: plan.poolChanges.length,
        umpireConflicts: plan.umpireConflicts.length,
      };

      await tx.importRun.update({
        where: { id: run.id },
        data: { status: "COMMITTED", committedAt: new Date() },
      });
      await recordAudit(tx, user, {
        action: "schedule.import",
        entityType: "ImportRun",
        entityId: run.id,
        summary: `imported the CricClubs schedule "${run.fileName}": ${summary.created} new, ${summary.updated} changed, ${summary.cancelled} cancelled`,
      });
      return summary;
    },
    // ~120 matches with a few writes each — well past the 5s interactive default.
    { timeout: 60_000, maxWait: 10_000 },
  );
}

export async function discardScheduleImport(user: SessionUser, runId: string) {
  requireLeagueAdmin(user);
  const run = await loadStagedRun(runId);
  await prisma.importRun.update({ where: { id: run.id }, data: { status: "DISCARDED" } });
}
