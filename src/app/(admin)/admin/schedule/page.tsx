import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAdminSchedule } from "@/lib/services/schedule";
import { STAGE_LABEL } from "@/lib/import/schedule-plan";
import { formatMatchDay, formatMatchTime, matchDayKey } from "@/lib/time";
import { UploadForm } from "./upload-form";
import { UmpiringSelect } from "./umpiring-select";
import { UmpireEntryLock } from "./umpire-entry-lock";
import { RevealPhonesButton } from "@/components/umpires/reveal-phones-button";
import { UmpireForm } from "@/components/umpires/umpire-form";

type AdminMatch = Awaited<ReturnType<typeof getAdminSchedule>>["matches"][number];

function matchTitle(m: AdminMatch) {
  return `${m.teamOne?.name ?? m.teamOneSource ?? "TBD"} v ${m.teamTwo?.name ?? m.teamTwoSource ?? "TBD"}`;
}

function SourceTag({ match }: { match: AdminMatch }) {
  if (!match.umpiringTeam) {
    return <span className="text-clay-bright text-xs">Needs an umpiring team</span>;
  }
  return (
    <span className="font-data text-chalk-faint text-[0.62rem] tracking-[0.08em] uppercase">
      {match.umpiringTeamSource === "ADMIN" ? "Set here — imports won't change it" : "From CricClubs"}
    </span>
  );
}

/** Nominated umpires plus an inline editor. Admins can edit even while public entry is closed. */
function AdminUmpires({ match }: { match: AdminMatch }) {
  const { one, two, hasPhones } = match.umpires;
  return (
    <div className="flex flex-col gap-2 text-sm">
      {one || two ? (
        <div>
          {one ? <div>{one}</div> : null}
          {two ? <div className="text-chalk-dim">{two} (backup)</div> : null}
        </div>
      ) : (
        <div className="text-chalk-faint">No umpires yet</div>
      )}
      {hasPhones ? <RevealPhonesButton matchId={match.id} /> : null}
      <details>
        <summary className="font-data text-clay-bright cursor-pointer text-[0.68rem] tracking-[0.08em] uppercase">
          Edit umpires
        </summary>
        <div className="border-line mt-3 border-t pt-3">
          <UmpireForm matchId={match.id} umpireOneName={one} umpireTwoName={two} />
        </div>
      </details>
    </div>
  );
}

