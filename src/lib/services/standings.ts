import { prisma } from "@/lib/db/prisma";
import { findCurrentSeries } from "@/lib/services/series";
import { computePoolStandings, type StandingsRow } from "@/lib/standings/compute";

/** Teams per pool that go through to the playoffs (architecture.md §1.2). */
export const PLAYOFF_PLACES_PER_POOL = 6;

export type PoolTable = { pool: string; rows: StandingsRow[] };

/**
 * The Points Table tab: league-stage standings for each pool of the current
 * series, derived on read from Match + Innings with committee adjustments on
 * top (CLAUDE.md). Teams without a pool aren't in any table.
 */
export async function getPointsTable() {
  const { series } = await findCurrentSeries();
  if (!series) return { series: null, pools: [] as PoolTable[], uncountedCount: 0 };

  const [entries, matches, adjustments] = await Promise.all([
    prisma.teamEntry.findMany({
      where: { seriesId: series.id, pool: { not: null } },
      select: { id: true, displayName: true, pool: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.match.findMany({
      where: {
        seriesId: series.id,
        stage: "LEAGUE",
        status: { in: ["COMPLETED", "ABANDONED"] },
        teamOneId: { not: null },
        teamTwoId: { not: null },
      },
      select: {
        id: true,
        teamOneId: true,
        teamTwoId: true,
        status: true,
        resultType: true,
        winnerId: true,
        oversPerSide: true,
        innings: {
          where: { isSuperOver: false },
          select: { battingEntryId: true, runs: true, wickets: true, legalBalls: true, allOut: true },
        },
      },
    }),
    // Adjustments tied to a playoff match don't belong in the league table.
    prisma.standingsAdjustment.findMany({
      where: {
        teamEntry: { seriesId: series.id },
        OR: [{ matchId: null }, { match: { stage: "LEAGUE" } }],
      },
      select: { teamEntryId: true, pointsDelta: true, runsDelta: true },
    }),
  ]);

  const standingsMatches = matches.map((m) => ({
    id: m.id,
    teamOneId: m.teamOneId!,
    teamTwoId: m.teamTwoId!,
    status: m.status,
    resultType: m.resultType,
    winnerId: m.winnerId,
    oversQuota: m.oversPerSide ?? series.maxOvers,
    innings: m.innings,
  }));

  const pools = [...new Set(entries.map((e) => e.pool!))].sort();
  let uncountedCount = 0;
  const tables: PoolTable[] = pools.map((pool) => {
    const { rows, uncounted } = computePoolStandings({
      teams: entries.filter((e) => e.pool === pool).map((e) => ({ id: e.id, name: e.displayName })),
      matches: standingsMatches,
      adjustments,
      points: {
        win: series.winPoints,
        loss: series.lossPoints,
        tie: series.tiePoints,
        noResult: series.noResultPoints,
      },
      // The last-resort random draw is seeded by the series id, so it's fixed
      // for the season (see drawKey in lib/standings/compute.ts).
      seed: series.id,
    });
    uncountedCount += uncounted.length;
    return { pool, rows };
  });

  return {
    series: { name: series.name, maxOvers: series.maxOvers },
    pools: tables,
    uncountedCount,
  };
}
