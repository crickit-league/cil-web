import { describe, expect, it } from "vitest";
import { formatMatchdaySpan, pickMatchday } from "./matchday";
import { compareMatchWhen, leagueWallTimeToUtc } from "@/lib/time";
import type { FixtureStatus } from "@/lib/services/schedule";

// Last weekend's results and this weekend's fixtures for the home page.

type M = { id: string; startsAt: Date | null; timeTbd: boolean; fixtureStatus: FixtureStatus };

function match(id: string, date: string | null, status: FixtureStatus, time = "09:00"): M {
  return {
    id,
    startsAt: date ? leagueWallTimeToUtc(date, time) : null,
    timeTbd: false,
    fixtureStatus: status,
  };
}

const at = (date: string, time = "12:00") => leagueWallTimeToUtc(date, time);
const ids = (ms: M[]) => ms.map((m) => m.id);

// 2026-10-24/25 played, 2026-10-31/11-01 to come, 2026-11-07 after that, one date TBD.
const season = [
  match("tbd", null, "SCHEDULED"),
  match("w1-sat-am", "2026-10-24", "COMPLETED"),
  match("w1-sat-pm", "2026-10-24", "COMPLETED", "14:30"),
  match("w1-sun", "2026-10-25", "COMPLETED"),
  match("w0", "2026-10-17", "COMPLETED"),
  match("w2-sat", "2026-10-31", "SCHEDULED"),
  match("w2-sun", "2026-11-01", "SCHEDULED"),
  match("w3-sat", "2026-11-07", "SCHEDULED"),
].sort(compareMatchWhen);

describe("pickMatchday", () => {
  it("takes the latest weekend's results and the next weekend's fixtures, in fixture order", () => {
    const day = pickMatchday(season, at("2026-10-27"));
    expect(ids(day.results)).toEqual(["w1-sun", "w1-sat-am", "w1-sat-pm"]);
    expect(ids(day.upcoming)).toEqual(["w2-sun", "w2-sat"]);
  });

  it("leads with results Monday to Wednesday", () => {
    expect(pickMatchday(season, at("2026-10-26")).lead).toBe("results");
    expect(pickMatchday(season, at("2026-10-28")).lead).toBe("results");
  });

  it("leads with fixtures from Thursday", () => {
    expect(pickMatchday(season, at("2026-10-29")).lead).toBe("upcoming");
    expect(pickMatchday(season, at("2026-10-31")).lead).toBe("upcoming");
  });

  it("uses the Atlanta day, not UTC: late Wednesday evening is still a results day", () => {
    // 10:30 PM Wednesday in Atlanta is already Thursday in UTC.
    expect(pickMatchday(season, at("2026-10-28", "22:30")).lead).toBe("results");
  });

  it("keeps today's unplayed matches as upcoming on match day", () => {
    const day = pickMatchday(season, at("2026-10-31", "10:00"));
    expect(ids(day.upcoming)).toEqual(["w2-sun", "w2-sat"]);
  });

  it("leaves out a past match whose result hasn't been imported yet", () => {
    const pending = [...season, match("w1-unscored", "2026-10-25", "SCHEDULED")].sort(compareMatchWhen);
    const day = pickMatchday(pending, at("2026-10-27"));
    expect(ids(day.results)).not.toContain("w1-unscored");
    expect(ids(day.upcoming)).not.toContain("w1-unscored");
  });

  it("leads with fixtures before any match is played, even on a Monday", () => {
    const preseason = season.filter((m) => m.fixtureStatus === "SCHEDULED");
    const day = pickMatchday(preseason, at("2026-10-19"));
    expect(day.results).toEqual([]);
    expect(day.lead).toBe("upcoming");
  });

  it("leads with results once the season is over", () => {
    const over = season.filter((m) => m.fixtureStatus === "COMPLETED");
    const day = pickMatchday(over, at("2026-11-20"));
    expect(day.upcoming).toEqual([]);
    expect(day.lead).toBe("results");
  });
});

describe("formatMatchdaySpan", () => {
  it("formats one day, a span in one month and a span across months", () => {
    expect(formatMatchdaySpan([match("a", "2026-10-24", "COMPLETED")])).toBe("Oct 24");
    expect(formatMatchdaySpan(season.filter((m) => m.id.startsWith("w1")))).toBe("Oct 24–25");
    expect(formatMatchdaySpan(season.filter((m) => m.id.startsWith("w2")))).toBe("Oct 31 – Nov 1");
  });

  it("is null with no dated matches", () => {
    expect(formatMatchdaySpan([match("tbd", null, "SCHEDULED")])).toBeNull();
  });
});