export default async function ScheduleAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  const params = await searchParams;
  const { series, teams, matches, lastImport } = await getAdminSchedule(session!.user);

  if (!series) {
    return (
      <section className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Fixtures</h1>
        <p className="text-chalk-dim">
          Create the season&apos;s series on the{" "}
          <Link href="/admin/teams" className="text-clay-bright underline-offset-2 hover:underline">
            Teams page
          </Link>{" "}
          first, then import the schedule here.
        </p>
      </section>
    );
  }

  const days = new Map<string, AdminMatch[]>();
  for (const m of matches) {
    const key = matchDayKey(m.startsAt);
    if (!days.has(key)) days.set(key, []);
    days.get(key)!.push(m);
  }
  const optionsFor = (m: AdminMatch) => teams.filter((t) => t.id !== m.teamOne?.id && t.id !== m.teamTwo?.id);
  const missingUmpires = matches.filter((m) => !m.umpiringTeam).length;

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Fixtures</h1>
          <p className="text-chalk-dim mt-1 text-sm">
            {series.name} · {matches.length} match{matches.length === 1 ? "" : "es"}
            {matches.length > 0 ? ` · ${missingUmpires} without an umpiring team` : ""}
          </p>
          {lastImport ? (
            <p className="text-chalk-faint mt-1 text-xs">
              Last import: {lastImport.fileName}, {lastImport.committedAt?.toLocaleString("en-US")} by{" "}
              {lastImport.startedBy.email}
            </p>
          ) : null}
        </div>
        <Link
          href="/league/fixtures"
          className="font-data text-clay-bright self-start text-xs tracking-[0.08em] uppercase underline-offset-2 hover:underline sm:self-auto"
        >
          View public page →
        </Link>
      </div>

      {params.imported ? (
        <div role="status" className="border-gold/40 bg-dugout border p-4 text-sm">
          Schedule imported: {params.created ?? 0} new, {params.updated ?? 0} changed, {params.cancelled ?? 0}{" "}
          cancelled.
          {Number(params.conflicts) > 0
            ? ` ${params.conflicts} match${params.conflicts === "1" ? "" : "es"} kept the umpiring team set here instead of CricClubs'.`
            : ""}{" "}
          No emails were sent.
        </div>
      ) : null}

      <UploadForm />

      <UmpireEntryLock locked={series.umpireEntryLocked} />

      {matches.length === 0 ? (
        <p className="text-chalk-dim">No matches yet. Import the CricClubs schedule to start.</p>
      ) : (
        [...days.entries()].map(([key, dayMatches]) => (
          <section key={key} className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-extrabold tracking-wide uppercase">
              {formatMatchDay(dayMatches[0].startsAt)}
            </h2>

            {/* Cards below `lg` — five columns next to the admin sidebar don't fit a tablet. */}
            <div className="flex flex-col gap-3 lg:hidden">
              {dayMatches.map((m) => (
                <div key={m.id} className="border-line bg-dugout flex flex-col gap-3 border p-4">
                  <div>
                    <div className="font-data text-chalk-dim text-[0.68rem] tracking-[0.08em] uppercase">
                      {formatMatchTime(m.startsAt)} · {m.ground ?? "Ground TBD"}
                      {m.stage !== "LEAGUE" ? ` · ${STAGE_LABEL[m.stage]}` : ""}
                    </div>
                    <div className="mt-1 font-medium">{matchTitle(m)}</div>
                    {m.resultText ? <div className="text-chalk-dim mt-1 text-sm">{m.resultText}</div> : null}
                  </div>
                  <UmpiringSelect
                    matchId={m.id}
                    value={m.umpiringTeam?.id ?? null}
                    options={optionsFor(m)}
                    label={`Umpiring team for ${matchTitle(m)}`}
                  />
                  <SourceTag match={m} />
                  <div className="border-line border-t pt-3">
                    <span className="font-data text-chalk-faint block text-[0.62rem] tracking-[0.1em] uppercase">
                      Umpires
                    </span>
                    <AdminUmpires match={m} />
                  </div>
                </div>
              ))}
            </div>

            {/* Table at `lg` and up. */}
            <div className="border-line hidden overflow-x-auto border lg:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="font-data border-line text-chalk-dim border-b text-[0.68rem] tracking-[0.1em] uppercase">
                    <th className="w-24 px-4 py-3">Time</th>
                    <th className="px-4 py-3">Match</th>
                    <th className="px-4 py-3">Ground</th>
                    <th className="w-56 px-4 py-3">Umpiring team</th>
                    <th className="w-72 px-4 py-3">Umpires</th>
                  </tr>
                </thead>
                <tbody>
                  {dayMatches.map((m) => (
                    <tr key={m.id} className="border-line border-b align-top last:border-0">
                      <td className="text-chalk-dim px-4 py-3 whitespace-nowrap">
                        {formatMatchTime(m.startsAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{matchTitle(m)}</div>
                        <div className="text-chalk-dim mt-0.5 text-xs">
                          {m.stage !== "LEAGUE" ? STAGE_LABEL[m.stage] : ""}
                          {m.stage !== "LEAGUE" && m.resultText ? " · " : ""}
                          {m.resultText ?? ""}
                        </div>
                      </td>
                      <td className="text-chalk-dim px-4 py-3">{m.ground ?? "—"}</td>
                      <td className="flex flex-col gap-1 px-4 py-2">
                        <UmpiringSelect
                          matchId={m.id}
                          value={m.umpiringTeam?.id ?? null}
                          options={optionsFor(m)}
                          label={`Umpiring team for ${matchTitle(m)}`}
                        />
                        <SourceTag match={m} />
                      </td>
                      <td className="px-4 py-3">
                        <AdminUmpires match={m} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </section>
  );
}
