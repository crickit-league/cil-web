import Link from "next/link";
import { Settings } from "lucide-react";
import type { MatchScore, ScheduleMatch } from "@/lib/services/schedule";
import { teamLabel } from "@/lib/team-label";
import { TeamBadge } from "@/components/team-badge";
import { STAGE_LABEL } from "@/lib/import/schedule-plan";
import { formatCardStampOrTbd } from "@/lib/time";
import { FixtureFooter } from "./fixture-footer";

// "Scoreboard rows" fixture card (design A, chosen 2026-10-16): a header strip
// with date/time and status, one row per team with its score, the result and
// ground, and a dashed footer for umpiring (fixture-footer.tsx). The fixture page
// (/league/fixtures/[matchId]) reuses the card as its header; admins get a gear
// icon on it that opens the edit-match page, where umpires are assigned. In lists
// the whole card opens the fixture page (a stretched link on the date).

export { teamLabel } from "@/lib/team-label";

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
  <Icon className="text-clay">
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 5M17 6h2.5a2.5 2.5 0 0 1-2.5 5" />
  </Icon>
);

const PinIcon = () => (
  <Icon className="text-clay">
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

/** The date and time as a vertical block: weekday, big day number, month, then the time in the accent color. */
function Stamp({ stamp }: { stamp: string }) {
  const [day, time] = stamp.split(" · ");
  const [weekday, dayNumber, month] = day.split(" ");
  return (
    <span className="font-display flex flex-col items-center gap-1 text-center leading-none font-extrabold uppercase">
      {dayNumber ? (
        <>
          <span className="font-data text-chalk-dim text-xs tracking-[0.12em]">{weekday}</span>
          <span className="text-chalk text-5xl">{dayNumber}</span>
          <span className="text-chalk text-lg tracking-wide">{month}</span>
        </>
      ) : (
        <span className="text-chalk text-xl tracking-wide">{day}</span>
      )}
      {time ? <span className="text-clay mt-1 text-lg tracking-wide whitespace-nowrap">{time}</span> : null}
    </span>
  );
}

function Ground({ m }: { m: ScheduleMatch }) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-semibold">
      <PinIcon />
      {m.ground && m.fieldId ? (
        <Link
          href={`/grounds/field/${m.fieldId}`}
          className="text-chalk hover:text-clay relative z-10 underline-offset-2 transition-colors hover:underline"
        >
          {m.ground}
        </Link>
      ) : (
        <span className={m.ground ? "text-chalk" : "text-chalk-faint"}>
          {m.ground ?? "Ground to be confirmed"}
        </span>
      )}
    </p>
  );
}

function Status({ completed }: { completed: boolean }) {
  return (
    <span
      className={`font-data text-[0.68rem] tracking-[0.1em] uppercase ${completed ? "text-gold" : "text-chalk-dim"}`}
    >
      {completed ? "Completed" : "Scheduled"}
    </span>
  );
}

function EditLink({ matchId }: { matchId: string }) {
  return (
    <Link
      href={`/league/fixtures/${matchId}/edit`}
      aria-label="Edit match"
      title="Edit match (admin)"
      className="text-chalk-faint hover:text-clay-bright relative z-10 -my-1 flex h-7 w-7 items-center justify-center rounded transition-colors"
    >
      <Settings className="size-4" aria-hidden="true" />
    </Link>
  );
}

function Umpiring({
  m,
  completed,
  highlight,
}: {
  m: ScheduleMatch;
  completed: boolean;
  highlight: string | null;
}) {
  return (
    <p className="min-w-0 text-sm">
      <span aria-hidden="true" className="font-data text-chalk-faint mr-2 text-xs tracking-[0.1em]">
        U:
      </span>
      <span className="sr-only">Umpiring: </span>
      <span
        className={
          m.umpiringTeam && m.umpiringTeam.id === highlight ? "text-clay font-semibold" : "text-chalk"
        }
      >
        {m.umpiringTeam?.name ?? (
          <span className="text-chalk-faint">{completed ? "—" : "To be assigned"}</span>
        )}
      </span>
    </p>
  );
}

const stageClass = "font-data text-clay-bright text-[0.68rem] tracking-[0.12em] uppercase";

