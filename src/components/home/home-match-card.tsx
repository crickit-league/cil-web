import Link from "next/link";
import type { MatchScore, ScheduleMatch } from "@/lib/services/schedule";
import { STAGE_LABEL } from "@/lib/import/schedule-plan";
import { formatMatchTimeOrTbd } from "@/lib/time";
import { teamLabel } from "@/app/(public)/league/fixtures/fixture-card";

// The home page's compact match card: scores and the result for a played
// match, time and ground for one to come. No umpire details. Those, and
// umpire entry, are on the fixture's own page, which the whole card opens.

/** "11.5" — legal balls in the usual overs.balls notation. */
function formatOvers(legalBalls: number) {
  const balls = legalBalls % 6;
  return balls === 0 ? String(legalBalls / 6) : `${(legalBalls - balls) / 6}.${balls}`;
}

type Side = { id: string | null; label: string; score: MatchScore | null };

/** Batting order once scores are in, the listed order before. */
function sides(m: ScheduleMatch): Side[] {
  const listed: Side[] = [
    { id: m.teamOne?.id ?? null, label: teamLabel(m.teamOne, m.teamOneSource), score: null },
    { id: m.teamTwo?.id ?? null, label: teamLabel(m.teamTwo, m.teamTwoSource), score: null },
  ];
  for (const side of listed) side.score = m.scores.find((s) => s.team.id === side.id) ?? null;
  if (m.scores.length > 0 && m.scores[0].team.id === listed[1].id) listed.reverse();
  return listed;
}

const cardClass =
  "bg-dugout border-line hover:border-clay-bright flex h-full rounded-xl border px-4 py-3.5 transition-colors";
const metaClass = "font-data text-chalk-faint text-[0.66rem] tracking-[0.08em] uppercase";

function ResultCard({ m }: { m: ScheduleMatch }) {
  const winnerId = m.result?.kind === "win" ? m.result.winner.id : null;
  return (
    <Link href={`/league/fixtures/${m.id}`} className={`${cardClass} flex-col gap-2`}>
      <span className={`${metaClass} flex flex-wrap gap-x-3`}>
        <span>{formatMatchTimeOrTbd(m)}</span>
        {m.ground ? <span>{m.ground}</span> : null}
        {m.stage !== "LEAGUE" ? <span className="text-clay-bright">{STAGE_LABEL[m.stage]}</span> : null}
      </span>
      <ul className="flex flex-col gap-0.5">
        {sides(m).map((side, i) => {
          const won = winnerId !== null && side.id === winnerId;
          const lost = winnerId !== null && !won;
          return (
            <li key={side.id ?? `slot-${i}`} className="flex items-baseline justify-between gap-3">
              <span
                className={`min-w-0 truncate ${won ? "text-chalk font-bold" : lost ? "text-chalk-dim" : "text-chalk"}`}
              >
                {side.label}
              </span>
              {side.score ? (
                <span className="font-data shrink-0 whitespace-nowrap">
                  <span className={lost ? "text-chalk-dim" : "text-chalk"}>
                    {side.score.runs}/{side.score.wickets}
                  </span>{" "}
                  <span className="text-chalk-faint text-xs">({formatOvers(side.score.legalBalls)})</span>
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {m.result ? (
        <p
          className={`border-line mt-auto border-t pt-2 text-sm ${m.result.kind === "win" ? "text-gold" : "text-chalk-dim"}`}
        >
          {m.result.kind === "win" ? `${m.result.winner.name} ${m.result.text}` : m.result.text}
        </p>
      ) : null}
    </Link>
  );
}

function FixtureCard({ m }: { m: ScheduleMatch }) {
  // "9:00 AM" → big "9:00" over a small "AM"; "Time TBD" / "Date TBD" stay whole.
  const when = formatMatchTimeOrTbd(m);
  const [time, meridiem] = /^\d/.test(when) ? when.split(" ") : [when, null];
  const [one, two] = sides(m);
  return (
    <Link href={`/league/fixtures/${m.id}`} className={`${cardClass} items-center gap-4`}>
      <span className="border-line flex w-16 shrink-0 flex-col items-center border-r pr-4 text-center">
        <span className="font-display text-2xl leading-none font-extrabold">{time}</span>
        {meridiem ? <span className="font-data text-chalk-faint mt-1 text-[0.62rem]">{meridiem}</span> : null}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-semibold">{one.label}</span>
        <span className="font-data text-chalk-faint text-[0.62rem]">VS</span>
        <span className="truncate font-semibold">{two.label}</span>
        <span className="text-chalk-dim mt-1 truncate text-sm">
          {m.stage !== "LEAGUE" ? `${STAGE_LABEL[m.stage]} · ` : ""}
          {m.ground ?? "Ground to be confirmed"}
        </span>
      </span>
    </Link>
  );
}

export function HomeMatchCard({ m }: { m: ScheduleMatch }) {
  return m.fixtureStatus === "COMPLETED" ? <ResultCard m={m} /> : <FixtureCard m={m} />;
}
