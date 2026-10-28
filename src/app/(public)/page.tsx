import { Sponsors } from "@/components/sections/sponsors";
import { PhotoCarousel } from "@/components/sections/photo-carousel";
import { ScoreTicker } from "@/components/home/score-ticker";
import { HomeHero } from "@/components/home/home-hero";
import { MatchdaySection } from "@/components/home/matchday-section";
import { listHomePhotos } from "@/lib/services/photos";
import { getHomeMatchday } from "@/lib/services/schedule";
import { getPointsTableSnapshot } from "@/lib/services/points-table";

// In-season home page ("Matchday", chosen 2026-10-27): the photo carousel as
// the hero, the weekend's scores in a strip over its bottom edge, then results
// and fixtures beside the top of the points table. Each loader never throws,
// so the page renders (with what it has) even if the DB or R2 is unavailable.

// Photos, results and the table change with uploads and imports; refresh at
// most once a minute (photo admin changes also revalidate this path on demand).
export const revalidate = 60;

const POINTS_ROWS_PER_GROUP = 4;

// Each section below the banner sits in its own card, so the page background shows between them.
function HomeCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-line bg-dugout/90 overflow-hidden rounded-2xl border shadow-sm">{children}</div>
  );
}

export default async function HomePage() {
  const [photos, matchday, points] = await Promise.all([
    listHomePhotos(),
    getHomeMatchday(),
    getPointsTableSnapshot(POINTS_ROWS_PER_GROUP),
  ]);
  const hasPhotos = photos.length > 0;
  const lead = matchday?.lead ?? "results";
  const stripMatches = matchday ? (lead === "results" ? matchday.results : matchday.upcoming) : [];

  return (
    <>
      <ScoreTicker matches={stripMatches} kind={lead} />
      <HomeHero />
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-3 py-6 sm:gap-6 sm:px-8 sm:py-8">
        {hasPhotos ? (
          <HomeCard>
            <PhotoCarousel photos={photos} />
          </HomeCard>
        ) : null}
        <HomeCard>
          <MatchdaySection matchday={matchday} points={points} />
        </HomeCard>
        <HomeCard>
          <Sponsors />
        </HomeCard>
      </div>
    </>
  );
}
