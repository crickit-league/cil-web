import { describe, expect, it } from "vitest";
import { matchLabel } from "./match-label";

describe("matchLabel", () => {
  it("joins the two team names", () => {
    expect(matchLabel({ name: "Sharks" }, { name: "Titans" })).toBe("Sharks v Titans");
  });

  it("shows a placeholder for an undecided side", () => {
    expect(matchLabel({ name: "Sharks" }, null, null, "W:PQ4")).toBe("Sharks v TBD (W:PQ4)");
    expect(matchLabel(null, null)).toBe("TBD v TBD");
  });
});
