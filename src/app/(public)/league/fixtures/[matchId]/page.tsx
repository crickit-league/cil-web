import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicFixture } from "@/lib/services/schedule";
import { STAGE_LABEL } from "@/lib/import/schedule-plan";
import { formatMatchDay, formatMatchTime } from "@/lib/time";
import { RevealPhonesButton } from "@/components/umpires/reveal-phones-button";
import { UmpireForm } from "@/components/umpires/umpire-form";
import { teamLabel, UmpireNames } from "../fixture-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fixture umpires · CIL Winter League",
  // Edit pages for every fixture add nothing to search results.
  robots: { index: false },
};

export default async function FixturePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const fixture = await getPublicFixture(matchId);
  if (!fixture) notFound();
  const { match: m, series, canEditUmpires } = fixture;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/league/fixtures"
        className="font-data text-chalk-dim hover:text-chalk self-start text-xs tracking-[0.08em] uppercase"
      >
        ← All fixtures
      </Link>

      <div className="border-line bg-dugout flex flex-col gap-4 border p-5">
        <div className="font-data text-chalk-dim text-[0.72rem] tracking-[0.06em] uppercase">
          {formatMatchDay(m.startsAt)} · {formatMatchTime(m.startsAt)}
          {m.stage !== "LEAGUE" ? ` · ${STAGE_LABEL[m.stage]}` : ""}
        </div>
        <h2 className="font-display text-2xl leading-tight font-extrabold uppercase">
          {teamLabel(m.teamOne, m.teamOneSource)} <span className="text-chalk-faint font-normal">v</span>{" "}
          {teamLabel(m.teamTwo, m.teamTwoSource)}
        </h2>
        <div className="text-chalk-dim text-sm">{m.ground ?? "Ground to be confirmed"}</div>
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <span className="font-data text-chalk-faint block text-[0.62rem] tracking-[0.1em] uppercase">
              Umpiring team
            </span>
            {m.umpiringTeam?.name ?? "To be assigned"}
          </div>
          <div>
            <span className="font-data text-chalk-faint block text-[0.62rem] tracking-[0.1em] uppercase">
              Umpires
            </span>
            <UmpireNames m={m} />
          </div>
        </div>
        {m.umpires.hasPhones ? <RevealPhonesButton matchId={m.id} /> : null}
      </div>

      {canEditUmpires ? (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-wide uppercase">Enter umpires</h2>
            <p className="text-chalk-dim mt-1 text-sm">
              For {m.umpiringTeam ? `${m.umpiringTeam.name}, the umpiring team` : "the umpiring team"}: name
              two umpires — the second is the backup — with a phone number for each.
            </p>
          </div>
          <UmpireForm matchId={m.id} umpireOneName={m.umpires.one} umpireTwoName={m.umpires.two} />
        </section>
      ) : (
        <p role="status" className="border-gold/40 bg-dugout border p-4 text-sm">
          {series.umpireEntryLocked
            ? "Umpire entry is closed. Contact the committee if this fixture's umpires need to change."
            : "This match has been played, so its umpires can't be changed here."}
        </p>
      )}
    </div>
  );
}
