import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { getMatchEditOptions, getPublicFixtures } from "@/lib/services/schedule";
import { formatFixtureDay, groupByMatchDay } from "@/lib/time";
import { FixtureCard } from "./fixture-card";
import { TeamFilter } from "./team-filter";
import { FixtureExpansionProvider } from "./umpire-entry";

// Re-imports and umpire changes must show up immediately.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fixtures · CIL Winter League",
  description:
    "Every match of this season's CIL Winter Championship: results, upcoming fixtures, grounds, umpiring teams and umpires.",
};

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; umpire?: string }>;
}) {
  const { team, umpire } = await searchParams;
  const { series, teams, matches, selectedTeamId, selectedUmpiringTeamId } = await getPublicFixtures({
    teamEntryId: team,
    umpiringTeamId: umpire,
  });
  const session = await auth();
  const canEditUmpires = Boolean(series) && can(session?.user, "edit-umpires");
  const canEditMatch = Boolean(series) && can(session?.user, "manage-league");
  const editOptions = canEditMatch && session?.user ? await getMatchEditOptions(session.user) : null;

  // Matches come sorted (compareMatchWhen), so the "Date TBD" group (not
  // scheduled yet) is first, then days newest first.
  const days = groupByMatchDay(matches);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-chalk-dim text-sm">
        Every match of the season, with results as they come in. All times Atlanta time. The schedule is set
        in CricClubs and can change — check back before match day. Each match lists its umpiring team and,
        once the committee has them, its two umpires.
      </p>

      {series && teams.length > 0 ? (
        <TeamFilter teams={teams} selected={selectedTeamId} selectedUmpiring={selectedUmpiringTeamId} />
      ) : null}

      {matches.length === 0 ? (
        <p className="text-chalk-dim border-line bg-dugout border p-6">
          {selectedTeamId || selectedUmpiringTeamId
            ? "No matches for this filter yet."
            : "Fixtures will appear here once the committee publishes the schedule."}
        </p>
      ) : (
        <FixtureExpansionProvider>
          <div className="flex flex-col gap-10">
            {[...days.entries()].map(([key, dayMatches]) => (
              <section key={key} className="flex flex-col gap-3">
                <h2 className="font-display border-line border-b pb-2 text-[1.4rem] font-extrabold uppercase">
                  {formatFixtureDay(dayMatches[0].startsAt)}
                </h2>
                <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {dayMatches.map((m) => (
                    <FixtureCard
                      key={m.id}
                      m={m}
                      highlight={selectedTeamId ?? null}
                      canEditUmpires={canEditUmpires}
                      editOptions={editOptions}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </FixtureExpansionProvider>
      )}
    </div>
  );
}
