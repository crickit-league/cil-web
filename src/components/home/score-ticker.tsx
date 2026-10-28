import Link from "next/link";
import type { ScheduleMatch } from "@/lib/services/schedule";
import { formatCardStampOrTbd } from "@/lib/time";
import { teamLabel } from "@/lib/team-label";
import { TeamBadge } from "@/components/team-badge";

// The scoreboard strip under the header, like the live-score bars on the big T20
// league sites: a sideways-scrolling row of compact cards, results or fixtures.
// Each card opens the fixture page.

function TickerCard({ m }: { m: ScheduleMatch }) {
  const winnerId = m.result?.kind === "win" ? m.result.winner.id : null;
  const rows = [
    { id: m.teamOne?.id ?? null, label: teamLabel(m.teamOne, m.teamOneSource) },
    { id: m.teamTwo?.id ?? null, label: teamLabel(m.teamTwo, m.teamTwoSource) },
  ].map((side) => ({ ...side, score: m.scores.find((s) => s.team.id === side.id) ?? null }));
  const played = m.fixtureStatus === "COMPLETED";

  return (
    <li className="w-[15rem] shrink-0 snap-start sm:w-[17rem]">
      <Link
        href={`/league/fixtures/${m.id}`}
        className="border-line bg-dugout hover:border-clay flex h-full flex-col gap-1.5 border-l-2 px-3.5 py-2.5 transition-colors"
      >
        <span className="font-data text-chalk-faint flex items-center justify-between gap-2 text-[0.62rem] tracking-[0.1em] uppercase">
          <span className="truncate">{formatCardStampOrTbd(m)}</span>
          <span className={played ? "text-gold" : "text-clay-bright"}>{played ? "Result" : "Upcoming"}</span>
        </span>
        {rows.map((row, i) => {
          const won = winnerId !== null && row.id === winnerId;
          const lost = winnerId !== null && !won;
          return (
            <span key={row.id ?? `slot-${i}`} className="flex items-center gap-2 text-sm">
              <TeamBadge name={row.label} size={22} />
              <span
                className={`min-w-0 flex-1 truncate ${won ? "text-chalk font-bold" : lost ? "text-chalk-dim" : "text-chalk"}`}
              >
                {row.label}
              </span>
              {row.score ? (
                <span className={`font-data shrink-0 ${lost ? "text-chalk-dim" : "text-chalk"}`}>
                  {row.score.runs}/{row.score.wickets}
                </span>
              ) : null}
            </span>
          );
        })}
        <span className="text-chalk-dim truncate text-xs">
          {m.result
            ? m.result.kind === "win"
              ? `${m.result.winner.name} ${m.result.text}`
              : m.result.text
            : (m.ground ?? "Ground to be confirmed")}
        </span>
      </Link>
    </li>
  );
}

export function ScoreTicker({ matches, kind }: { matches: ScheduleMatch[]; kind: "results" | "upcoming" }) {
  if (matches.length === 0) return null;

  return (
    <div className="border-line bg-dugout border-b">
      <div className="mx-auto flex max-w-[1180px] items-stretch">
        <span className="bg-clay text-on-accent font-display z-10 flex shrink-0 items-center px-4 text-lg leading-none font-extrabold tracking-wide uppercase sm:px-6">
          {kind === "results" ? "Scores" : "Fixtures"}
        </span>
        <ul
          aria-label={kind === "results" ? "Last weekend's scores" : "This weekend's fixtures"}
          className="divide-line flex min-w-0 snap-x snap-proximity [scrollbar-width:none] divide-x overflow-x-auto [&::-webkit-scrollbar]:hidden"
        >
          {matches.map((m) => (
            <TickerCard key={m.id} m={m} />
          ))}
        </ul>
      </div>
    </div>
  );
}
