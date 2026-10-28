import { describe, expect, it } from "vitest";
import { formByTeam } from "./form";
import type { MatchStatus, ResultType } from "@/generated/prisma";

// Form guide on the home page's points table.

let day = 0;
function played(
  teamOneId: string,
  teamTwoId: string,
  outcome: { winnerId?: string; resultType?: ResultType; status?: MatchStatus },
) {
  day += 1;
  return {
    startsAt: new Date(Date.UTC(2026, 9, day)),
    status: outcome.status ?? ("COMPLETED" as MatchStatus),
    resultType: outcome.resultType ?? (outcome.winnerId ? ("RUNS" as ResultType) : null),
    teamOneId,
    teamTwoId,
    winnerId: outcome.winnerId ?? null,
  };
}

describe("formByTeam", () => {
  it("reads wins, losses, ties and no results from each side, oldest first", () => {
    day = 0;
    const matches = [
      played("hawks", "sharks", { winnerId: "hawks" }),
      played("sharks", "hawks", { resultType: "TIE" }),
      played("hawks", "whales", { winnerId: "whales" }),
      played("whales", "hawks", { status: "ABANDONED" }),
      played("hawks", "spades", { winnerId: "hawks", resultType: "SUPER_OVER" }),
    ];
    const form = formByTeam(matches, ["hawks", "sharks", "spades"]);
    expect(form.get("hawks")).toEqual(["W", "T", "L", "N", "W"]);
    expect(form.get("sharks")).toEqual(["L", "T"]);
    expect(form.get("spades")).toEqual(["L"]);
  });

  it("keeps only the most recent results, whatever order the matches arrive in", () => {
    day = 0;
    const matches = Array.from({ length: 7 }, (_, i) =>
      played("hawks", "sharks", { winnerId: i < 2 ? "sharks" : "hawks" }),
    ).reverse();
    expect(formByTeam(matches, ["hawks"]).get("hawks")).toEqual(["W", "W", "W", "W", "W"]);
  });

  it("ignores unplayed, cancelled and undated matches", () => {
    day = 0;
    const matches = [
      played("hawks", "sharks", { status: "SCHEDULED" }),
      played("hawks", "sharks", { status: "CANCELLED" }),
      { ...played("hawks", "sharks", { winnerId: "hawks" }), startsAt: null },
    ];
    expect(formByTeam(matches, ["hawks"]).get("hawks")).toEqual([]);
  });

  it("gives a team with no matches an empty form", () => {
    expect(formByTeam([], ["hawks"]).get("hawks")).toEqual([]);
  });
});
