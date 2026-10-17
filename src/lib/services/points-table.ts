import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { recordAudit } from "@/lib/services/audit";
import { findCurrentSeries } from "@/lib/services/series";
import {
  parsePointsTable,
  PointsTableFileError,
  readCsvLines,
  type CsvLine,
} from "@/lib/import/cricclubs-points-table";

// The points table is CricClubs' — it does the calculation (points, NRR,
// tie-breaks) and this site only publishes what it exports. Flow mirrors the
// schedule import: upload → staged ImportRun (file lines kept verbatim) →
// preview → commit, which replaces the series' published table.

/** Teams per group that go through to the playoffs (architecture.md §1.2), marked on the public table. */
export const PLAYOFF_PLACES_PER_GROUP = 6;

const MAX_FILE_BYTES = 256 * 1024;

export class PointsTableImportNotFoundError extends Error {
  constructor() {
    super("That upload no longer exists or has already been published or discarded.");
    this.name = "PointsTableImportNotFoundError";
  }
}

function requireLeagueAdmin(user: SessionUser) {
  if (!can(user, "manage-league")) throw new ForbiddenError();
}

/** Reads the uploaded CSV and stores it as a staged import for the current series. */
export async function stagePointsTableImport(user: SessionUser, file: { name: string; bytes: ArrayBuffer }) {
  requireLeagueAdmin(user);

  if (file.bytes.byteLength === 0) throw new PointsTableFileError("The file is empty.");
  if (file.bytes.byteLength > MAX_FILE_BYTES) {
    throw new PointsTableFileError("That file is too large for a points table export.");
  }

  const { series } = await findCurrentSeries();
  if (!series) throw new PointsTableFileError("Create the season's series on the Teams page first.");

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(file.bytes);
  } catch {
    throw new PointsTableFileError("That file couldn't be read as text. Upload the CricClubs .csv export.");
  }
  const lines = readCsvLines(text);
  if (lines.every((l) => l.cells.every((c) => c.trim() === ""))) {
    throw new PointsTableFileError("The file has no rows.");
  }

  const run = await prisma.importRun.create({
    data: {
      kind: "CRICCLUBS_POINTS_TABLE",
      status: "STAGED",
      fileName: file.name,
      seriesId: series.id,
      startedById: user.id,
      rows: {
        create: lines.map((line) => ({
          rowNumber: line.lineNumber,
          raw: { cells: line.cells } as Prisma.InputJsonValue,
        })),
      },
    },
  });
  return run.id;
}

async function loadStagedRun(runId: string) {
  const run = await prisma.importRun.findUnique({
    where: { id: runId },
    include: { rows: { orderBy: { rowNumber: "asc" } }, series: { select: { id: true, name: true } } },
  });
  if (!run || run.status !== "STAGED" || run.kind !== "CRICCLUBS_POINTS_TABLE" || !run.series) {
    throw new PointsTableImportNotFoundError();
  }
  const lines: CsvLine[] = run.rows.map((r) => ({
    lineNumber: r.rowNumber,
    cells: (r.raw as { cells: string[] }).cells,
  }));
  return { run, series: run.series, parsed: parsePointsTable(lines) };
}

/** The preview: the groups and rows the upload would publish, and anything that can't be read. */
export async function getPointsTableImportPreview(user: SessionUser, runId: string) {
  requireLeagueAdmin(user);
  const { run, series, parsed } = await loadStagedRun(runId);
  const current = await prisma.pointsTable.findUnique({
    where: { seriesId: series.id },
    select: { fileName: true, uploadedAt: true },
  });
  return {
    run: { id: run.id, fileName: run.fileName, createdAt: run.createdAt },
    series: { name: series.name },
    current,
    groups: parsed.groups,
    problems: parsed.problems,
    canCommit: parsed.problems.length === 0 && parsed.groups.length > 0,
  };
}

