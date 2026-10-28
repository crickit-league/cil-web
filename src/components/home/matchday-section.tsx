import Image from "next/image";
import Link from "next/link";
import type { HomeMatchday } from "@/lib/services/schedule";
import type { SnapshotGroup } from "@/lib/services/points-table";
import { formatMatchdaySpan } from "@/lib/matchday";
import { titleSponsor } from "@/lib/sponsors";
import { formatFixtureDay, groupByMatchDay } from "@/lib/time";
import { HomeMatchCard } from "./home-match-card";
import { MatchdayTabs, type MatchdayTab } from "./matchday-tabs";
import { PointsSnapshot } from "./points-snapshot";

// The home page under the photos: last weekend's results and this weekend's
// fixtures (a switch between the two), with the top of the points table
// alongside. Umpires and umpire entry stay on each fixture's own page.

function MatchList({ matches }: { matches: HomeMatchday["results"] }) {
  return (
    <div className="flex flex-col gap-8">
      {[...groupByMatchDay(matches).entries()].map(([key, dayMatches]) => (
        <section key={key} className="flex flex-col gap-3">
          <h3 className="font-display border-line border-b pb-2 text-[1.25rem] font-extrabold uppercase">
            {formatFixtureDay(dayMatches[0].startsAt)}
          </h3>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {dayMatches.map((m) => (
              <li key={m.id}>
                <HomeMatchCard m={m} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function MatchdaySection({
  matchday,
  points,
}: {
  matchday: HomeMatchday | null;
  points: { uploadedAt: Date; groups: SnapshotGroup[] } | null;
}) {
  const tabs: MatchdayTab[] = [];
  if (matchday && matchday.results.length > 0) {
    tabs.push({
      key: "results",
      label: "Results",
      detail: formatMatchdaySpan(matchday.results),
      content: <MatchList matches={matchday.results} />,
    });
  }
  if (matchday && matchday.upcoming.length > 0) {
    tabs.push({
      key: "upcoming",
      label: "Fixtures",
      detail: formatMatchdaySpan(matchday.upcoming),
      content: <MatchList matches={matchday.upcoming} />,
    });
  }

  return (
    <section aria-labelledby="home-matchday" className="py-10 sm:py-14">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">
                Winter Championship
              </span>
              <h2
                id="home-matchday"
                className="font-display mt-2 text-4xl leading-[0.95] font-extrabold uppercase sm:text-5xl"
              >
                Matchday
              </h2>
            </div>
            {titleSponsor ? (
              <a
                href={titleSponsor.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Presented by ${titleSponsor.name} (opens Instagram)`}
                className="flex items-center gap-3"
              >
                <span className="font-data text-chalk-dim text-[0.62rem] tracking-[0.16em] uppercase">
                  Presented by
                </span>
                <span className="border-line hover:border-clay-bright block overflow-hidden rounded-lg border bg-white p-1 transition-colors">
                  <span className="relative block aspect-[2.45/1] w-[110px] overflow-hidden rounded">
                    <Image
                      src={titleSponsor.logo}
                      alt=""
                      fill
                      sizes="110px"
                      className="scale-[1.08] object-cover"
                    />
                  </span>
                </span>
              </a>
            ) : null}
          </div>

          {tabs.length > 0 ? (
            <MatchdayTabs tabs={tabs} initial={matchday?.lead ?? "results"} />
          ) : (
            <p className="text-chalk-dim border-line bg-dugout rounded-xl border p-6">
              Fixtures will appear here once the committee publishes the schedule.
            </p>
          )}

          <Link
            href="/league/fixtures"
            className="font-data border-line text-chalk hover:border-chalk-dim hover:bg-dugout-2 self-start rounded-full border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors"
          >
            All fixtures &amp; results &rarr;
          </Link>
        </div>

        <aside className="min-w-0">
          <PointsSnapshot snapshot={points} />
        </aside>
      </div>
    </section>
  );
}
