import Link from "next/link";
import type { PublishedPointsGroup } from "@/lib/services/points-table";
import { formatNrr } from "@/components/points-table/points-table-group";
import { formatMatchDay } from "@/lib/time";

// The top of each group of the uploaded CricClubs points table, as a short
// list (rank, team and record, points and NRR) that fits a phone and the home
// page's sidebar alike. The full table is on /league/points-table.

export function PointsSnapshot({
  snapshot,
}: {
  snapshot: { uploadedAt: Date; groups: PublishedPointsGroup[] } | null;
}) {
  return (
    <section aria-labelledby="home-points" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="home-points" className="font-display text-[1.6rem] leading-none font-extrabold uppercase">
          Points table
        </h2>
        <Link
          href="/league/points-table"
          className="text-chalk-dim hover:text-chalk text-sm whitespace-nowrap"
        >
          Full table &rarr;
        </Link>
      </div>

      {snapshot ? (
        <>
          {snapshot.groups.map((group) => (
            <div key={group.name} className="flex flex-col">
              <h3 className="font-data text-chalk-dim border-line border-b pb-1.5 text-[0.68rem] tracking-[0.12em] uppercase">
                {group.name}
              </h3>
              <ol>
                {group.rows.map((row) => (
                  <li
                    key={row.position}
                    className="border-line grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-3 border-b py-2"
                  >
                    <span className="font-data text-chalk-faint text-right text-xs">{row.position}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{row.teamName}</span>
                      <span className="font-data text-chalk-faint text-[0.68rem]">
                        P{row.played} &middot; W{row.won} &middot; L{row.lost}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="font-display block text-[1.35rem] leading-none font-extrabold">
                        {Number.isInteger(row.points) ? row.points : row.points.toFixed(1)}
                      </span>
                      <span className="font-data text-chalk-faint text-[0.68rem]">
                        {formatNrr(row.netRunRate)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <p className="font-data text-chalk-faint text-[0.68rem] tracking-[0.06em] uppercase">
            From CricClubs &middot; updated {formatMatchDay(snapshot.uploadedAt)}
          </p>
        </>
      ) : (
        <p className="border-line bg-dugout text-chalk-dim border p-4 text-sm">
          The committee posts the table from CricClubs once league matches are under way.
        </p>
      )}
    </section>
  );
}
