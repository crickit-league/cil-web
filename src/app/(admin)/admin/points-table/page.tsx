import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPointsTableAdminSummary } from "@/lib/services/points-table";
import { formatMatchDay, formatMatchTime } from "@/lib/time";
import { UploadForm } from "./upload-form";

export default async function PointsTableAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  const params = await searchParams;
  const { series, current } = await getPointsTableAdminSummary(session!.user);

  if (!series) {
    return (
      <section className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Points Table</h1>
        <p className="text-chalk-dim">
          Create the season&apos;s series on the{" "}
          <Link href="/admin/teams" className="text-clay-bright underline-offset-2 hover:underline">
            Teams page
          </Link>{" "}
          first, then upload the points table here.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Points Table</h1>
        <p className="text-chalk-dim mt-1 max-w-[66ch] text-sm">
          {series.name}. CricClubs calculates the table (points, net run rate, tie-breaks); this site
          publishes it as uploaded. Upload a fresh export after each round of results.
        </p>
      </div>

      {params.published ? (
        <p role="status" className="border-gold/40 bg-dugout border p-4 text-sm">
          Published. The public{" "}
          <Link href="/league/points-table" className="text-clay-bright underline-offset-2 hover:underline">
            Points Table
          </Link>{" "}
          now shows this upload.
        </p>
      ) : null}

      <div className="border-line bg-dugout flex flex-col gap-1 border p-5 text-sm">
        <span className="font-data text-chalk-faint text-[0.62rem] tracking-[0.1em] uppercase">
          On the site now
        </span>
        {current ? (
          <>
            <span className="break-words">
              {current.fileName} · {current._count.rows} team{current._count.rows === 1 ? "" : "s"}
            </span>
            <span className="text-chalk-dim break-words">
              Published {formatMatchDay(current.uploadedAt)}, {formatMatchTime(current.uploadedAt)} by{" "}
              {current.uploadedBy.email}
            </span>
          </>
        ) : (
          <span className="text-chalk-dim">
            Nothing yet — the public page says the table isn&apos;t published.
          </span>
        )}
      </div>

      <UploadForm />
    </section>
  );
}
