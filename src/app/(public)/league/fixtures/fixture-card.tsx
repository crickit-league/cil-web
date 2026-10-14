import Link from "next/link";
import type { ScheduleMatch } from "@/lib/services/schedule";
import { STAGE_LABEL } from "@/lib/import/schedule-plan";
import { formatMatchTime } from "@/lib/time";
import { RevealPhonesButton } from "@/components/umpires/reveal-phones-button";

const smallLabel = "font-data text-chalk-faint block text-[0.62rem] tracking-[0.1em] uppercase";

export function teamLabel(team: { name: string } | null, source: string | null) {
  return team?.name ?? (source ? `TBD (${source})` : "TBD");
}

/** Umpire 1 / backup names, or a prompt to fill them in. */
export function UmpireNames({ m }: { m: ScheduleMatch }) {
  if (!m.umpires.one && !m.umpires.two) {
    return <span className="text-chalk-faint">Not nominated yet</span>;
  }
  return (
    <span className="flex flex-col">
      {m.umpires.one ? <span>{m.umpires.one}</span> : null}
      {m.umpires.two ? <span className="text-chalk-dim">{m.umpires.two} (backup)</span> : null}
    </span>
  );
}

export function FixtureCard({
  m,
  highlight,
  entryOpen,
}: {
  m: ScheduleMatch;
  highlight: string | null;
  entryOpen: boolean;
}) {
  const name = (team: { id: string; name: string } | null, source: string | null) => {
    const text = teamLabel(team, source);
    return team && team.id === highlight ? <strong className="text-gold font-semibold">{text}</strong> : text;
  };
  const umpiringHighlighted = m.umpiringTeam && m.umpiringTeam.id === highlight;
  const nominated = Boolean(m.umpires.one || m.umpires.two);

  return (
    <li className="border-line bg-dugout grid grid-cols-1 gap-3 border p-4 sm:grid-cols-[6rem_1fr_16rem] sm:gap-6 sm:px-5">
      <div className="font-data text-chalk-dim flex gap-3 text-[0.72rem] tracking-[0.06em] uppercase sm:flex-col sm:gap-0.5">
        <span className="text-chalk">{formatMatchTime(m.startsAt)}</span>
        {m.stage !== "LEAGUE" ? <span className="text-clay-bright">{STAGE_LABEL[m.stage]}</span> : null}
      </div>

      <div className="min-w-0">
        <div className="font-display text-lg leading-tight font-bold uppercase">
          {name(m.teamOne, m.teamOneSource)} <span className="text-chalk-faint font-normal">v</span>{" "}
          {name(m.teamTwo, m.teamTwoSource)}
        </div>
        <div className="text-chalk-dim mt-1 text-sm">{m.ground ?? "Ground to be confirmed"}</div>
      </div>

      <div className="border-line flex flex-col gap-3 border-t pt-3 text-sm sm:border-0 sm:pt-0">
        <div>
          <span className={smallLabel}>Umpiring team</span>
          <span className={umpiringHighlighted ? "text-gold font-semibold" : "text-chalk"}>
            {m.umpiringTeam?.name ?? "To be assigned"}
          </span>
        </div>
        <div>
          <span className={smallLabel}>Umpires</span>
          <UmpireNames m={m} />
        </div>
        {m.umpires.hasPhones ? <RevealPhonesButton matchId={m.id} /> : null}
        {entryOpen ? (
          <Link
            href={`/league/fixtures/${m.id}`}
            className="font-data text-clay-bright self-start text-[0.68rem] tracking-[0.08em] uppercase underline-offset-2 hover:underline"
          >
            {nominated ? "Change umpires →" : "Enter umpires →"}
          </Link>
        ) : null}
      </div>
    </li>
  );
}
