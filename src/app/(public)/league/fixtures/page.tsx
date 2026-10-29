import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { getPublicFixtures } from "@/lib/services/schedule";
import { compareMatchOldestFirst, formatFixtureDay, groupByMatchDay } from "@/lib/time";
import { FixtureCard } from "./fixture-card";
import { TeamFilter } from "./team-filter";

// Re-imports and admin edits must show up immediately.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fixtures",
  description:
    "Every match of this season's CIL Winter Championship: results, upcoming fixtures, grounds, umpiring teams and umpires.",
};

export default async function FixturesPage({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  const { team } = await searchParams;
  const { series, teams, matches, selectedTeamId } = await getPublicFixtures({ teamEntryId: team });
  const canEdit = can((await auth())?.user, "manage-league");

  // Two sections, each oldest first: matches still to be played, then completed ones.
  // Within a section, matches with no date yet come last.
  const byAge = [...matches].sort(compareMatchOldestFirst);
  const sections = [
    { key: "upcoming", title: "Upcoming", matches: byAge.filter((m) => m.fixtureStatus === "SCHEDULED") },
    { key: "completed", title: "Completed", matches: byAge.filter((m) => m.fixtureStatus === "COMPLETED") },
  ].filter((section) => section.matches.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <p className="text-chalk-dim text-sm">
        Every match of the season, with results as they come in. All times Atlanta time. The schedule is set
        in CricClubs and can change — check back before match day. Each match lists its umpiring team and,
        once the committee has them, its two umpires.
      </p>

      {series && teams.length > 0 ? <TeamFilter teams={teams} selected={selectedTeamId ?? null} /> : null}

      {matches.length === 0 ? (
        <p className="text-chalk-dim border-line bg-dugout border p-6">
          {selectedTeamId
            ? "No matches for this team yet."
            : "Fixtures will appear here once the committee publishes the schedule."}
        </p>
      ) : (
        <div className="flex flex-col gap-12">
          {sections.map((section) => (
            <section
              key={section.key}
              aria-labelledby={`fixtures-${section.key}`}
              className="flex flex-col gap-8"
            >
              <h2
                id={`fixtures-${section.key}`}
                className="font-display border-clay flex items-baseline gap-3 border-b-2 pb-2 text-[1.9rem] leading-none font-extrabold uppercase"
              >
                {section.title}
                <span className="font-data text-chalk-faint text-xs tracking-[0.1em]">
                  {section.matches.length}
                </span>
              </h2>
              {[...groupByMatchDay(section.matches).entries()].map(([key, dayMatches]) => (
                <div key={key} className="flex flex-col gap-3">
                  <h3 className="font-display border-line border-b pb-2 text-[1.4rem] font-extrabold uppercase">
                    {formatFixtureDay(dayMatches[0].startsAt)}
                  </h3>
                  <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {dayMatches.map((m) => (
                      <FixtureCard key={m.id} m={m} highlight={selectedTeamId ?? null} canEdit={canEdit} />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
