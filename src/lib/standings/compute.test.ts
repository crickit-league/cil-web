import { describe, expect, it } from "vitest";
import {
  computePoolStandings,
  drawKey,
  type StandingsAdjustmentInput,
  type StandingsInnings,
  type StandingsMatch,
} from "./compute";

// Tie-break cascade tests (CLAUDE.md: "needs dedicated test cases"). Each
// level gets a case where every earlier level is level and that one decides.

const POINTS = { win: 2, loss: 0, tie: 1, noResult: 1 };
const SEED = "series-2026";

let nextId = 0;

function inn(team: string, runs: number, wickets: number, overs: number, balls = 0): StandingsInnings {
  return { battingEntryId: team, runs, wickets, legalBalls: overs * 6 + balls, allOut: wickets === 9 };
}

/** `winner` beat `loser`, no scores — so it moves points/wins but not NRR or wickets. */
function win(winner: string, loser: string): StandingsMatch {
  return {
    id: `m${nextId++}`,
    teamOneId: winner,
    teamTwoId: loser,
    status: "COMPLETED",
    resultType: "RUNS",
    winnerId: winner,
    oversQuota: 15,
    innings: [],
  };
}

/** A decided match with both innings (first-listed batted first). */
function scored(
  winner: string,
  first: StandingsInnings,
  second: StandingsInnings,
  quota = 15,
): StandingsMatch {
  return {
    id: `m${nextId++}`,
    teamOneId: first.battingEntryId,
    teamTwoId: second.battingEntryId,
    status: "COMPLETED",
    resultType: winner === first.battingEntryId ? "RUNS" : "WICKETS",
    winnerId: winner,
    oversQuota: quota,
    innings: [first, second],
  };
}

/** A tie with both innings; equal runs and balls leave NRR untouched. */
function tie(first: StandingsInnings, second: StandingsInnings): StandingsMatch {
  return { ...scored(first.battingEntryId, first, second), resultType: "TIE", winnerId: null };
}

function abandoned(a: string, b: string): StandingsMatch {
  return {
    id: `m${nextId++}`,
    teamOneId: a,
    teamTwoId: b,
    status: "ABANDONED",
    resultType: "NO_RESULT",
    winnerId: null,
    oversQuota: 15,
    innings: [],
  };
}

function table(teamIds: string[], matches: StandingsMatch[], adjustments: StandingsAdjustmentInput[] = []) {
  return computePoolStandings({
    teams: teamIds.map((id) => ({ id, name: id })),
    matches,
    adjustments,
    points: POINTS,
    seed: SEED,
  });
}

const order = (result: ReturnType<typeof table>) => result.rows.map((r) => r.team.id);
const row = (result: ReturnType<typeof table>, id: string) => result.rows.find((r) => r.team.id === id)!;

describe("points and counting", () => {
  it("scores win 2, loss 0, tie 1 each, no result 1 each", () => {
    const tie: StandingsMatch = { ...win("A", "B"), resultType: "TIE", winnerId: null };
    const result = table(["A", "B", "C"], [win("A", "C"), tie, abandoned("B", "C")]);

    expect(row(result, "A")).toMatchObject({ played: 2, won: 1, lost: 0, tied: 1, noResult: 0, points: 3 });
    expect(row(result, "B")).toMatchObject({ played: 2, won: 0, lost: 0, tied: 1, noResult: 1, points: 2 });
    expect(row(result, "C")).toMatchObject({ played: 2, won: 0, lost: 1, tied: 0, noResult: 1, points: 1 });
  });

  it("ignores matches involving a team from another pool", () => {
    const result = table(["A", "B"], [win("A", "B"), win("A", "Z")]);
    expect(row(result, "A")).toMatchObject({ played: 1, won: 1 });
  });

  it("lists a played match it can't score instead of guessing", () => {
    const unknown: StandingsMatch = { ...win("A", "B"), resultType: null, winnerId: null };
    const result = table(["A", "B"], [unknown]);
    expect(result.uncounted).toEqual([{ matchId: unknown.id }]);
    expect(row(result, "A").played).toBe(0);
  });

  it("applies committee adjustments on top: points, and runs into NRR", () => {
    const m = scored("A", inn("A", 90, 5, 15), inn("B", 60, 5, 15));
    const base = table(["A", "B"], [m]);
    const adjusted = table(["A", "B"], [m], [{ teamEntryId: "A", pointsDelta: -2, runsDelta: -20 }]);

    expect(row(base, "A").points).toBe(2);
    expect(row(adjusted, "A").points).toBe(0);
    // (90 - 20) / 15 - 60 / 15 = 0.6667
    expect(row(adjusted, "A").nrr).toBe(0.6667);
    expect(row(adjusted, "A").runsFor).toBe(70);
  });
});

