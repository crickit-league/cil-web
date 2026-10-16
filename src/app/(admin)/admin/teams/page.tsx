import { auth } from "@/lib/auth";
import { getSeriesAdminView } from "@/lib/services/series";
import { CreateSeriesForm } from "./create-series-form";
import { TeamsManager } from "./teams-manager";

function formatDate(date: Date) {
  // Stored as a calendar date at UTC midnight; format in UTC so it doesn't
  // slip a day in Atlanta.
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function TeamsAdminPage() {
  const session = await auth();
  const view = await getSeriesAdminView(session!.user);

  if (!view.season) {
    return (
      <section className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Teams</h1>
        <p className="text-chalk-dim">
          There&apos;s no current season, so there&apos;s nothing to set up yet.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Teams</h1>
          {view.series ? (
            <p className="text-chalk-dim mt-1 text-sm">
              {view.series.name} · starts {formatDate(view.series.startDate)} · {view.series.maxOvers} overs,{" "}
              {view.series.playersPerSide} a side
            </p>
          ) : (
            <p className="text-chalk-dim mt-1 text-sm">Season {view.season.name}</p>
          )}
        </div>
      </div>

      {view.series ? (
        <TeamsManager
          seriesId={view.series.id}
          teams={view.teams}
          pendingRegistrations={view.pendingRegistrations}
        />
      ) : (
        <CreateSeriesForm seasonName={view.season.name} />
      )}
    </section>
  );
}
