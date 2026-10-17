import type { Metadata } from "next";
import { getPublicFixtures, type ScheduleMatch } from "@/lib/services/schedule";
import { formatMatchDay, matchDayKey } from "@/lib/time";
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

export default async function FixturesPage({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  const { team } = await searchParams;
  const { series, teams, matches, selectedTeamId } = await getPublicFixtures({ teamEntryId: team });
  const entryOpen = series ? !series.umpireEntryLocked : false;

  const days = new Map<string, ScheduleMatch[]>();
  for (const m of matches) {
    const key = matchDayKey(m.startsAt);
    if (!days.has(key)) days.set(key, []);
    days.get(key)!.push(m);
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-chalk-dim max-w-[66ch] text-sm">
        Every match of the season, with results as they come in. All times Atlanta time. The schedule is set
        in CricClubs and can change — check back before match day. The umpiring team enters its two umpires on
        each upcoming fixture.
      </p>

      {series && !entryOpen ? (
        <p role="status" className="border-gold/40 bg-dugout border p-4 text-sm">
          Umpire entry is closed. Contact the committee if a fixture&apos;s umpires need to change.
        </p>
      ) : null}

      {series && teams.length > 0 ? <TeamFilter teams={teams} selected={selectedTeamId ?? null} /> : null}

      {matches.length === 0 ? (
        <p className="text-chalk-dim border-line bg-dugout border p-6">
          {selectedTeamId
            ? "No matches for this team yet."
            : "Fixtures will appear here once the committee publishes the schedule."}
        </p>
      ) : (
        <FixtureExpansionProvider>
          <div className="flex flex-col gap-10">
            {[...days.entries()].map(([key, dayMatches]) => (
              <section key={key} className="flex flex-col gap-3">
                <h2 className="font-display border-line border-b pb-2 text-[1.4rem] font-extrabold uppercase">
                  {formatMatchDay(dayMatches[0].startsAt)}
                </h2>
                <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {dayMatches.map((m) => (
                    <FixtureCard key={m.id} m={m} highlight={selectedTeamId ?? null} entryOpen={entryOpen} />
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
