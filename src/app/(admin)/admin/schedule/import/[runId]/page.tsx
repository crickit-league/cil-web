import Link from "next/link";
import { auth } from "@/lib/auth";
import { getScheduleImportPreview, ImportRunNotFoundError } from "@/lib/services/schedule-import";
import { STAGE_LABEL } from "@/lib/import/schedule-plan";
import { formatMatchWhen } from "@/lib/time";
import { CommitBar, TeamMapper, UmpiringTeamMapper } from "./preview-controls";

type Preview = Awaited<ReturnType<typeof getScheduleImportPreview>>;
type PreviewMatch = Preview["plan"]["creates"][number];

function MatchLine({ m, extra }: { m: PreviewMatch; extra?: string }) {
  return (
    <li className="border-line flex flex-col gap-0.5 border-b py-2.5 last:border-0">
      <span className="font-medium">
        {m.teamOne} v {m.teamTwo}
        {m.stage !== "LEAGUE" ? (
          <span className="text-chalk-dim font-normal"> · {STAGE_LABEL[m.stage]}</span>
        ) : null}
      </span>
      <span className="text-chalk-dim text-sm">
        {formatMatchWhen(m)} · {m.ground || "Ground TBD"} · umpiring: {m.umpiringTeam ?? "—"}
      </span>
      {extra ? <span className="text-gold text-sm">{extra}</span> : null}
    </li>
  );
}

function Section({
  title,
  count,
  children,
  open = false,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  open?: boolean;
}) {
  if (count === 0) return null;
  return (
    <details open={open} className="border-line bg-dugout border">
      <summary className="font-display cursor-pointer px-4 py-3 text-lg font-extrabold tracking-wide uppercase">
        {title} <span className="font-data text-chalk-dim text-sm font-normal">· {count}</span>
      </summary>
      <div className="border-line border-t px-4 py-2">{children}</div>
    </details>
  );
}