describe("net run rate", () => {
  it("charges an all-out side its full quota of overs", () => {
    // A 80/6 in 15; B all out for 40 in 10 overs → charged 15.
    const result = table(["A", "B"], [scored("A", inn("A", 80, 6, 15), inn("B", 40, 9, 10))]);
    // A: 80/15 - 40/15 = 2.6667; B: the mirror.
    expect(row(result, "A").nrr).toBe(2.6667);
    expect(row(result, "B").nrr).toBe(-2.6667);
    expect(row(result, "B").ballsFaced).toBe(90);
  });

  it("uses the match's own overs quota when it was shortened", () => {
    const result = table(["A", "B"], [scored("A", inn("A", 60, 4, 10), inn("B", 30, 9, 6), 10)]);
    // B charged 10 overs: A = 60/10 - 30/10 = 3.
    expect(row(result, "A").nrr).toBe(3);
  });

  it("counts balls, not the overs.balls notation", () => {
    // B chased 61 in 11.5 overs = 71 balls.
    const result = table(["A", "B"], [scored("B", inn("A", 60, 7, 15), inn("B", 61, 3, 11, 5))]);
    // B: 61*6/71 - 60/15 = 5.15493 - 4 = 1.1549
    expect(row(result, "B").nrr).toBe(1.1549);
  });

  it("leaves forfeits and no-results out of NRR, but not out of points", () => {
    const forfeit: StandingsMatch = {
      ...scored("A", inn("A", 50, 1, 5), inn("B", 10, 2, 5)),
      resultType: "FORFEIT",
    };
    const washedOut: StandingsMatch = {
      ...abandoned("A", "B"),
      innings: [inn("A", 60, 6, 15), inn("B", 43, 2, 10)],
    };
    const result = table(["A", "B"], [forfeit, washedOut]);
    expect(row(result, "A")).toMatchObject({ points: 3, nrr: 0, runsFor: 0, wicketsTaken: 0 });
  });
});

