import { describe, expect, it } from "vitest";
import { formatWeekRange, groupByWeek, leagueWallTimeToUtc, weekStartKey } from "@/lib/time";

describe("weeks run Monday to Sunday", () => {
  it("maps every day of a week to its Monday", () => {
    for (const day of ["2026-10-26", "2026-10-28", "2026-11-01"])
      expect(weekStartKey(day)).toBe("2026-10-26");
    expect(weekStartKey("2026-11-02")).toBe("2026-11-02");
  });

  it("formats the range across a month end", () => {
    expect(formatWeekRange("2026-10-26")).toBe("Oct 26 – Nov 1");
  });

  it("groups by week, with undated matches under tbd", () => {
    const m = (date: string | null) => ({
      startsAt: date ? leagueWallTimeToUtc(date, "09:00") : null,
      timeTbd: false,
    });
    const weeks = groupByWeek([m("2026-10-31"), m("2026-11-01"), m("2026-11-07"), m(null)]);
    expect([...weeks.keys()]).toEqual(["2026-10-26", "2026-11-02", "tbd"]);
    expect(weeks.get("2026-10-26")).toHaveLength(2);
  });
});
