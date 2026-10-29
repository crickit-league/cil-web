import { findCurrentSeries } from "@/lib/services/series";
import { LeagueHeading } from "./league-heading";

// Reads the current series, and every page shows data that changes with each
// import, so nothing under /league is prerendered.
export const dynamic = "force-dynamic";

// Shared shell for the league pages (Fixtures / Points Table, each
// its own route segment under /league and its own item in the site header).
export default async function LeagueLayout({ children }: { children: React.ReactNode }) {
  const { season, series } = await findCurrentSeries();

  return (
    <section className="py-8 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="mb-6 flex flex-col gap-2">
          <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">
            {season ? `Season ${season.name.replace("-", "–")}` : "This Season"}
          </span>
          <LeagueHeading />
          {series ? <p className="text-chalk-dim mt-1">{series.name}</p> : null}
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}