describe("tie-break cascade", () => {
  it("level 1: more points ranks higher, whatever the NRR", () => {
    const result = table(
      ["A", "B", "C"],
      [
        scored("A", inn("A", 61, 9, 15), inn("C", 60, 9, 15)), // A scrapes a win
        win("A", "B"),
        scored("C", inn("C", 120, 0, 15), inn("B", 20, 9, 5)), // C thrashes B
      ],
    );
    expect(order(result)).toEqual(["A", "C", "B"]);
    expect(row(result, "C").nrr).toBeGreaterThan(row(result, "A").nrr);
    expect(result.rows.every((r) => r.tieBreak === null)).toBe(true);
  });

  it("level 2: level on points, better NRR ranks higher", () => {
    const result = table(
      ["A", "B", "C", "D"],
      [
        scored("A", inn("A", 70, 5, 15), inn("C", 60, 5, 15)),
        scored("B", inn("B", 100, 5, 15), inn("D", 40, 5, 15)),
      ],
    );
    expect(order(result)).toEqual(["B", "A", "C", "D"]);
    expect(row(result, "B").tieBreak).toBeNull();
  });

  it("level 2 compares NRR at its published 4 decimal places", () => {
    // A: 42 in 10.1 overs, conceded 41 in 15 → 1.39781…; B: 42 in 10.2,
    // conceded 40 in 15 → 1.39785…. Both publish as 1.3978, so they're level
    // and head-to-head (B beat A, no scores) decides.
    const result = table(
      ["A", "B", "X", "Y", "Z"],
      [
        scored("A", inn("X", 41, 5, 15), inn("A", 42, 3, 10, 1)),
        scored("B", inn("Y", 40, 5, 15), inn("B", 42, 3, 10, 2)),
        win("B", "A"),
        win("A", "Z"),
      ],
    );
    expect(row(result, "A").points).toBe(row(result, "B").points);
    expect(row(result, "A").nrr).toBe(1.3978);
    expect(row(result, "B").nrr).toBe(1.3978);
    expect(order(result).slice(0, 2)).toEqual(["B", "A"]);
    expect(row(result, "B").tieBreak).toBe("HEAD_TO_HEAD");
  });

  it("level 3: two teams level on points and NRR — the head-to-head winner ranks higher", () => {
    // A and B each 1 win, 1 loss, no scores (NRR 0). B beat A.
    const twoWay = table(["A", "B", "C", "D"], [win("B", "A"), win("A", "C"), win("D", "B"), win("D", "C")]);
    expect(order(twoWay)).toEqual(["D", "B", "A", "C"]);
    expect(row(twoWay, "B").tieBreak).toBe("HEAD_TO_HEAD");
    expect(row(twoWay, "A").tieBreak).toBe("HEAD_TO_HEAD");
    expect(row(twoWay, "D").tieBreak).toBeNull();
  });

  it("level 3 does not decide when the meeting was tied or washed out", () => {
    // A and B level, their match abandoned, A took more wickets → wickets decide.
    const result = table(
      ["A", "B", "X", "Y"],
      [
        abandoned("A", "B"),
        scored("A", inn("A", 100, 2, 15), inn("X", 50, 9, 10)), // X all out: charged 15 overs
        scored("B", inn("B", 100, 2, 15), inn("Y", 50, 5, 15)),
      ],
    );
    expect(row(result, "A").nrr).toBe(row(result, "B").nrr);
    expect(order(result).slice(0, 2)).toEqual(["A", "B"]);
    expect(row(result, "A").tieBreak).toBe("WICKETS_TAKEN");
  });

  it("level 4: three teams level — most wins in matches among them ranks higher", () => {
    // A, B, C all on 4 points. Among themselves: A 2 wins, B 1, C 0. C makes
    // up its points against D and E.
    const result = table(
      ["A", "B", "C", "D", "E"],
      [
        win("A", "B"),
        win("A", "C"),
        win("B", "C"),
        win("C", "D"),
        win("C", "E"),
        win("B", "D"),
        win("D", "A"),
      ],
    );
    const top = result.rows.filter((r) => ["A", "B", "C"].includes(r.team.id));
    expect(top.map((r) => r.points)).toEqual([4, 4, 4]);
    expect(order(result).filter((id) => ["A", "B", "C"].includes(id))).toEqual(["A", "B", "C"]);
    expect(top.every((r) => r.tieBreak === "WINS_AMONG_TIED")).toBe(true);
  });

  it("level 4 then 3: a four-way tie splits into pairs, each settled by its own head-to-head", () => {
    // Among A, B, C, D: A beat B and C; D beat A and B; B beat C; C beat D.
    // Wins among them: A 2, D 2, B 1, C 1 → {A, D} and {B, C}. Outside wins
    // (over X) bring everyone to 3 wins = 6 points.
    const result = table(
      ["A", "B", "C", "D", "X"],
      [
        win("A", "B"),
        win("A", "C"),
        win("D", "A"),
        win("D", "B"),
        win("B", "C"),
        win("C", "D"),
        win("A", "X"),
        win("D", "X"),
        win("B", "X"),
        win("B", "X"),
        win("C", "X"),
        win("C", "X"),
      ],
    );
    expect(result.rows.slice(0, 4).every((r) => r.points === 6)).toBe(true);
    expect(order(result)).toEqual(["D", "A", "B", "C", "X"]);
    expect(row(result, "D").tieBreak).toBe("HEAD_TO_HEAD");
    expect(row(result, "B").tieBreak).toBe("HEAD_TO_HEAD");
  });

  it("level 4 split, then a pair still level falls through to wickets", () => {
    // A beat B and C; B v C washed out. Wins among them: A 2, B 0, C 0 → B
    // and C restart at head-to-head (no result), then wickets: C took more.
    // B and C make up their points with a win and a scored tie each — a tie
    // with equal scores leaves NRR at 0 but counts the wickets taken.
    const result = table(
      ["A", "B", "C", "X", "Y"],
      [
        win("A", "B"),
        win("A", "C"),
        abandoned("B", "C"),
        win("B", "Y"),
        tie(inn("Y", 60, 5, 15), inn("B", 60, 4, 15)),
        win("C", "X"),
        tie(inn("X", 60, 9, 15), inn("C", 60, 4, 15)),
      ],
    );
    const level = result.rows.filter((r) => ["A", "B", "C"].includes(r.team.id));
    expect(level.map((r) => [r.points, r.nrr])).toEqual([
      [4, 0],
      [4, 0],
      [4, 0],
    ]);
    expect(order(result).slice(0, 3)).toEqual(["A", "C", "B"]);
    expect(row(result, "A").tieBreak).toBe("WINS_AMONG_TIED");
    expect(row(result, "C").tieBreak).toBe("WICKETS_TAKEN");
    expect(row(result, "B").tieBreak).toBe("WICKETS_TAKEN");
  });

  it("level 5: a three-way cycle (A>B, B>C, C>A) goes to wickets taken", () => {
    const result = table(
      ["A", "B", "C"],
      [
        scored("A", inn("A", 60, 5, 15), inn("B", 50, 7, 15)),
        scored("B", inn("B", 60, 5, 15), inn("C", 50, 8, 15)),
        scored("C", inn("C", 60, 5, 15), inn("A", 50, 6, 15)),
      ],
    );
    // Points and NRR are identical; wickets taken: A 7, B 8, C 6.
    expect(new Set(result.rows.map((r) => `${r.points}|${r.nrr}`)).size).toBe(1);
    expect(order(result)).toEqual(["B", "A", "C"]);
    expect(result.rows.every((r) => r.tieBreak === "WICKETS_TAKEN")).toBe(true);
  });

  it("level 6: a seeded draw when everything else is level, the same on every load", () => {
    const teams = ["A", "B", "C", "D"];
    const result = table(teams, [abandoned("A", "B"), abandoned("C", "D")]);
    const expected = [...teams].sort((x, y) => drawKey(SEED, x).localeCompare(drawKey(SEED, y)));

    expect(order(result)).toEqual(expected);
    expect(order(table(teams, [abandoned("A", "B"), abandoned("C", "D")]))).toEqual(expected);
    expect(result.rows.every((r) => r.tieBreak === "DRAW")).toBe(true);
  });

  it("level 6 only draws among the teams still level", () => {
    // A and B level on everything; C has fewer points.
    const result = table(
      ["A", "B", "C"],
      [abandoned("A", "B"), abandoned("A", "C"), abandoned("B", "C")],
      [{ teamEntryId: "C", pointsDelta: -1, runsDelta: 0 }],
    );
    expect(order(result)[2]).toBe("C");
    expect(row(result, "C").tieBreak).toBeNull();
  });

  it("before anyone has played, lists teams alphabetically with no tie-break", () => {
    const result = table(["Sharks", "Hawks", "Jaguars"], []);
    expect(order(result)).toEqual(["Hawks", "Jaguars", "Sharks"]);
    expect(result.rows.every((r) => r.tieBreak === null)).toBe(true);
  });
});
