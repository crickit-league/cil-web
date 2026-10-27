import type { Metadata } from "next";
import { getPublishedPointsTable, PLAYOFF_PLACES_PER_GROUP } from "@/lib/services/points-table";
import { formatMatchDay } from "@/lib/time";
import { PointsTableGroup } from "@/components/points-table/points-table-group";

export const metadata: Metadata = {
  title: "Points Table · CIL Winter League",
  description: "League-stage standings by group for this season's CIL Winter Championship.",
};

// The table is CricClubs' (it calculates points, NRR and tie-breaks); the
// committee uploads its export on /admin/points-table and this shows the
// latest upload as given.
export default async function PointsTablePage() {
  const table = await getPublishedPointsTable();

  if (!table) {
    return (
      <div className="border-line bg-dugout flex flex-col gap-2 border p-6 sm:p-8">
        <p className="font-display text-xl font-extrabold uppercase">Points table not published yet</p>
        <p className="text-chalk-dim max-w-[60ch] text-sm">
          The committee posts the table from CricClubs once league matches are under way. Results are on the
          Fixtures page in the meantime.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="text-chalk-dim flex max-w-[66ch] flex-col gap-2 text-sm">
        <p className="font-data text-chalk text-xs tracking-[0.08em] uppercase">
          Last updated {formatMatchDay(table.uploadedAt)}
        </p>
        <p>
          League stage, from CricClubs. The top {PLAYOFF_PLACES_PER_GROUP} in each group{" "}
          <span className="text-gold">(marked in gold)</span> go through to the playoffs.
        </p>
      </div>

      {table.groups.map((group, i) => (
        <PointsTableGroup
          key={`${i}-${group.name}`}
          group={group}
          qualifyingPlaces={PLAYOFF_PLACES_PER_GROUP}
          headingId={`group-${i}`}
        />
      ))}
    </div>
  );
}
