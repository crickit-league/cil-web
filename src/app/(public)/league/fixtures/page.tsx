import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { getPublicFixtures } from "@/lib/services/schedule";
import { compareMatchOldestFirst, formatWeekRange, groupByWeek } from "@/lib/time";
import { FixtureCard } from "./fixture-card";
import { TeamFilter } from "./team-filter";
import { WeekIndex, type WeekIndexEntry } from "./week-index";

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
    { key: "upcoming", title: "Scheduled", matches: byAge.filter((m) => m.fixtureStatus === "SCHEDULED") },
    { key: "completed", title: "Results", matches: byAge.filter((m) => m.fixtureStatus === "COMPLETED") },
  ].filter((section) => section.matches.length > 0);

  // Each section's matches in Monday-to-Sunday weeks; the index strip jumps to a week's heading.
  const weekId = (section: string, week: string) => `fixtures-${section}-${week}`;
  const weeksBySection = sections.map((s) => ({ ...s, weeks: [...groupByWeek(s.matches)] }));
  const indexEntries: WeekIndexEntry[] = weeksBySection.flatMap((s) =>
    s.weeks.map(([week]) => ({
      id: weekId(s.key, week),
      // "Oct 26": the Monday that starts the week.
      label: week === "tbd" ? "TBD" : formatWeekRange(week).split(" – ")[0],
    })),
  );

  return (
    // The week index is a fixed strip down the right; its column spans the whole page so it never overlaps the text.
    <div className="flex gap-3 sm:gap-5">
      <div className="flex min-w-0 flex-1 flex-col gap-8">
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
            {weeksBySection.map((section) => (
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
                </h2>
                {section.weeks.map(([week, weekMatches]) => (
                  <div key={week} className="flex flex-col gap-3">
                    <h3
                      id={weekId(section.key, week)}
                      className="font-data text-chalk-dim scroll-mt-36 text-xs tracking-[0.12em] uppercase"
                    >
                      {week === "tbd" ? "Date to be confirmed" : `Week of ${formatWeekRange(week)}`}
                    </h3>
                    <ul className="grid grid-cols-1 gap-3">
                      {weekMatches.map((m) => (
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
      <WeekIndex entries={indexEntries} />
    </div>
  );
}
