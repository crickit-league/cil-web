import { TeamBadge } from "@/components/team-badge";
import type { PublishedPointsGroup, PublishedPointsRow } from "@/lib/services/points-table";

// One group of CricClubs' points table, as published (public page) or as an
// upload preview (admin). Phones get stacked cards; `sm` and up a table, with
// WIN% / FOR / AGAINST added at `lg` where there's room.

/** "+1.8753" / "-0.2812" — NRR always with its sign and 4 places, as CricClubs shows it. */
export function formatNrr(nrr: number) {
  return `${nrr > 0 ? "+" : ""}${nrr.toFixed(4)}`;
}

/** 18 → "18", 17.5 → "17.5". */
function formatPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

const STAT_COLUMNS = [
  { key: "played", label: "MAT", title: "Matches" },
  { key: "won", label: "W", title: "Won" },
  { key: "lost", label: "L", title: "Lost" },
  { key: "noResult", label: "N/R", title: "No result" },
  { key: "tied", label: "T", title: "Tied" },
] as const;

export function PointsTableGroup({
  group,
  qualifyingPlaces,
  headingId,
}: {
  group: PublishedPointsGroup;
  /** Rows at or above this position are marked as playoff qualifiers. */
  qualifyingPlaces: number;
  headingId: string;
}) {
  const qualifies = (row: PublishedPointsRow) => row.position <= qualifyingPlaces;
  const cutLine = (row: PublishedPointsRow) =>
    row.position === qualifyingPlaces && group.rows.length > qualifyingPlaces;

  return (
    <section className="flex flex-col gap-3" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="font-display border-line border-b pb-2 text-[1.4rem] font-extrabold uppercase"
      >
        {group.name}
      </h2>

      {/* Phones: one card per team — position, name, points and NRR, then the record. */}
      <ol className="flex flex-col sm:hidden">
        {group.rows.map((row) => (
          <li
            key={row.position}
            className={`border-line bg-dugout even:bg-dugout-2 flex gap-3 border-x border-t px-3 py-3 last:border-b ${
              qualifies(row) ? "border-l-gold border-l-2" : ""
            } ${cutLine(row) ? "border-b-clay border-b-2" : ""}`}
          >
            <span className="font-data text-chalk-dim w-5 shrink-0 pt-0.5 text-sm">{row.position}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display flex min-w-0 items-center gap-2 leading-tight font-bold uppercase">
                  <TeamBadge name={row.teamName} size={26} />
                  <span className="min-w-0">{row.teamName}</span>
                </span>
                <span className="font-data shrink-0 text-sm">
                  <strong className="text-chalk font-semibold">{formatPoints(row.points)}</strong>
                  <span className="text-chalk-dim"> pts</span>
                </span>
              </div>
              <div className="font-data text-chalk-dim mt-1 flex items-baseline justify-between gap-3 text-xs">
                <span>
                  M{row.played} · W{row.won} · L{row.lost} · NR{row.noResult} · T{row.tied}
                </span>
                <span className="shrink-0">NRR {formatNrr(row.netRunRate)}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="hidden sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="font-data text-chalk-dim border-line border-b text-[0.68rem] tracking-[0.08em] uppercase">
              <th scope="col" className="w-12 py-2 pr-2 pl-2 text-left font-normal">
                Pos
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
              <th scope="col" className="w-14 py-2 text-right font-normal">
                <abbr title="Points" className="no-underline">
                  Pts
                </abbr>
              </th>
              <th scope="col" className="hidden w-20 py-2 text-right font-normal lg:table-cell">
                Win%
              </th>
              <th scope="col" className="w-24 py-2 pr-3 pl-2 text-right font-normal lg:pr-0">
                <abbr title="Net run rate" className="no-underline">
                  NRR
                </abbr>
              </th>
              <th scope="col" className="hidden w-24 py-2 pl-2 text-right font-normal lg:table-cell">
                For
              </th>
              <th scope="col" className="hidden w-24 py-2 pr-3 pl-2 text-right font-normal lg:table-cell">
                Against
              </th>
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row) => (
              <tr
                key={row.position}
                className={`border-line odd:bg-dugout even:bg-dugout-2/50 border-b ${cutLine(row) ? "border-b-clay border-b-2" : ""}`}
              >
                <td
                  className={`font-data text-chalk-dim py-2.5 pr-2 pl-2 ${
                    qualifies(row) ? "border-l-gold border-l-2" : "border-l-2 border-l-transparent"
                  }`}
                >
                  {row.position}
                </td>
                <th scope="row" className="font-display py-2.5 pr-4 text-left text-base font-bold uppercase">
                  <span className="flex items-center gap-2.5">
                    <TeamBadge name={row.teamName} size={28} />
                    {row.teamName}
                  </span>
                </th>
                {STAT_COLUMNS.map((c) => (
                  <td key={c.key} className="font-data text-chalk-dim py-2.5 text-right">
                    {row[c.key]}
                  </td>
                ))}
                <td className="font-data text-chalk py-2.5 text-right font-semibold">
                  {formatPoints(row.points)}
                </td>
                <td className="font-data text-chalk-dim hidden py-2.5 text-right lg:table-cell">
                  {row.winPercent === null ? "—" : `${row.winPercent.toFixed(2)}%`}
                </td>
                <td className="font-data text-chalk-dim py-2.5 pr-3 pl-2 text-right lg:pr-0">
                  {formatNrr(row.netRunRate)}
                </td>
                <td className="font-data text-chalk-faint hidden py-2.5 pl-2 text-right lg:table-cell">
                  {row.runsFor ?? "—"}
                </td>
                <td className="font-data text-chalk-faint hidden py-2.5 pr-3 pl-2 text-right lg:table-cell">
                  {row.runsAgainst ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
