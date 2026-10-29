import { describe, expect, it } from "vitest";
import { teamHue, teamInitials } from "./team-badge";

describe("teamInitials", () => {
  it.each([
    ["Atlanta Strikers", "AS"],
    ["Peachtree Panthers", "PP"],
    ["Sharks", "SHA"],
    ["Georgia Royal Challengers Club", "GRC"],
    ["TBD (A3)", "TBD"],
    ["  ", "?"],
    ["St. Mary's XI", "SMX"],
  ])("%j → %j", (name, initials) => {
    expect(teamInitials(name)).toBe(initials);
  });
});

describe("teamHue", () => {
  it("is stable and ignores case and surrounding spaces", () => {
    expect(teamHue("Atlanta Strikers")).toBe(teamHue("  atlanta strikers "));
  });

  it("spreads different teams across several colours", () => {
    const names = [
      "Atlanta Strikers",
      "Peachtree Panthers",
      "Roswell Royals",
      "Decatur Dynamos",
      "Duluth Dragons",
    ];
    expect(new Set(names.map(teamHue)).size).toBeGreaterThan(2);
  });
});