export default async function ImportPreviewPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const session = await auth();

  let preview: Preview;
  try {
    preview = await getScheduleImportPreview(session!.user, runId);
  } catch (error) {
    if (error instanceof ImportRunNotFoundError) {
      return (
        <section className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Import</h1>
          <p className="text-chalk-dim">{error.message}</p>
          <Link
            href="/admin/schedule"
            className="text-clay-bright text-sm underline-offset-2 hover:underline"
          >
            Back to fixtures
          </Link>
        </section>
      );
    }
    throw error;
  }

  const { run, plan } = preview;
  const blocked = plan.problems.length > 0 || plan.unmatchedTeams.length > 0;
  const nothingToDo =
    !blocked &&
    plan.creates.length + plan.updates.length + plan.cancels.length + plan.poolChanges.length === 0;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/schedule"
          className="font-data text-chalk-dim hover:text-chalk text-xs tracking-[0.08em] uppercase"
        >
          ← Fixtures
        </Link>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-wide uppercase">Review import</h1>
        <p className="text-chalk-dim mt-1 text-sm">
          {run.fileName} · {run.rowCount} rows
          {run.fileSeriesName ? ` · CricClubs series "${run.fileSeriesName}"` : ""} → {preview.series.name}
        </p>
        <p className="text-chalk-faint mt-1 text-xs">
          Times are read as Atlanta time. Nothing is saved, and no emails are sent, until you import.
        </p>
      </div>

      {plan.problems.length > 0 ? (
        <div className="border-clay border p-4">
          <h2 className="font-display text-lg font-extrabold uppercase">Rows that can&apos;t be read</h2>
          <p className="text-chalk-dim mt-1 text-sm">
            Fix these in CricClubs and export again — importing without them would look like those matches
            were cancelled.
          </p>
          <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm">
            {plan.problems.map((p) => (
              <li key={`${p.rowNumber}-${p.message}`}>
                Row {p.rowNumber}: {p.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan.unmatchedTeams.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase">Teams to match up</h2>
            <p className="text-chalk-dim mt-1 text-sm">
              These CricClubs names don&apos;t match a team in the series. Pick the team each one is, or add
              it as new. Each mapping is remembered for future imports.
            </p>
          </div>
          <TeamMapper runId={run.id} unmatched={plan.unmatchedTeams} teamOptions={preview.teamOptions} />
        </div>
      ) : null}

      {!blocked ? (
        <>
          <div className="font-data text-chalk-dim flex flex-wrap gap-x-6 gap-y-1 text-xs tracking-[0.08em] uppercase">
            <span>{plan.creates.length} new</span>
            <span>{plan.updates.length} changed</span>
            <span>{plan.cancels.length} cancelled</span>
            <span>{plan.unchangedCount} unchanged</span>
          </div>

          {plan.warnings.length > 0 ? (
            <ul className="text-gold flex list-disc flex-col gap-1 pl-5 text-sm">
              {plan.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}

          {plan.scoreProblems.length > 0 ? (
            <div className="border-gold/40 border p-4">
              <h2 className="font-display text-lg font-extrabold uppercase">
                Scores that can&apos;t be read
              </h2>
              <p className="text-chalk-dim mt-1 text-sm">
                The result still imports, but these matches are left out of net run rate (any scores already
                saved are kept) until a file with readable scores is imported. Fix them in CricClubs and
                export again.
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm">
                {plan.scoreProblems.map((p) => (
                  <li key={p.rowNumber}>
                    Row {p.rowNumber}, {p.label}: {p.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {nothingToDo ? (
            <p className="text-chalk-dim">
              This file matches the saved schedule — there&apos;s nothing to import.
            </p>
          ) : null}

          {plan.unmatchedUmpiringTeams.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="font-display text-xl font-extrabold uppercase">
                  Umpiring teams not recognised
                </h2>
                <p className="text-chalk-dim mt-1 text-sm">
                  The &ldquo;Umpire One&rdquo; column of these upcoming matches doesn&apos;t name a team in
                  the series. Pick the team each one means — it&apos;s remembered for future imports — or
                  leave it and set the umpiring team on the schedule page after importing.
                </p>
              </div>
              <UmpiringTeamMapper
                runId={run.id}
                unmatched={plan.unmatchedUmpiringTeams}
                teamOptions={preview.teamOptions}
              />
            </div>
          ) : null}

          <Section title="Umpiring team kept" count={plan.umpireConflicts.length} open>
            <p className="text-chalk-dim py-2 text-sm">
              These were set on this site, and CricClubs now names a different team. The site&apos;s choice is
              kept — change it on the schedule page if CricClubs is right.
            </p>
            <ul>
              {plan.umpireConflicts.map((c) => (
                <li key={c.matchId} className="border-line border-b py-2 text-sm last:border-0">
                  <span className="font-medium">{c.label}</span>: keeping {c.siteTeam} (CricClubs says{" "}
                  {c.cricclubsTeam})
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Cancelled" count={plan.cancels.length} open>
            <p className="text-chalk-dim py-2 text-sm">
              Saved matches that aren&apos;t in this file. They&apos;re hidden from the schedule, not deleted
              — they come back if a later import includes them.
            </p>
            <ul>
              {plan.cancels.map((c) => (
                <li key={c.matchId} className="border-line border-b py-2 text-sm last:border-0">
                  {c.label}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Changed" count={plan.updates.length} open>
            <ul>
              {plan.updates.map((m) => (
                <MatchLine key={`${m.rowNumber}`} m={m} extra={m.changes.join(" · ")} />
              ))}
            </ul>
          </Section>

          <Section title="New" count={plan.creates.length} open={plan.creates.length <= 20}>
            <ul>
              {plan.creates.map((m) => (
                <MatchLine key={`${m.rowNumber}`} m={m} />
              ))}
            </ul>
          </Section>

          <Section title="Pools" count={plan.poolChanges.length}>
            <p className="text-chalk-dim py-2 text-sm">
              Worked out from who plays whom in the league stage. Adjust on the Teams page if the labels
              should be the other way round.
            </p>
            <ul>
              {plan.poolChanges.map((p) => (
                <li key={p.teamEntryId} className="border-line border-b py-2 text-sm last:border-0">
                  {p.teamName}: {p.from ? `Pool ${p.from}` : "unassigned"} → Pool {p.to}
                </li>
              ))}
            </ul>
          </Section>
        </>
      ) : null}

      <CommitBar runId={run.id} canCommit={preview.canCommit && !nothingToDo} />
    </section>
  );
}