// Phones: a vertical card (header with date, time and ground; the teams; a U:/stage line; the result).
// md and up: one wide row per match, in three columns: the date block, the teams, and a details column
// (status, ground, U:, stage), with the result and umpire names running full width underneath.
export function FixtureCard({
  m,
  highlight,
  canEdit = false,
  standalone = false,
  showUmpires = true,
}: {
  m: ScheduleMatch;
  /** Team picked in the team filter; its name is underlined in the theme color. */
  highlight: string | null;
  /** Admins only: shows the gear icon that opens the edit-match page. */
  canEdit?: boolean;
  /** The match page's header: a <div>, and no link to itself. */
  standalone?: boolean;
  /** False on the home page, which shows no umpire details (by request). */
  showUmpires?: boolean;
}) {
  const completed = m.fixtureStatus === "COMPLETED";
  const winnerId = m.result?.kind === "win" ? m.result.winner.id : null;
  const Tag = standalone ? "div" : "li";
  const linked = completed && !standalone;
  const stamp = formatCardStampOrTbd(m);
  const showMetaRow = showUmpires || m.stage !== "LEAGUE";
  // Played matches only: a stretched link, its ::after covers the whole card, so the card opens the
  // match page. The ground link and the gear sit above it (relative z-10).
  const stretched = "after:absolute after:inset-0 after:content-['']";

  return (
    <Tag
      className={`bg-dugout border-line relative flex h-full scroll-mt-36 flex-col overflow-hidden rounded-[14px] border md:grid md:grid-cols-[8.5rem_minmax(0,1fr)_17rem] ${
        linked ? "hover:border-clay transition-colors" : ""
      }`}
    >
      {/* md+: the date block on the left. */}
      <div className="border-line bg-pitch-deep hidden items-center justify-center border-r px-3 py-4 md:flex">
        {linked ? (
          <Link href={`/league/fixtures/${m.id}`} className={stretched}>
            <Stamp stamp={stamp} />
            <span className="sr-only"> — match details</span>
          </Link>
        ) : (
          <Stamp stamp={stamp} />
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 pt-3.5 pb-3 md:justify-center md:px-6 md:py-4">
        {/* Phones: the header, with the date and time as the headline. */}
        <div className="flex items-start justify-between gap-3 md:hidden">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-display text-clay text-xl leading-tight font-extrabold tracking-wide uppercase">
              {linked ? (
                <Link href={`/league/fixtures/${m.id}`} className={stretched}>
                  {stamp}
                  <span className="sr-only"> — match details</span>
                </Link>
              ) : (
                stamp
              )}
            </span>
            <Ground m={m} />
          </div>
          <span className="flex shrink-0 items-center gap-1">
            <Status completed={completed} />
            {canEdit ? <EditLink matchId={m.id} /> : null}
          </span>
        </div>

        {/* One row per team: badge, name, score. */}
        <ul className="flex flex-col gap-2.5 md:gap-3">
          {sides(m).map((side, i) => {
            const won = winnerId !== null && side.id === winnerId;
            const lost = winnerId !== null && !won;
            const highlighted = side.id !== null && side.id === highlight;
            return (
              <li key={side.id ?? `slot-${i}`} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0">
                    <TeamBadge name={side.label} size={36} />
                  </span>
                  <span
                    className={`font-display min-w-0 text-lg leading-tight font-extrabold tracking-wide break-words uppercase md:text-xl ${
                      won ? "text-clay" : lost ? "text-chalk-dim" : "text-chalk"
                    } ${highlighted ? "decoration-clay underline decoration-2 underline-offset-4" : ""}`}
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
                {side.score ? (
                  <span className="font-data shrink-0 text-right whitespace-nowrap">
                    <span
                      className={`font-display text-xl font-bold md:text-2xl ${lost ? "text-chalk-dim" : "text-chalk"}`}
                    >
                      {side.score.runs}/{side.score.wickets}
                    </span>
                    <span className="text-chalk-faint ml-1 text-xs">
                      {formatOvers(side.score.legalBalls)}
                    </span>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>

        {/* Phones: the umpiring team ("U:") on the left, the stage on the right. */}
        {showMetaRow ? (
          <div className="flex items-center justify-between gap-3 md:hidden">
            {showUmpires ? <Umpiring m={m} completed={completed} highlight={highlight} /> : null}
            {m.stage !== "LEAGUE" ? (
              <span className={`${stageClass} ml-auto`}>{STAGE_LABEL[m.stage]}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* md+: the details column on the right. */}
      <div className="border-line hidden flex-col justify-center gap-2.5 border-l px-5 py-4 md:flex">
        <div className="flex items-center justify-between gap-2">
          <Status completed={completed} />
          {canEdit ? <EditLink matchId={m.id} /> : null}
        </div>
        <Ground m={m} />
        {showUmpires ? <Umpiring m={m} completed={completed} highlight={highlight} /> : null}
        {m.stage !== "LEAGUE" ? <span className={stageClass}>{STAGE_LABEL[m.stage]}</span> : null}
      </div>

      {/* The result is the last line of the card. */}
      {m.result ? (
        <p
          className={`border-line border-t px-4 py-2.5 text-sm md:col-span-3 md:px-6 ${
            m.result.kind === "win" ? "text-clay font-semibold" : "text-chalk-dim"
          }`}
        >
          {m.result.kind === "win" ? `${m.result.winner.name} ${m.result.text}` : m.result.text}
        </p>
      ) : null}

      {showUmpires && (m.umpires.one || m.umpires.two) ? (
        <div className="md:col-span-3">
          <FixtureFooter matchId={m.id} completed={completed} umpires={m.umpires} />
        </div>
      ) : null}
    </Tag>
  );
}
