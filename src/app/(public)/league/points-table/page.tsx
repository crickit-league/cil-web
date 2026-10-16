import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Points Table · CIL Winter League",
};

// PLACEHOLDER — built by the results/points-table follow-up: standings are
// derived on read from Match + Innings (CLAUDE.md), per pool (TeamEntry.pool).
export default function PointsTablePage() {
  return (
    <p className="text-chalk-dim border-line bg-dugout border p-6">
      The points table will appear here once league matches have been played.
    </p>
  );
}
