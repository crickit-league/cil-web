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

  const { run, current, groups, problems, canCommit } = preview;
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
