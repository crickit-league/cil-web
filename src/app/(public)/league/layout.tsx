import { findCurrentSeries } from "@/lib/services/series";
import { LeagueTabs } from "./league-tabs";

// Reads the current series, and every tab shows data that changes with each
// import, so nothing under /league is prerendered.
export const dynamic = "force-dynamic";

// Shared shell for the league pages: heading plus the Fixtures / Results /
// Points Table tabs. Each tab is its own route segment under /league.
export default async function LeagueLayout({ children }: { children: React.ReactNode }) {
  const { season, series } = await findCurrentSeries();

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="mb-6 flex flex-col gap-2">
          <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">
            {season ? `Season ${season.name.replace("-", "–")}` : "This Season"}
          </span>
          <h1 className="font-display text-[2.5rem] leading-none font-extrabold uppercase sm:text-[3.5rem]">
            League
          </h1>
          {series ? <p className="text-chalk-dim mt-1">{series.name}</p> : null}
        </div>
        <LeagueTabs />
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