/** Publishes the upload: replaces the series' points table in one transaction. */
export async function commitPointsTableImport(user: SessionUser, runId: string) {
  requireLeagueAdmin(user);
  const { run, series, parsed } = await loadStagedRun(runId);
  if (parsed.problems.length > 0 || parsed.groups.length === 0) {
    throw new PointsTableFileError("Fix the problems listed in the preview before publishing.");
  }
  const teamCount = parsed.groups.reduce((n, g) => n + g.rows.length, 0);

  await prisma.$transaction(async (tx) => {
    await tx.pointsTable.deleteMany({ where: { seriesId: series.id } });
    const table = await tx.pointsTable.create({
      data: {
        seriesId: series.id,
        fileName: run.fileName,
        uploadedById: user.id,
        rows: {
          create: parsed.groups.flatMap((group, groupOrder) =>
            group.rows.map((row) => ({
              groupName: group.name,
              groupOrder,
              position: row.position,
              teamName: row.teamName,
              played: row.played,
              won: row.won,
              lost: row.lost,
              noResult: row.noResult,
              tied: row.tied,
              points: row.points,
              winPercent: row.winPercent,
              netRunRate: row.netRunRate,
              runsFor: row.runsFor,
              runsAgainst: row.runsAgainst,
            })),
          ),
        },
      },
    });
    await tx.importRun.update({
      where: { id: run.id },
      data: { status: "COMMITTED", committedAt: new Date() },
    });
    await recordAudit(tx, user, {
      action: "pointsTable.publish",
      entityType: "PointsTable",
      entityId: table.id,
      summary: `published the points table from "${run.fileName}" (${parsed.groups.length} group${parsed.groups.length === 1 ? "" : "s"}, ${teamCount} teams)`,
    });
  });
}

export async function discardPointsTableImport(user: SessionUser, runId: string) {
  requireLeagueAdmin(user);
  const { run } = await loadStagedRun(runId);
  await prisma.importRun.update({ where: { id: run.id }, data: { status: "DISCARDED" } });
}

export type PublishedPointsRow = {
  position: number;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  noResult: number;
  tied: number;
  points: number;
  winPercent: number | null;
  netRunRate: number;
  runsFor: string | null;
  runsAgainst: string | null;
};

export type PublishedPointsGroup = { name: string; rows: PublishedPointsRow[] };

/**
 * The current series' published points table, grouped in the file's order,
 * or null if nothing has been uploaded yet. Public.
 */
export async function getPublishedPointsTable() {
  const { series } = await findCurrentSeries();
  if (!series) return null;

  const table = await prisma.pointsTable.findUnique({
    where: { seriesId: series.id },
    select: {
      fileName: true,
      uploadedAt: true,
      rows: { orderBy: [{ groupOrder: "asc" }, { position: "asc" }] },
    },
  });
  if (!table) return null;

  const groups: PublishedPointsGroup[] = [];
  for (const row of table.rows) {
    let group = groups[row.groupOrder] as PublishedPointsGroup | undefined;
    if (!group || group.name !== row.groupName) {
      group = { name: row.groupName, rows: [] };
      groups[row.groupOrder] = group;
    }
    group.rows.push({
      position: row.position,
      teamName: row.teamName,
      played: row.played,
      won: row.won,
      lost: row.lost,
      noResult: row.noResult,
      tied: row.tied,
      points: row.points.toNumber(),
      winPercent: row.winPercent?.toNumber() ?? null,
      netRunRate: row.netRunRate.toNumber(),
      runsFor: row.runsFor,
      runsAgainst: row.runsAgainst,
    });
  }

  return {
    uploadedAt: table.uploadedAt,
    fileName: table.fileName,
    groups: groups.filter(Boolean),
  };
}

/** What the admin page shows about the published table: when, from which file, by whom. */
export async function getPointsTableAdminSummary(user: SessionUser) {
  requireLeagueAdmin(user);
  const { series } = await findCurrentSeries();
  if (!series) return { series: null, current: null };
  const current = await prisma.pointsTable.findUnique({
    where: { seriesId: series.id },
    select: {
      fileName: true,
      uploadedAt: true,
      uploadedBy: { select: { email: true } },
      _count: { select: { rows: true } },
    },
  });
  return { series: { name: series.name }, current };
}
