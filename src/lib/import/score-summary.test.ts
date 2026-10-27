import { describe, expect, it } from "vitest";
import { parseScoreSummary } from "./cricclubs-matches";
import { planScheduleImport, type ExistingMatch, type PlanTeam } from "./schedule-plan";

describe("parseScoreSummary", () => {
  it("reads both innings in batting order, overs as overs.balls", () => {
    expect(parseScoreSummary("Atlanta BlackCaps: 42/9(14) Spades: 43/7(11.5)")).toEqual({
      innings: [
        { teamName: "Atlanta BlackCaps", runs: 42, wickets: 9, legalBalls: 84 },
        { teamName: "Spades", runs: 43, wickets: 7, legalBalls: 71 },
      ],
    });
  });

  it("handles long team names and a blank cell", () => {
    expect(
      parseScoreSummary("Providence Realty Cricket United: 39/9(11.5) Team Chargers: 40/2(6.3)"),
    ).toEqual({
      innings: [
        { teamName: "Providence Realty Cricket United", runs: 39, wickets: 9, legalBalls: 71 },
        { teamName: "Team Chargers", runs: 40, wickets: 2, legalBalls: 39 },
      ],
    });
    expect(parseScoreSummary("")).toEqual({ innings: [] });
  });

  it("drops CricClubs' 0/0(0) placeholder for a match that never started", () => {
    expect(parseScoreSummary("KCC Yoddhas: 0/0(0)")).toEqual({ innings: [] });
  });

  it("rejects text it can't fully account for", () => {
    expect(parseScoreSummary("Spades: 43/7(11.5) DLS target 50")).toHaveProperty("error");
    expect(parseScoreSummary("Spades: 43/7(11.7)")).toHaveProperty("error");
  });
});

const teams: PlanTeam[] = [
  { id: "t1", displayName: "Hawks", names: ["Hawks"], pool: "A" },
  { id: "t2", displayName: "Sharks", names: ["Sharks"], pool: "A" },
];

function record(result: string, summary: string) {
  return {
    "Match Type": "league",
    Date: "2025-10-25",
    "Time (IST)": "08:30:00",
    "Team One": "Hawks",
    "Team two": "Sharks",
    Ground: "Nickajack Park 1",
    Result: result,
    "Score Summary": summary,
  };
}

function plan(result: string, summary: string, existing: ExistingMatch[] = []) {
  return planScheduleImport({
    records: [record(result, summary)],
    teams,
    existing,
    groupCount: 1,
    playersPerSide: 10,
    maxOvers: 15,
  });
}

describe("schedule import innings", () => {
  it("plans innings with all out at the last wicket of a 10-a-side team", () => {
    const p = plan("Sharks won by 2 Wickets", "Hawks: 42/9(14) Sharks: 43/7(11.5)");
    expect(p.scoreProblems).toEqual([]);
    expect(p.creates[0].innings).toEqual([
      { number: 1, battingEntryId: "t1", runs: 42, wickets: 9, legalBalls: 84, allOut: true },
      { number: 2, battingEntryId: "t2", runs: 43, wickets: 7, legalBalls: 71, allOut: false },
    ]);
  });

  it("reports unreadable scores without blocking, and leaves saved innings alone", () => {
    const p = plan("Sharks won by 2 Wickets", "Hawks: 42/9(14) Eagles: 43/7(11.5)");
    expect(p.problems).toEqual([]);
    expect(p.scoreProblems).toHaveLength(1);
    expect(p.creates[0].innings).toBeNull();
  });

  it("flags a decided result that has only one side's score", () => {
    const p = plan("Hawks won by 10 Runs", "Hawks: 60/5(15)");
    expect(p.scoreProblems[0].message).toMatch(/both teams/);
  });

  it("treats changed scores on a saved match as an update", () => {
    const existing: ExistingMatch = {
      id: "m1",
      stage: "LEAGUE",
      teamOneId: "t1",
      teamTwoId: "t2",
      startsAt: plan("", "").creates[0].startsAt,
      timeTbd: false,
      groundName: "Nickajack Park 1",
      status: "COMPLETED",
      umpiringTeamId: null,
      umpiringTeamSource: null,
      resultText: "Sharks won by 2 Wickets",
      umpireNames: [],
      innings: [],
    };
    const p = plan("Sharks won by 2 Wickets", "Hawks: 42/9(14) Sharks: 43/7(11.5)", [existing]);
    expect(p.updates).toHaveLength(1);
    expect(p.updates[0].changes).toEqual(["scores updated"]);
  });
});
