// The league plays in Atlanta. Match times are stored in UTC and always shown
// in this zone, so a season spanning the November DST change stays correct.
export const LEAGUE_TIME_ZONE = "America/New_York";

/** Minutes the league zone is ahead of UTC at the given instant (negative in Atlanta). */
function zoneOffsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: LEAGUE_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return (asUtc - instant.getTime()) / 60_000;
}

/**
 * Converts an Atlanta wall-clock time ("2025-10-25", "08:30") to the UTC
 * instant it names. Checks the offset twice so times either side of a DST
 * change land correctly.
 */
export function leagueWallTimeToUtc(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = zoneOffsetMinutes(new Date(guess));
  let utc = guess - first * 60_000;
  const second = zoneOffsetMinutes(new Date(utc));
  if (second !== first) utc = guess - second * 60_000;
  return new Date(utc);
}

/** "Sat, Oct 25" in the league zone. */
export function formatMatchDay(instant: Date): string {
  return instant.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: LEAGUE_TIME_ZONE,
  });
}

/** "8:30 AM" in the league zone. */
export function formatMatchTime(instant: Date): string {
  return instant.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: LEAGUE_TIME_ZONE,
  });
}

/** "2025-10-25" in the league zone — a stable key for grouping matches by day. */
export function matchDayKey(instant: Date): string {
  return instant.toLocaleDateString("en-CA", { timeZone: LEAGUE_TIME_ZONE });
}

/** "SAT 24 OCT · 09:00" in the league zone — the fixture card's header strip. */
export function formatCardStamp(instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: LEAGUE_TIME_ZONE,
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")} · ${get("hour")}:${get("minute")}`.toUpperCase();
}

/**
 * When a match is, as far as the committee has fixed it. startsAt null means
 * the date isn't set yet; timeTbd means only the date is (startsAt is then
 * midnight Atlanta time on that date). See Match in prisma/schema.prisma.
 */
export type MatchWhen = { startsAt: Date | null; timeTbd: boolean };

/** "Sat, Oct 25, 8:30 AM", "Sat, Oct 25, time TBD" or "Date TBD". */
export function formatMatchWhen({ startsAt, timeTbd }: MatchWhen): string {
  if (!startsAt) return "Date TBD";
  return `${formatMatchDay(startsAt)}, ${timeTbd ? "time TBD" : formatMatchTime(startsAt)}`;
}

/**
 * Oldest first, the order of the Fixtures page's two sections: earliest day first,
 * a day's time-TBD matches after its timed ones, and matches with no date yet last.
 */
export function compareMatchOldestFirst(a: MatchWhen, b: MatchWhen): number {
  if (!a.startsAt || !b.startsAt) return (a.startsAt ? 0 : 1) - (b.startsAt ? 0 : 1);
  const dayA = matchDayKey(a.startsAt);
  const dayB = matchDayKey(b.startsAt);
  if (dayA !== dayB) return dayA < dayB ? -1 : 1;
  if (a.timeTbd !== b.timeTbd) return a.timeTbd ? 1 : -1;
  return a.startsAt.getTime() - b.startsAt.getTime();
}

/** A fixtures-list day heading: "Sat, Oct 25", or "Date TBD" for matches not scheduled yet. */
export function formatFixtureDay(startsAt: Date | null): string {
  return startsAt ? formatMatchDay(startsAt) : "Date TBD";
}

/** Groups matches by day key ("tbd" for no date), keeping their order. */
export function groupByMatchDay<T extends MatchWhen>(matches: T[]): Map<string, T[]> {
  const days = new Map<string, T[]>();
  for (const m of matches) {
    const key = m.startsAt ? matchDayKey(m.startsAt) : "tbd";
    if (!days.has(key)) days.set(key, []);
    days.get(key)!.push(m);
  }
  return days;
}

/** Just the time part: "8:30 AM", "Time TBD" or "Date TBD". */
export function formatMatchTimeOrTbd({ startsAt, timeTbd }: MatchWhen): string {
  if (!startsAt) return "Date TBD";
  return timeTbd ? "Time TBD" : formatMatchTime(startsAt);
}

/** "SAT 24 OCT · 09:00", "SAT 24 OCT · TIME TBD" or "DATE TBD" — the fixture card's header strip. */
export function formatCardStampOrTbd({ startsAt, timeTbd }: MatchWhen): string {
  if (!startsAt) return "DATE TBD";
  const stamp = formatCardStamp(startsAt);
  return timeTbd ? `${stamp.split(" · ")[0]} · TIME TBD` : stamp;
}

/**
 * Fixture order (user's call, 2026-10-27): matches with no date yet first,
 * then days newest first. Within a day, start times still run earliest first
 * (reversed they'd read oddly), with the day's time-TBD matches last.
 */
export function compareMatchWhen(a: MatchWhen, b: MatchWhen): number {
  if (!a.startsAt || !b.startsAt) return (a.startsAt ? 1 : 0) - (b.startsAt ? 1 : 0);
  const dayA = matchDayKey(a.startsAt);
  const dayB = matchDayKey(b.startsAt);
  if (dayA !== dayB) return dayA < dayB ? 1 : -1;
  if (a.timeTbd !== b.timeTbd) return a.timeTbd ? 1 : -1;
  return a.startsAt.getTime() - b.startsAt.getTime();
}
