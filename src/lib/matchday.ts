import type { FixtureStatus } from "@/lib/services/schedule";
import { LEAGUE_TIME_ZONE, matchDayKey, type MatchWhen } from "@/lib/time";

// The home page's "matchday": last weekend's results and this weekend's
// fixtures, picked out of the full fixture list. Pure, so it's tested on its own.

/** A match weekend is at most this many days from its first match day (Sat–Sun, or a Fri–Mon long weekend). */
const WEEKEND_SPAN_DAYS = 3;

type MatchdayMatch = MatchWhen & { fixtureStatus: FixtureStatus };

export type Matchday<T> = {
  /** Completed matches from the most recent weekend with any. */
  results: T[];
  /** Scheduled matches from the next weekend that has any, today included. */
  upcoming: T[];
  /** Which list the page opens on. */
  lead: "results" | "upcoming";
};

/** "2026-10-24" + 3 → "2026-10-27". Day keys are calendar dates, so plain UTC arithmetic is safe. */
function addDays(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Splits fixture-ordered matches (compareMatchWhen) into last weekend's
 * results and this weekend's fixtures, keeping that order. Monday to
 * Wednesday the page leads with results (scores are finalised by Monday);
 * from Thursday it leads with what's coming up.
 */
export function pickMatchday<T extends MatchdayMatch>(matches: T[], now: Date): Matchday<T> {
  const today = matchDayKey(now);
  const dated = matches.flatMap((m) => (m.startsAt ? [{ m, day: matchDayKey(m.startsAt) }] : []));

  const completedDays = dated.filter(({ m }) => m.fixtureStatus === "COMPLETED").map(({ day }) => day);
  const lastDay = completedDays.length > 0 ? completedDays.reduce((a, b) => (a > b ? a : b)) : null;
  const results = lastDay
    ? dated
        .filter(
          ({ m, day }) =>
            m.fixtureStatus === "COMPLETED" && day <= lastDay && day >= addDays(lastDay, -WEEKEND_SPAN_DAYS),
        )
        .map(({ m }) => m)
    : [];

  const upcomingDays = dated
    .filter(({ m, day }) => m.fixtureStatus === "SCHEDULED" && day >= today)
    .map(({ day }) => day);
  const firstDay = upcomingDays.length > 0 ? upcomingDays.reduce((a, b) => (a < b ? a : b)) : null;
  const upcoming = firstDay
    ? dated
        .filter(
          ({ m, day }) =>
            m.fixtureStatus === "SCHEDULED" && day >= firstDay && day <= addDays(firstDay, WEEKEND_SPAN_DAYS),
        )
        .map(({ m }) => m)
    : [];

  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: LEAGUE_TIME_ZONE }).format(
    now,
  );
  const resultsWeek = ["Mon", "Tue", "Wed"].includes(weekday);
  const lead = (resultsWeek && results.length > 0) || upcoming.length === 0 ? "results" : "upcoming";

  return { results, upcoming, lead };
}

/** "Oct 24–25", "Oct 31 – Nov 1" or "Oct 24" — the span of a list's match days, in the league zone. */
export function formatMatchdaySpan(matches: MatchWhen[]): string | null {
  const days = matches
    .flatMap((m) => (m.startsAt ? [m.startsAt] : []))
    .sort((a, b) => a.getTime() - b.getTime());
  if (days.length === 0) return null;
  const parts = (d: Date) => {
    const [month, day] = d
      .toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: LEAGUE_TIME_ZONE })
      .split(" ");
    return { month, day };
  };
  const first = parts(days[0]);
  const last = parts(days[days.length - 1]);
  if (first.month === last.month) {
    return first.day === last.day ? `${first.month} ${first.day}` : `${first.month} ${first.day}–${last.day}`;
  }
  return `${first.month} ${first.day} – ${last.month} ${last.day}`;
}
