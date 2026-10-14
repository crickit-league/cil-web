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
