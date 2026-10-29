import { Sponsors } from "@/components/sections/sponsors";
import { PhotoCarousel } from "@/components/sections/photo-carousel";
import { ScoreTicker } from "@/components/home/score-ticker";
import { HomeHero } from "@/components/home/home-hero";
import { MatchdaySection } from "@/components/home/matchday-section";
import { listHomePhotos } from "@/lib/services/photos";
import { getHomeMatchday } from "@/lib/services/schedule";
import { getPointsTableSnapshot, PLAYOFF_PLACES_PER_GROUP } from "@/lib/services/points-table";

// In-season home page ("Matchday", chosen 2026-10-27): the photo carousel as
// the hero, the weekend's scores in a strip over its bottom edge, then results
// and fixtures beside the top of the points table. Each loader never throws,
// so the page renders (with what it has) even if the DB or R2 is unavailable.

// Photos, results and the table change with uploads and imports; refresh at
// most once a minute (photo admin changes also revalidate this path on demand).
export const revalidate = 60;

// The six qualifying places of each group (the playoff cut).
const POINTS_ROWS_PER_GROUP = PLAYOFF_PLACES_PER_GROUP;

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
      {hasPhotos ? <PhotoCarousel photos={photos} /> : null}
      <MatchdaySection matchday={matchday} points={points} />
      <Sponsors />
    </>
  );
}
