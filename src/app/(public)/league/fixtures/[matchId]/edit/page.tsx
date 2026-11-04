import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { getMatchEditView } from "@/lib/services/match-edit";
import { leagueDateTimeInputs } from "@/lib/time";
import { teamLabel } from "@/lib/team-label";
import { formatCardStampOrTbd } from "@/lib/time";
import { MatchDetailsForm } from "./match-details-form";
import { MatchPhotos } from "./match-photos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit match",
  robots: { index: false },
};

const sectionTitle = "font-display text-xl font-extrabold tracking-wide uppercase";

export default async function EditMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const session = await auth();
  // Everyone else gets the fixtures list; the service checks the role again.
  if (!session?.user || !can(session.user, "manage-league")) redirect("/league/fixtures");

  const view = await getMatchEditView(session.user, matchId);
  if (!view) notFound();
  const { match: m, options, photos, canManagePhotos } = view;

  const when = m.startsAt ? leagueDateTimeInputs(m.startsAt) : { date: "", time: "" };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/league/fixtures"
        className="font-data text-chalk-dim hover:text-chalk self-start text-xs tracking-[0.08em] uppercase"
      >
        ← All fixtures
      </Link>

      {/* One compact line instead of the full fixture card. */}
      <p className="border-line bg-dugout flex flex-wrap items-baseline gap-x-4 gap-y-1 border px-4 py-3">
        <span className="font-display text-xl leading-tight font-bold uppercase">
          {teamLabel(m.teamOne, m.teamOneSource)} <span className="text-chalk-faint">v</span>{" "}
          {teamLabel(m.teamTwo, m.teamTwoSource)}
        </span>
        <span className="font-data text-chalk-dim text-[0.7rem] tracking-[0.1em] whitespace-nowrap uppercase">
          {formatCardStampOrTbd(m)}
        </span>
        {m.ground ? <span className="text-chalk-dim text-sm">{m.ground}</span> : null}
        {m.fixtureStatus === "COMPLETED" ? (
          <Link
            href={`/league/fixtures/${m.id}`}
            className="font-data text-clay-bright ml-auto text-[0.68rem] tracking-[0.08em] uppercase hover:underline"
          >
            View fixture
          </Link>
        ) : null}
      </p>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Match details</h2>
        <MatchDetailsForm
          matchId={m.id}
          options={options}
          initial={{
            date: when.date,
            time: m.timeTbd ? "" : when.time,
            fieldId: m.fieldId,
            umpiringTeamId: m.umpiringTeam?.id ?? null,
            playingTeamIds: [m.teamOne?.id, m.teamTwo?.id].filter((id): id is string => Boolean(id)),
          }}
        />
      </section>

      {canManagePhotos ? (
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitle}>Pictures</h2>
          <MatchPhotos
            matchId={m.id}
            photos={photos.map((p) => ({
              id: p.id,
              url: p.url,
              caption: p.caption,
              title: p.title,
              inCarousel: p.inCarousel,
              width: p.width,
              height: p.height,
            }))}
          />
        </section>
      ) : null}
    </div>
  );
}
