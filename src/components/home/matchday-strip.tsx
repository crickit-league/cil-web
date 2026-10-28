import Link from "next/link";
import type { ScheduleMatch } from "@/lib/services/schedule";
import { formatMatchdaySpan } from "@/lib/matchday";
import { formatCardStampOrTbd } from "@/lib/time";
import { teamLabel } from "@/app/(public)/league/fixtures/fixture-card";

// A sideways-scrolling strip of compact score (or fixture) cards. On the home
// page it overlaps the bottom edge of the photo carousel, so photos and the
// weekend's scores share the first screen. Each card opens the fixture page.

function StripCard({ m }: { m: ScheduleMatch }) {
  const winnerId = m.result?.kind === "win" ? m.result.winner.id : null;
  const rows = [
    { id: m.teamOne?.id ?? null, label: teamLabel(m.teamOne, m.teamOneSource) },
    { id: m.teamTwo?.id ?? null, label: teamLabel(m.teamTwo, m.teamTwoSource) },
  ].map((side) => ({ ...side, score: m.scores.find((s) => s.team.id === side.id) ?? null }));

  return (
    <li className="w-[13.5rem] shrink-0 snap-start sm:w-60">
      <Link
        href={`/league/fixtures/${m.id}`}
        className="bg-dugout border-line hover:border-clay-bright flex h-full flex-col gap-1 rounded-xl border px-3.5 py-3 shadow-[0_14px_30px_rgb(0_0_0/0.45)] transition-colors"
      >
        <span className="font-data text-chalk-faint text-[0.62rem] tracking-[0.1em] uppercase">
          {formatCardStampOrTbd(m)}
        </span>
        {rows.map((row, i) => {
          const won = winnerId !== null && row.id === winnerId;
          const lost = winnerId !== null && !won;
          return (
            <span key={row.id ?? `slot-${i}`} className="flex items-baseline justify-between gap-2 text-sm">
              <span
                className={`min-w-0 truncate ${won ? "text-gold font-semibold" : lost ? "text-chalk-dim" : "text-chalk"}`}
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
        <span className="text-chalk-dim mt-auto truncate pt-1 text-xs">
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

export function MatchdayStrip({
  matches,
  kind,
  overlap,
}: {
  matches: ScheduleMatch[];
  kind: "results" | "upcoming";
  /** Pull the strip up over the carousel above it. */
  overlap: boolean;
}) {
  if (matches.length === 0) return null;
  const span = formatMatchdaySpan(matches);

  return (
    <div className={`relative z-10 ${overlap ? "-mt-20 sm:-mt-24" : "pt-10"}`}>
      <ul
        aria-label={kind === "results" ? "Last weekend's scores" : "This weekend's fixtures"}
        className="mx-auto flex max-w-[1180px] snap-x snap-proximity [scrollbar-width:none] gap-3 overflow-x-auto px-5 pb-2 sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        <li className="bg-clay text-pitch-deep flex w-36 shrink-0 snap-start flex-col justify-center gap-1 rounded-xl px-3.5 py-3">
          <span className="font-display text-2xl leading-none font-extrabold uppercase">
            {kind === "results" ? "Last weekend" : "This weekend"}
          </span>
          {span ? <span className="font-data text-[0.68rem] tracking-[0.08em] uppercase">{span}</span> : null}
        </li>
        {matches.map((m) => (
          <StripCard key={m.id} m={m} />
        ))}
      </ul>
    </div>
  );
}
