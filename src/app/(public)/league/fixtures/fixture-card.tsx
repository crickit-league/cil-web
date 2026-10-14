import Link from "next/link";
import type { FixtureStatus, MatchResult, MatchScore, ScheduleMatch } from "@/lib/services/schedule";
import { STAGE_LABEL } from "@/lib/import/schedule-plan";
import { formatMatchTime } from "@/lib/time";
import { RevealPhonesButton } from "@/components/umpires/reveal-phones-button";

const smallLabel = "font-data text-chalk-faint block text-[0.62rem] tracking-[0.1em] uppercase";

export function teamLabel(team: { name: string } | null, source: string | null) {
  return team?.name ?? (source ? `TBD (${source})` : "TBD");
}

export function StatusBadge({ status }: { status: FixtureStatus }) {
  return (
    <span
      className={`font-data inline-flex items-center border px-2 py-0.5 text-[0.6rem] tracking-[0.12em] whitespace-nowrap uppercase ${
        status === "COMPLETED" ? "border-gold/50 bg-gold/10 text-gold" : "border-line text-chalk-dim"
      }`}
    >
      {status === "COMPLETED" ? "Completed" : "Scheduled"}
    </span>
  );
}

/** "Sharks won by 5 wickets" with the winner emphasised, or a one-line outcome. */
export function ResultLine({ result, className = "" }: { result: MatchResult; className?: string }) {
  if (!result) return null;
  return (
    <p className={`text-sm ${className}`}>
      {result.kind === "win" ? (
        <>
          <strong className="text-gold font-semibold">{result.winner.name}</strong>{" "}
          <span className="text-chalk">{result.text}</span>
        </>
      ) : (
        <span className="text-chalk">{result.text}</span>
      )}
    </p>
  );
}

/** "11.5" — legal balls in the usual overs.balls notation. */
function formatOvers(legalBalls: number) {
  const balls = legalBalls % 6;
  return balls === 0 ? String(legalBalls / 6) : `${(legalBalls - balls) / 6}.${balls}`;
}

/**
 * Both sides' totals in batting order: "Sharks 112/6 (15) · Hawks 98/9 (15)".
 * On phones each side gets its own line; from `sm` up they share one.
 */
export function ScoreLine({ scores, className = "" }: { scores: MatchScore[]; className?: string }) {
  if (scores.length === 0) return null;
  return (
    <p
      className={`font-data text-chalk-dim flex flex-col text-xs sm:flex-row sm:flex-wrap sm:gap-x-2 ${className}`}
    >
      {scores.map((s, i) => (
        <span key={s.team.id}>
          {i > 0 ? <span className="text-chalk-faint mr-2 hidden sm:inline">·</span> : null}
          {s.team.name}{" "}
          <span className="text-chalk whitespace-nowrap">
            {s.runs}/{s.wickets} ({formatOvers(s.legalBalls)})
          </span>
        </span>
      ))}
    </p>
  );
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
  const winnerId = m.result?.kind === "win" ? m.result.winner.id : null;
  const name = (team: { id: string; name: string } | null, source: string | null) => {
    const text = teamLabel(team, source);
    if (team && team.id === highlight) return <strong className="text-gold font-semibold">{text}</strong>;
    // On a decided match the losing side is dimmed so the winner stands out.
    if (winnerId && team && team.id !== winnerId) return <span className="text-chalk-dim">{text}</span>;
    return text;
  };
  const umpiringHighlighted = m.umpiringTeam && m.umpiringTeam.id === highlight;
  const nominated = Boolean(m.umpires.one || m.umpires.two);
  const completed = m.fixtureStatus === "COMPLETED";

  return (
    <li
      className={`bg-dugout grid grid-cols-1 gap-3 border p-4 sm:grid-cols-[6rem_1fr_16rem] sm:gap-6 sm:px-5 ${
        completed ? "border-line border-l-gold/70 border-l-4" : "border-line"
      }`}
    >
      <div className="font-data text-chalk-dim flex flex-wrap items-center gap-3 text-[0.72rem] tracking-[0.06em] uppercase sm:flex-col sm:items-start sm:gap-1.5">
        <span className="text-chalk">{formatMatchTime(m.startsAt)}</span>
        {m.stage !== "LEAGUE" ? <span className="text-clay-bright">{STAGE_LABEL[m.stage]}</span> : null}
        <StatusBadge status={m.fixtureStatus} />
      </div>

      <div className="min-w-0">
        <div className="font-display text-lg leading-tight font-bold uppercase">
          {name(m.teamOne, m.teamOneSource)} <span className="text-chalk-faint font-normal">v</span>{" "}
          {name(m.teamTwo, m.teamTwoSource)}
        </div>
        <ResultLine result={m.result} className="mt-1.5" />
        <ScoreLine scores={m.scores} className="mt-1" />
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
        {m.umpires.hasPhones && !completed ? <RevealPhonesButton matchId={m.id} /> : null}
        {/* The public form only takes umpires for matches still to be played
            (enforced in saveUmpireNomination), so played ones get no link. */}
        {entryOpen && !completed ? (
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
