import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results · CIL Winter League",
};

// PLACEHOLDER — built by the results/points-table follow-up. Completed matches
// are already imported (Match.status/resultType/winnerId/resultText; see
// getPublicFixtures in services/schedule.ts for the query shape to mirror).
export default function ResultsPage() {
  return (
    <p className="text-chalk-dim border-line bg-dugout border p-6">
      Results will appear here once the season&apos;s first matches are played.
    </p>
  );
}
