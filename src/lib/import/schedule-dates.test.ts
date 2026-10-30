import { describe, expect, it } from "vitest";
import { normalizeMatchRow, type RawMatchRecord } from "./cricclubs-matches";
import { planScheduleImport, type ExistingMatch, type PlanTeam } from "./schedule-plan";
import {
  compareMatchOldestFirst,
  compareMatchWhen,
  formatCardStampOrTbd,
  leagueWallTimeToUtc,
} from "@/lib/time";

// Fixtures published before the committee has fixed their date and/or time.

function record(date: string, time: string): RawMatchRecord {
  return {
    "Match Type": "league",
    Date: date,
    "Time (IST)": time,
    "Team One": "Hawks",
    "Team two": "Sharks",
    Ground: "Nickajack Park 1",
    Result: "",
    "Score Summary": "",
  };
}

function normalize(date: string, time: string) {
  const result = normalizeMatchRow(record(date, time), 1);
  if ("problem" in result) throw new Error(result.problem.message);
  return result.row;
}

describe("normalizeMatchRow dates", () => {
  it("reads a full date and time", () => {
    expect(normalize("2026-10-24", "9:00:00")).toMatchObject({ date: "2026-10-24", time: "09:00" });
  });

  it("treats a blank date and time as not scheduled yet", () => {
    expect(normalize("", "")).toMatchObject({ date: null, time: null });
  });

  it("keeps a date whose time is blank, time TBD", () => {
    expect(normalize("2026-10-24", "")).toMatchObject({ date: "2026-10-24", time: null });
  });

  it("ignores a time without a date", () => {
    expect(normalize("", "09:00:00")).toMatchObject({ date: null, time: null });
  });

  it('reads "TBD" cells as blank', () => {
    expect(normalize("TBD", "tbd")).toMatchObject({ date: null, time: null });
    expect(normalize("2026-10-24", "TBA")).toMatchObject({ date: "2026-10-24", time: null });
  });

  it("still rejects a malformed date or time", () => {
    expect(normalizeMatchRow(record("24/10/2026", "09:00:00"), 3)).toEqual({
      problem: { rowNumber: 3, message: `Date "24/10/2026" isn't in YYYY-MM-DD form.` },
    });
    expect(normalizeMatchRow(record("2026-10-24", "morning"), 3)).toHaveProperty("problem");
    expect(normalizeMatchRow(record("2026-10-24", "25:00"), 3)).toHaveProperty("problem");
    expect(normalizeMatchRow(record("", "morning"), 3)).toHaveProperty("problem");
  });
});

const teams: PlanTeam[] = [
  { id: "t1", displayName: "Hawks", names: ["Hawks"], pool: "A" },
  { id: "t2", displayName: "Sharks", names: ["Sharks"], pool: "A" },
];

function plan(date: string, time: string, existing: ExistingMatch[] = []) {
  return planScheduleImport({
    records: [record(date, time)],
    teams,
    existing,
    groupCount: 1,
    playersPerSide: 10,
    maxOvers: 15,
  });
}

function saved(startsAt: Date | null, timeTbd: boolean): ExistingMatch {
  return {
    id: "m1",
    stage: "LEAGUE",
    teamOneId: "t1",
    teamTwoId: "t2",
    startsAt,
    timeTbd,
    groundName: "Nickajack Park 1",
    status: "SCHEDULED",
    umpiringTeamId: null,
    umpiringTeamSource: null,
    resultText: null,
    umpireNames: [],
    innings: [],
  };
}

const nineAm = leagueWallTimeToUtc("2026-10-24", "09:00");
const midnight = leagueWallTimeToUtc("2026-10-24", "00:00");

