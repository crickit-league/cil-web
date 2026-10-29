import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  getPointsTableImportPreview,
  PLAYOFF_PLACES_PER_GROUP,
  PointsTableImportNotFoundError,
} from "@/lib/services/points-table";
import { formatMatchDay, formatMatchTime } from "@/lib/time";
import { PointsTableGroup } from "@/components/points-table/points-table-group";
import { CommitBar } from "./commit-bar";
import { TeamMapper } from "./team-mapper";

type Preview = Awaited<ReturnType<typeof getPointsTableImportPreview>>;

export default async function PointsTablePreviewPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const session = await auth();

  let preview: Preview;
  try {
    preview = await getPointsTableImportPreview(session!.user, runId);
  } catch (error) {
    if (error instanceof PointsTableImportNotFoundError) {
      return (
        <section className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Points Table</h1>
          <p className="text-chalk-dim">{error.message}</p>
          <Link
            href="/admin/points-table"
            className="text-clay-bright text-sm underline-offset-2 hover:underline"
          >
            Back to the points table
          </Link>
        </section>
      );
    }
    throw error;
  }

  const { run, series, current, groups, problems, unmatchedTeams, collisions, teamOptions, canCommit } =
    preview;
  const teamCount = groups.reduce((n, g) => n + g.rows.length, 0);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/points-table"
          className="font-data text-chalk-dim hover:text-chalk text-xs tracking-[0.08em] uppercase"
        >
          ← Points Table
        </Link>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-wide uppercase">Review upload</h1>
        <p className="text-chalk-dim mt-1 text-sm break-words">
          {run.fileName} · {groups.length} group{groups.length === 1 ? "" : "s"} · {teamCount} team
          {teamCount === 1 ? "" : "s"}.
          {current
            ? ` Publishing replaces the table uploaded ${formatMatchDay(current.uploadedAt)}, ${formatMatchTime(current.uploadedAt)}.`
            : " Nothing is published yet."}
        </p>
      </div>

      {problems.length > 0 ? (
        <div className="border-clay border p-4">
          <h2 className="font-display text-lg font-extrabold uppercase">Rows that can&apos;t be read</h2>
          <p className="text-chalk-dim mt-1 text-sm">
            Nothing can be published until these are fixed. Check the file is CricClubs&apos; Points Table
            export and hasn&apos;t been edited, then upload it again.
          </p>
          <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm">
            {problems.map((p) => (
              <li key={`${p.lineNumber}-${p.message}`}>
                {p.lineNumber > 0 ? `Line ${p.lineNumber}: ` : ""}
                {p.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {unmatchedTeams.length > 0 ? (
        <div className="border-clay flex flex-col gap-3 border p-4">
          <div>
            <h2 className="font-display text-lg font-extrabold uppercase">Teams to match up</h2>
            <p className="text-chalk-dim mt-1 text-sm">
              {unmatchedTeams.length === 1 ? "This name doesn't" : "These names don't"} match any team in{" "}
              {series.name}, so nothing can be published yet.
            </p>
            <ul className="text-chalk-dim mt-2 flex list-disc flex-col gap-1 pl-5 text-sm">
              <li>
                If every name is unfamiliar, this is probably an older season&apos;s file — download this
                season&apos;s Points Table export from CricClubs and upload that instead.
              </li>
              <li>
                If a team was renamed here or in CricClubs, pick which team the name is. It&apos;s remembered,
                so later uploads and fixture imports match it too.
              </li>
            </ul>
          </div>
          <TeamMapper runId={run.id} unmatched={unmatchedTeams} teamOptions={teamOptions} />
        </div>
      ) : null}

      {collisions.length > 0 ? (
        <div className="border-clay border p-4">
          <h2 className="font-display text-lg font-extrabold uppercase">One team, two rows</h2>
          <p className="text-chalk-dim mt-1 text-sm">
            These names in the file are all the same team here, so the table can&apos;t be published. Check
            the file, or the names the team is known by.
          </p>
          <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm">
            {collisions.map((c) => (
              <li key={c.team}>
                {c.team}: {c.names.map((n) => `"${n}"`).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <CommitBar runId={run.id} canCommit={canCommit} />

      {groups.map((group, i) => (
        <PointsTableGroup
          key={`${i}-${group.name}`}
          group={group}
          qualifyingPlaces={PLAYOFF_PLACES_PER_GROUP}
          headingId={`preview-group-${i}`}
        />
      ))}
    </section>
  );
}
