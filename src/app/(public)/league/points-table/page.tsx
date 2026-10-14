import type { Metadata } from "next";
import { getPointsTable, PLAYOFF_PLACES_PER_POOL, type PoolTable } from "@/lib/services/standings";
import { TIE_BREAK_LABEL, type StandingsRow } from "@/lib/standings/compute";

export const metadata: Metadata = {
  title: "Points Table · CIL Winter League",
  description: "League-stage standings by pool for this season's CIL Winter Championship.",
};

/** "+1.2345" / "-0.5000" — NRR always shows its sign and 4 places. */
function formatNrr(nrr: number) {
  return `${nrr > 0 ? "+" : ""}${nrr.toFixed(4)}`;
}

function TieBreakNote({ row }: { row: StandingsRow }) {
  if (!row.tieBreak) return null;
  return (
    <span className="text-chalk-faint block text-xs font-normal normal-case">
      Level on points and NRR — placed on {TIE_BREAK_LABEL[row.tieBreak]}
    </span>
  );
}

const STAT_COLUMNS = [
  { key: "played", label: "P", title: "Played" },
  { key: "won", label: "W", title: "Won" },
  { key: "lost", label: "L", title: "Lost" },
  { key: "tied", label: "T", title: "Tied" },
  { key: "noResult", label: "NR", title: "No result" },
] as const;

function PoolStandings({ table }: { table: PoolTable }) {
  const qualifies = (row: StandingsRow) => row.position <= PLAYOFF_PLACES_PER_POOL;
  const cutLine = (row: StandingsRow) =>
    row.position === PLAYOFF_PLACES_PER_POOL && table.rows.length > PLAYOFF_PLACES_PER_POOL;

  return (
    <section className="flex flex-col gap-3" aria-labelledby={`pool-${table.pool}`}>
      <h2
        id={`pool-${table.pool}`}
        className="font-display border-line border-b pb-2 text-[1.4rem] font-extrabold uppercase"
      >
        Pool {table.pool}
      </h2>

      {/* Phones: one card per team — position, name, points and NRR, then the record. */}
      <ol className="flex flex-col sm:hidden">
        {table.rows.map((row) => (
          <li
            key={row.team.id}
            className={`border-line bg-dugout flex gap-3 border-x border-t px-3 py-3 last:border-b ${
              qualifies(row) ? "border-l-gold border-l-2" : ""
            } ${cutLine(row) ? "border-b-clay border-b-2" : ""}`}
          >
            <span className="font-data text-chalk-dim w-5 shrink-0 pt-0.5 text-sm">{row.position}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display min-w-0 leading-tight font-bold uppercase">
                  {row.team.name}
                </span>
                <span className="font-data shrink-0 text-sm">
                  <strong className="text-chalk font-semibold">{row.points}</strong>
                  <span className="text-chalk-dim"> pts</span>
                </span>
              </div>
              <div className="font-data text-chalk-dim mt-1 flex items-baseline justify-between gap-3 text-xs">
                <span>
                  P{row.played} · W{row.won} · L{row.lost} · T{row.tied} · NR{row.noResult}
                </span>
                <span className="shrink-0">NRR {formatNrr(row.nrr)}</span>
              </div>
              <TieBreakNote row={row} />
            </div>
          </li>
        ))}
      </ol>

      <div className="hidden sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="font-data text-chalk-dim border-line border-b text-[0.68rem] tracking-[0.08em] uppercase">
              <th scope="col" className="w-10 py-2 pr-2 text-left font-normal">
                <abbr title="Position">#</abbr>
              </th>
              <th scope="col" className="py-2 pr-4 text-left font-normal">
                Team
              </th>
              {STAT_COLUMNS.map((c) => (
                <th key={c.key} scope="col" className="w-12 py-2 text-right font-normal">
                  <abbr title={c.title} className="no-underline">
                    {c.label}
                  </abbr>
                </th>
              ))}
              <th scope="col" className="w-16 py-2 text-right font-normal">
                <abbr title="Points" className="no-underline">
                  Pts
                </abbr>
              </th>
              <th scope="col" className="w-24 py-2 pl-2 text-right font-normal">
                <abbr title="Net run rate" className="no-underline">
                  NRR
                </abbr>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr
                key={row.team.id}
                className={`border-line border-b ${cutLine(row) ? "border-b-clay border-b-2" : ""}`}
              >
                <td
                  className={`font-data text-chalk-dim py-2.5 pr-2 pl-2 ${
                    qualifies(row) ? "border-l-gold border-l-2" : "border-l-2 border-l-transparent"
                  }`}
                >
                  {row.position}
                </td>
                <th scope="row" className="font-display py-2.5 pr-4 text-left text-base font-bold uppercase">
                  {row.team.name}
                  <TieBreakNote row={row} />
                </th>
                {STAT_COLUMNS.map((c) => (
                  <td key={c.key} className="font-data text-chalk-dim py-2.5 text-right">
                    {row[c.key]}
                  </td>
                ))}
                <td className="font-data text-chalk py-2.5 text-right font-semibold">{row.points}</td>
                <td className="font-data text-chalk-dim py-2.5 pl-2 text-right">{formatNrr(row.nrr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function PointsTablePage() {
  const { pools, uncountedCount } = await getPointsTable();
  const anyPlayed = pools.some((p) => p.rows.some((r) => r.played > 0));

  if (pools.length === 0) {
    return (
      <p className="text-chalk-dim border-line bg-dugout border p-6">
        The points table will appear here once the season&apos;s teams are placed in pools.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="text-chalk-dim flex max-w-[66ch] flex-col gap-2 text-sm">
        <p>
          League stage only. Win 2 points, tie or no result 1 each. The top {PLAYOFF_PLACES_PER_POOL} in each
          pool <span className="text-gold">(marked in gold)</span> go through to the playoffs.
        </p>
        <p>
          Teams level on points are separated by net run rate, then head-to-head, then wins among the tied
          teams, then wickets taken, then a drawn lot.
          {anyPlayed ? null : " No league matches have been played yet."}
        </p>
        {uncountedCount > 0 ? (
          <p role="status" className="border-gold/40 bg-dugout text-chalk border p-3">
            {uncountedCount === 1 ? "One played match has" : `${uncountedCount} played matches have`} a result
            this site can&apos;t read yet, so {uncountedCount === 1 ? "it isn't" : "they aren't"} counted yet.
          </p>
        ) : null}
      </div>

      {pools.map((table) => (
        <PoolStandings key={table.pool} table={table} />
      ))}
    </div>
  );
}