describe("schedule import dates", () => {
  it("creates unscheduled and time-TBD matches", () => {
    expect(plan("", "").creates[0]).toMatchObject({ startsAt: null, timeTbd: false });
    expect(plan("2026-10-24", "").creates[0]).toMatchObject({ startsAt: midnight, timeTbd: true });
    expect(plan("2026-10-24", "09:00:00").creates[0]).toMatchObject({ startsAt: nineAm, timeTbd: false });
  });

  it("updates a date-TBD match when a later file fills in the date and time", () => {
    const p = plan("2026-10-24", "09:00:00", [saved(null, false)]);
    expect(p.creates).toEqual([]);
    expect(p.updates).toHaveLength(1);
    expect(p.updates[0].matchId).toBe("m1");
    expect(p.updates[0].changes).toEqual(["date/time Date TBD → Sat, Oct 24, 9:00 AM"]);
    expect(p.updates[0].planned).toMatchObject({ startsAt: nineAm, timeTbd: false });
  });

  it("updates a time-TBD match when its time arrives", () => {
    const p = plan("2026-10-24", "09:00:00", [saved(midnight, true)]);
    expect(p.updates[0].changes).toEqual(["date/time Sat, Oct 24, time TBD → Sat, Oct 24, 9:00 AM"]);
  });

  it("is unchanged when a TBD match is still TBD", () => {
    const p = plan("", "", [saved(null, false)]);
    expect(p.updates).toEqual([]);
    expect(p.unchangedCount).toBe(1);
  });

  it("keeps a saved date when the file's date is blank, and says so", () => {
    const p = plan("", "", [saved(nineAm, false)]);
    expect(p.updates).toEqual([]);
    expect(p.unchangedCount).toBe(1);
    expect(p.warnings).toEqual([
      "Row 1: Hawks v Sharks (League) has no date in the file — kept the saved Sat, Oct 24, 9:00 AM.",
    ]);
  });

  it("keeps a saved time when the file has the same date with no time", () => {
    const p = plan("2026-10-24", "", [saved(nineAm, false)]);
    expect(p.updates).toEqual([]);
    expect(p.warnings[0]).toMatch(/has no time in the file — kept the saved Sat, Oct 24, 9:00 AM/);
  });

  it("moves a match to a new date even when the new time isn't set yet", () => {
    const p = plan("2026-10-31", "", [saved(nineAm, false)]);
    expect(p.warnings).toEqual([]);
    expect(p.updates[0].changes).toEqual(["date/time Sat, Oct 24, 9:00 AM → Sat, Oct 31, time TBD"]);
  });
});

describe("fixture ordering and stamps", () => {
  const undated = { startsAt: null, timeTbd: false };
  const sat9 = { startsAt: nineAm, timeTbd: false };
  const sat1445 = { startsAt: leagueWallTimeToUtc("2026-10-24", "14:45"), timeTbd: false };
  const satTbd = { startsAt: midnight, timeTbd: true };
  const sun8 = { startsAt: leagueWallTimeToUtc("2026-10-25", "08:00"), timeTbd: false };
  const nextSat = { startsAt: leagueWallTimeToUtc("2026-10-31", "11:45"), timeTbd: false };
  const order = (...ms: { startsAt: Date | null; timeTbd: boolean }[]) => [...ms].sort(compareMatchWhen);

  it("puts undated matches first, then days newest first", () => {
    expect(order(sat9, nextSat, undated, sun8)).toEqual([undated, nextSat, sun8, sat9]);
  });

  it("keeps a day's start times earliest first, with its time-TBD matches last", () => {
    expect(order(satTbd, sat1445, sat9)).toEqual([sat9, sat1445, satTbd]);
  });

  it("orders a full mix", () => {
    expect(order(sat9, satTbd, undated, sun8, sat1445, nextSat)).toEqual([
      undated,
      nextSat,
      sun8,
      sat9,
      sat1445,
      satTbd,
    ]);
  });

  it("orders across the November DST change by Atlanta calendar day", () => {
    const beforeDst = { startsAt: leagueWallTimeToUtc("2026-10-31", "23:00"), timeTbd: false };
    const afterDst = { startsAt: leagueWallTimeToUtc("2026-11-01", "08:00"), timeTbd: false };
    expect(order(beforeDst, afterDst)).toEqual([afterDst, beforeDst]);
  });

  it("stamps the card header", () => {
    expect(formatCardStampOrTbd({ startsAt: null, timeTbd: false })).toBe("DATE TBD");
    expect(formatCardStampOrTbd({ startsAt: midnight, timeTbd: true })).toBe("SAT 24 OCT · TIME TBD");
    expect(formatCardStampOrTbd({ startsAt: nineAm, timeTbd: false })).toBe("SAT 24 OCT · 9:00 AM");
  });

  it("orders oldest first for the fixtures page: earliest day first, time TBD after timed, no date last", () => {
    const at = (date: string, time: string) => ({
      startsAt: leagueWallTimeToUtc(date, time),
      timeTbd: false,
    });
    const early = at("2026-10-24", "09:00");
    const earlyLate = at("2026-10-24", "15:00");
    const later = at("2026-11-01", "09:00");
    const laterTbd = { startsAt: leagueWallTimeToUtc("2026-11-01", "00:00"), timeTbd: true };
    const undated = { startsAt: null, timeTbd: false };
    const shuffled = [undated, later, laterTbd, earlyLate, early];
    expect([...shuffled].sort(compareMatchOldestFirst)).toEqual([early, earlyLate, later, laterTbd, undated]);
  });
});
