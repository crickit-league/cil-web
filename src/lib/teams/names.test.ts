import { describe, expect, it } from "vitest";
import { normalizeName } from "@/lib/import/cricclubs-matches";
import { indexTeamNames, findTeamByName, planRename, resolveTeamNames } from "./names";

const sharks = { id: "e1", displayName: "Acme Sharks", names: ["Acme Sharks", "Sharks", "atl sharks"] };
const hawks = { id: "e2", displayName: "Hawks", names: ["Hawks", "Hawks"] };

describe("normalizeName", () => {
  it("trims, lower-cases and collapses whitespace", () => {
    expect(normalizeName("  Atlanta   BlackCaps \t")).toBe("atlanta blackcaps");
  });
});

describe("findTeamByName", () => {
  const byName = indexTeamNames([sharks, hawks]);

  it("matches the display name, the canonical name and aliases, ignoring case and spacing", () => {
    expect(findTeamByName(byName, "ACME  sharks")?.id).toBe("e1");
    expect(findTeamByName(byName, "sharks")?.id).toBe("e1");
    expect(findTeamByName(byName, " Atl Sharks ")?.id).toBe("e1");
    expect(findTeamByName(byName, "hawks")?.id).toBe("e2");
  });

  it("doesn't match an unknown name", () => {
    expect(findTeamByName(byName, "Cozy Whales")).toBeUndefined();
  });
});

describe("resolveTeamNames", () => {
  it("separates matched and unknown names, each listed once", () => {
    const r = resolveTeamNames(["Sharks", "Hawks", "Cozy Whales", "Cozy Whales"], [sharks, hawks]);
    expect(r.matched.get("Sharks")?.id).toBe("e1");
    expect(r.matched.get("Hawks")?.id).toBe("e2");
    expect(r.unmatched).toEqual(["Cozy Whales"]);
    expect(r.collisions).toEqual([]);
  });

  it("flags two different spellings of one team in the same file", () => {
    const r = resolveTeamNames(["Sharks", "Acme Sharks"], [sharks, hawks]);
    expect(r.collisions).toEqual([{ team: sharks, names: ["Sharks", "Acme Sharks"] }]);
  });
});

describe("planRename", () => {
  const base = {
    currentDisplayName: "Sharks",
    canonicalName: "Sharks",
    aliases: [] as string[],
    otherTeams: [hawks],
  };

  it("does nothing when the name is unchanged", () => {
    expect(planRename({ ...base, newName: "  Sharks " })).toEqual({ kind: "unchanged" });
  });

  it("doesn't add an alias when the old name is the canonical name", () => {
    expect(planRename({ ...base, newName: "Acme Sharks" })).toEqual({
      kind: "rename",
      from: "Sharks",
      to: "Acme Sharks",
      aliasToAdd: null,
    });
  });

  it("keeps a sponsor-prefixed old name as an alias when renaming again", () => {
    const plan = planRename({ ...base, currentDisplayName: "Acme Sharks", newName: "Zenith Sharks" });
    expect(plan).toEqual({
      kind: "rename",
      from: "Acme Sharks",
      to: "Zenith Sharks",
      aliasToAdd: "acme sharks",
    });
  });

  it("doesn't add an alias the team already has", () => {
    const plan = planRename({
      ...base,
      currentDisplayName: "Acme Sharks",
      aliases: ["acme sharks"],
      newName: "Zenith Sharks",
    });
    expect(plan).toMatchObject({ kind: "rename", aliasToAdd: null });
  });

  it("needs no alias for a case-only change", () => {
    const plan = planRename({ ...base, currentDisplayName: "Acme Sharks", newName: "ACME Sharks" });
    expect(plan).toMatchObject({ kind: "rename", to: "ACME Sharks", aliasToAdd: null });
  });

  it("refuses a name another team in the series answers to", () => {
    expect(planRename({ ...base, newName: "hawks" })).toEqual({ kind: "taken", by: "Hawks" });
    expect(
      planRename({
        ...base,
        otherTeams: [{ displayName: "Hawks", names: ["Hawks", "Old Hawks"] }],
        newName: "Old Hawks",
      }),
    ).toEqual({ kind: "taken", by: "Hawks" });
  });

  it("allows renaming back to one of the team's own old names", () => {
    const plan = planRename({
      ...base,
      currentDisplayName: "Acme Sharks",
      aliases: ["sharks"],
      newName: "Sharks",
    });
    expect(plan).toMatchObject({ kind: "rename", to: "Sharks", aliasToAdd: "acme sharks" });
  });
});
