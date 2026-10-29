import Link from "next/link";
import type { SnapshotGroup } from "@/lib/services/points-table";
import { formatNrr } from "@/components/points-table/points-table-group";
import { FORM_LENGTH, type FormResult } from "@/lib/form";
import { formatMatchDay } from "@/lib/time";
import { TeamBadge } from "@/components/team-badge";

// The top of each group of the uploaded CricClubs points table, as a short
// list (rank, team and form guide, points and NRR) that fits a phone and the
// home page's sidebar alike. The full table is on /league/points-table.

const FORM_STYLE: Record<FormResult, { className: string; label: string }> = {
  W: { className: "bg-win text-on-accent", label: "Won" },
  L: { className: "bg-loss text-on-accent", label: "Lost" },
  T: { className: "bg-chalk-faint text-on-accent", label: "Tied" },
  N: { className: "bg-chalk-faint text-on-accent", label: "No result" },
};

/** Last results, oldest first, padded with empty squares to a fixed width so every row lines up. */
function FormGuide({ form }: { form: FormResult[] }) {
  const empty = Math.max(0, FORM_LENGTH - form.length);
  return (
    <span
      className="flex gap-[3px]"
      aria-label={`Last ${form.length} results: ${form.map((r) => FORM_STYLE[r].label).join(", ") || "none yet"}`}
    >
      {form.map((r, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`font-data grid h-4 w-4 place-items-center rounded-[4px] text-[0.58rem] font-semibold ${FORM_STYLE[r].className}`}
        >
          {r === "N" ? "–" : r}
        </span>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <span
          key={`empty-${i}`}
          aria-hidden="true"
          className="border-line h-4 w-4 rounded-[4px] border border-dashed"
        />
      ))}
    </span>
  );
}

export function PointsSnapshot({
  snapshot,
}: {
  snapshot: { uploadedAt: Date; groups: SnapshotGroup[] } | null;
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
            <div
              key={group.name}
              className="bg-dugout border-line flex flex-col rounded-lg border px-3.5 pt-2.5 pb-1 shadow-sm"
            >
              <h3 className="font-data text-chalk-dim border-line border-b pb-2 text-[0.68rem] tracking-[0.12em] uppercase">
                {group.name}
              </h3>
              <ol>
                {group.rows.map((row) => (
                  <li
                    key={row.position}
                    className="border-line grid grid-cols-[1.25rem_auto_minmax(0,1fr)_auto] items-center gap-3 border-b py-2 last:border-b-0"
                  >
                    <span className="font-data text-chalk-faint text-right text-xs">{row.position}</span>
                    <TeamBadge name={row.teamName} size={28} />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-semibold">{row.teamName}</span>
                      <span className="flex items-center gap-2">
                        <FormGuide form={row.form} />
                        <span className="font-data text-chalk-faint text-[0.66rem]">P{row.played}</span>
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
        <p className="border-line bg-dugout text-chalk-dim rounded-lg border p-4 text-sm">
          The committee posts the table from CricClubs once league matches are under way.
        </p>
      )}
    </section>
  );
}
