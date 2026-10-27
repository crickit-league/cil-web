import type { FixtureStatus, MatchScore, ScheduleMatch } from "@/lib/services/schedule";
import { STAGE_LABEL } from "@/lib/import/schedule-plan";
import { formatCardStamp } from "@/lib/time";
import { FixtureFooter } from "./fixture-footer";

// "Scoreboard rows" fixture card (design A, chosen 2026-10-16): a header strip
// with date/time and status, one row per team with its score, the result and
// ground, and a dashed footer for umpiring (fixture-footer.tsx). On the fixtures list the footer's
// "Enter umpires →" expands the card in place (umpire-entry.tsx); the fixture
// page (/league/fixtures/[matchId]) reuses the card as its header.

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

/** "11.5" — legal balls in the usual overs.balls notation. */
function formatOvers(legalBalls: number) {
  const balls = legalBalls % 6;
  return balls === 0 ? String(legalBalls / 6) : `${(legalBalls - balls) / 6}.${balls}`;
}

function Icon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  // Tabler-style outline icons, inline so there's no icon dependency.
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

const TrophyIcon = () => (
  <Icon className="text-gold">
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 5M17 6h2.5a2.5 2.5 0 0 1-2.5 5" />
  </Icon>
);

const PinIcon = () => (
  <Icon className="text-chalk-faint">
    <circle cx="12" cy="11" r="3" />
    <path d="M17.66 16.66 13.41 20.9a2 2 0 0 1-2.83 0l-4.24-4.24a8 8 0 1 1 11.32 0z" />
  </Icon>
);

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

export function FixtureCard({
  m,
  highlight,
  entryOpen,
  standalone = false,
}: {
  m: ScheduleMatch;
  /** Team picked in the team filter; its name is underlined in gold. */
  highlight: string | null;
  /** Public umpire entry is open for the series. */
  entryOpen: boolean;
  /** The fixture page's header: a <div>, and no inline entry (the page has its own form). */
  standalone?: boolean;
}) {
  const completed = m.fixtureStatus === "COMPLETED";
  const winnerId = m.result?.kind === "win" ? m.result.winner.id : null;
  // The public form only takes umpires for matches still to be played
  // (enforced in saveUmpireNomination), so played ones get no entry.
  const canEnter = entryOpen && !completed && !standalone;
  const Tag = standalone ? "div" : "li";

  return (
    // h-full + the body's flex-1 + the footer's mt-auto: cards in a grid row match heights.
    <Tag className="bg-dugout border-line flex h-full scroll-mt-36 flex-col border">
      {/* Header strip */}
      <div className="border-line flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <span className="font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] whitespace-nowrap uppercase">
          {formatCardStamp(m.startsAt)}
        </span>
        <span className="flex items-center gap-2">
          {m.stage !== "LEAGUE" ? (
            <span className="font-data text-clay-bright text-[0.6rem] tracking-[0.12em] uppercase">
              {STAGE_LABEL[m.stage]}
            </span>
          ) : null}
          <StatusBadge status={m.fixtureStatus} />
        </span>
      </div>

      {/* Body: one scoreboard row per team */}
      <div className="flex flex-1 flex-col gap-3 px-4 py-3">
        <ul className="flex flex-col gap-1">
          {sides(m).map((side, i) => {
            const won = winnerId !== null && side.id === winnerId;
            const lost = winnerId !== null && !won;
            const highlighted = side.id !== null && side.id === highlight;
            return (
              <li
                key={side.id ?? `slot-${i}`}
                className={`-ml-4 flex items-baseline justify-between gap-3 border-l-[3px] pl-[13px] ${
                  won ? "border-gold" : "border-transparent"
                }`}
              >
                <span
                  className={`font-display flex min-w-0 items-center gap-1.5 text-xl leading-tight font-bold uppercase ${
                    won ? "text-gold" : lost ? "text-chalk-dim" : "text-chalk"
                  }`}
                >
                  <span
                    className={
                      highlighted ? "decoration-gold underline decoration-2 underline-offset-4" : undefined
                    }
                  >
                    {side.label}
                  </span>
                  {won ? (
                    <>
                      <TrophyIcon />
                      <span className="sr-only">(winner)</span>
                    </>
                  ) : null}
                </span>
                <span className="font-data shrink-0 text-right whitespace-nowrap">
                  {side.score ? (
                    <>
                      <span className={`text-lg ${lost ? "text-chalk-dim" : "text-chalk"}`}>
                        {side.score.runs}/{side.score.wickets}
                      </span>{" "}
                      <span className="text-chalk-faint text-xs">({formatOvers(side.score.legalBalls)})</span>
                    </>
                  ) : completed ? null : (
                    <span className="text-chalk-faint text-lg">—</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        {m.result ? (
          <p className={`text-sm ${m.result.kind === "win" ? "text-gold font-semibold" : "text-chalk-dim"}`}>
            {m.result.kind === "win" ? `${m.result.winner.name} ${m.result.text}` : m.result.text}
          </p>
        ) : null}
        <p className="text-chalk-dim flex items-center gap-1.5 text-sm">
          <PinIcon />
          {m.ground ?? "Ground to be confirmed"}
        </p>
      </div>

      <FixtureFooter
        matchId={m.id}
        completed={completed}
        umpiringTeam={m.umpiringTeam?.name ?? null}
        umpiringHighlighted={Boolean(m.umpiringTeam && m.umpiringTeam.id === highlight)}
        umpires={m.umpires}
        canEnter={canEnter}
      />
    </Tag>
  );
}
