import { describe, expect, it } from "vitest";
import { countMatches, filterRuleBook, searchTerms, sectionOfRule, splitByTerms } from "./search";
import { POPULAR_TOPICS } from "./topics";
import { RULE_BOOK, type RuleSection } from "./winter-2026-27";

const ruleNums = (sections: RuleSection[]) =>
  sections.flatMap((s) => s.items.flatMap((i) => (i.kind === "rule" ? [i.num] : [])));

describe("searchTerms", () => {
  it("ignores punctuation, so 'no ball' and 'no-ball' are the same search", () => {
    expect(searchTerms("no-ball")).toEqual(["no", "ball"]);
    expect(searchTerms("no ball")).toEqual(["no", "ball"]);
    expect(searchTerms("  No_Ball!! ")).toEqual(["no_ball"].flatMap((t) => t.split("_")));
    expect(searchTerms("umpire's")).toEqual(["umpires"]);
    expect(searchTerms("rule 8.10.")).toEqual(["rule", "8.10"]);
    expect(searchTerms("$25")).toEqual(["$25"]);
    expect(searchTerms("| - |")).toEqual([]);
  });

  it("returns the same rules for 'no ball' and 'no-ball'", () => {
    const a = filterRuleBook(RULE_BOOK, searchTerms("no ball"));
    const b = filterRuleBook(RULE_BOOK, searchTerms("no-ball"));
    expect(ruleNums(a)).toEqual(ruleNums(b));
    expect(ruleNums(a)).toContain("8.7");
    expect(ruleNums(a)).toContain("8.9");
  });

  it("joins a word and the number after it into one term, except for rule numbers", () => {
    expect(searchTerms("cat 3 wide")).toEqual(["cat 3", "wide"]);
    expect(searchTerms("rule 8.10")).toEqual(["rule", "8.10"]);
    expect(searchTerms("rule 8")).toEqual(["rule", "8"]);
  });

  it("lowercases and splits on whitespace", () => {
    expect(searchTerms("  Super   OVER ")).toEqual(["super", "over"]);
    expect(searchTerms("   ")).toEqual([]);
  });
});

describe("filterRuleBook", () => {
  it("returns everything without terms", () => {
    expect(filterRuleBook(RULE_BOOK, [])).toBe(RULE_BOOK);
  });

  it("requires every term, in any order, case-insensitively", () => {
    const nums = ruleNums(filterRuleBook(RULE_BOOK, searchTerms("FREE hit")));
    expect(nums).toContain("8.10");
    expect(nums).toContain("8.7");
    expect(ruleNums(filterRuleBook(RULE_BOOK, searchTerms("hit free")))).toEqual(nums);
  });

  it("finds a rule by its number", () => {
    expect(ruleNums(filterRuleBook(RULE_BOOK, ["12.9"]))).toEqual(["12.9"]);
  });

  it("matches text inside bullet points", () => {
    expect(ruleNums(filterRuleBook(RULE_BOOK, ["wicket", "keeper"]))).toContain("1.3");
  });

  it("finds the rules of a section whose title matches the search", () => {
    const found = filterRuleBook(RULE_BOOK, searchTerms("super over")).find((s) => s.title === "Super Over")!;
    expect(ruleNums([found])).toContain("12.1");
    expect(ruleNums([found])).toContain("12.9"); // says only "overs"; "super" comes from the title
  });

  it("does not match on a section's title alone", () => {
    const nums = ruleNums(filterRuleBook(RULE_BOOK, searchTerms("umpiring")));
    const section = RULE_BOOK.find((s) => s.title === "Umpiring")!;
    expect(nums.length).toBeLessThan(ruleNums([section]).length);
  });

  it("never includes sub-headings in results", () => {
    const sections = filterRuleBook(RULE_BOOK, searchTerms("nickajack"));
    expect(sections.flatMap((s) => s.items).some((i) => i.kind === "heading")).toBe(false);
  });

  it("keeps only matching table rows", () => {
    const [section] = filterRuleBook(RULE_BOOK, ["nickajack"]);
    expect(section.title).toBe("Ground and Field Rules");
    const table = section.items.find((i) => i.kind === "table");
    expect(table?.kind === "table" && table.rows.map((r) => r[0])).toEqual([
      "CAT 2 · 110 ft to 140 ft",
      "CAT 3 · 90 ft to 110 ft",
    ]);
  });

  it("returns nothing when no term matches", () => {
    expect(filterRuleBook(RULE_BOOK, ["zzzz"])).toEqual([]);
  });
});

describe("countMatches", () => {
  it("counts rules plus table rows", () => {
    const [section] = filterRuleBook(RULE_BOOK, ["nickajack"]);
    expect(countMatches([section])).toBe(2);
  });
});

describe("sectionOfRule", () => {
  it("finds the section holding a rule", () => {
    expect(sectionOfRule("8.10")?.id).toBe("wides-no-balls");
    expect(sectionOfRule("99.9")).toBeUndefined();
  });
});

describe("popular topic searches", () => {
  it.each(POPULAR_TOPICS.map((t) => [t.label, t.query]))("%s finds rules", (_label, query) => {
    expect(filterRuleBook(RULE_BOOK, searchTerms(query)).length).toBeGreaterThan(0);
  });
});

describe("rule book completeness", () => {
  const rules = RULE_BOOK.flatMap((s) => s.items.flatMap((i) => (i.kind === "rule" ? [{ s, i }] : [])));

  it("holds all 125 rules of the PDF, numbered in order within each section", () => {
    expect(rules).toHaveLength(125);
    for (const section of RULE_BOOK) {
      const nums = rules.filter((r) => r.s === section).map((r) => r.i.num);
      expect(nums).toEqual(nums.map((_, k) => `${section.number}.${k + 1}`));
    }
  });

  it("finds every rule by its number and by its own opening words", () => {
    for (const { i } of rules) {
      expect(ruleNums(filterRuleBook(RULE_BOOK, [i.num])), i.num).toContain(i.num);
      const words = i.text.split(/\s+/).slice(0, 4).join(" ");
      expect(ruleNums(filterRuleBook(RULE_BOOK, searchTerms(words))), `${i.num}: ${words}`).toContain(i.num);
    }
  });
});

describe("boundary categories", () => {
  it("names each fence-distance row by its field category", () => {
    const section = RULE_BOOK.find((s) => s.id === "ground-field-rules")!;
    const table = section.items.find((i) => i.kind === "table" && i.caption?.startsWith("Field categories"));
    expect(table?.kind === "table" && table.rows.map((r) => r[0])).toEqual([
      "CAT 1 · More than 140 ft",
      "CAT 2 · 110 ft to 140 ft",
      "CAT 3 · 90 ft to 110 ft",
      "CAT 4 · Less than 90 ft",
    ]);
  });
});

describe("field setup cards", () => {
  it("are found by category name and by a field in the category", () => {
    for (const q of ["cat 2", "nickajack", "skip wells 3"]) {
      const section = filterRuleBook(RULE_BOOK, searchTerms(q)).find((s) => s.id === "ground-field-rules");
      expect(
        section?.items.some((i) => i.kind === "cards"),
        q,
      ).toBe(true);
    }
  });
});

describe("word-start matching", () => {
  const nums = (q: string) => ruleNums(filterRuleBook(RULE_BOOK, searchTerms(q)));

  it("does not match a term in the middle of a word", () => {
    expect(nums("cat 3")).not.toContain("2.3"); // "allocated"
    expect(nums("cat 3")).toEqual([]);
  });

  it("still finds the CAT 3 rows and cards", () => {
    const section = filterRuleBook(RULE_BOOK, searchTerms("cat 3")).find(
      (s) => s.id === "ground-field-rules",
    );
    const table = section?.items.find((i) => i.kind === "table");
    expect(table?.kind === "table" && table.rows.map((r) => r[0])).toEqual(["CAT 3 · 90 ft to 110 ft"]);
    expect(section?.items.some((i) => i.kind === "cards")).toBe(true);
  });

  it("matches the start of longer words, so partial typing works", () => {
    expect(nums("boundar")).toContain("10.1");
    expect(nums("penalt")).toContain("4.2");
  });

  it("does not let 8.1 find rule 8.10", () => {
    expect(nums("8.1")).toEqual(["8.1"]);
  });
});

describe("section titles as context", () => {
  const found = filterRuleBook(RULE_BOOK, searchTerms("late start"));
  const section = found.find((s) => s.id === "late-starts-forfeits-walkovers");

  it("finds late-start rules and the over-reduction tables although only the title says 'late'", () => {
    expect(section).toBeDefined();
    const nums = ruleNums([section!]);
    expect(nums).toContain("6.1");
    expect(nums).toContain("6.2");
    const tables = section!.items.filter((i) => i.kind === "table");
    expect(tables.map((t) => t.kind === "table" && t.caption)).toEqual([
      "Scenario 1: one team not ready",
      "Scenario 2: both teams not ready",
    ]);
  });

  it("still leaves out rules that mention none of the words themselves", () => {
    expect(ruleNums([section!])).not.toContain("6.3");
  });

  it("does not return a whole section for a title word alone", () => {
    const umpiring = filterRuleBook(RULE_BOOK, searchTerms("umpiring")).find((s) => s.title === "Umpiring");
    expect(ruleNums([umpiring!])).not.toContain("15.12");
  });
});

describe("alternatives with |", () => {
  it("matches either word", () => {
    const nums = ruleNums(filterRuleBook(RULE_BOOK, searchTerms("penalt|fine")));
    expect(nums).toContain("4.2"); // penalty
    expect(filterRuleBook(RULE_BOOK, ["penalt|fine"]).length).toBeGreaterThanOrEqual(
      filterRuleBook(RULE_BOOK, ["penalt"]).length,
    );
  });

  it("still requires every other term", () => {
    expect(ruleNums(filterRuleBook(RULE_BOOK, searchTerms("penalt|fine zzzz")))).toEqual([]);
  });

  it("highlights each alternative", () => {
    const hits = splitByTerms("Penalty and a fine", ["penalt|fine"]).filter((p) => p.hit);
    expect(hits.map((p) => p.text)).toEqual(["Penalt", "fine"]);
  });
});

describe("apostrophes", () => {
  it("are ignored on both sides of the match", () => {
    expect(ruleNums(filterRuleBook(RULE_BOOK, searchTerms("captains")))).toContain("14.2");
    expect(ruleNums(filterRuleBook(RULE_BOOK, searchTerms("captain's")))).toContain("14.2");
    expect(splitByTerms("the captain’s job", ["captains"]).find((p) => p.hit)?.text).toBe("captain’s");
  });
});

describe("splitByTerms", () => {
  it("marks only word-start matches", () => {
    expect(splitByTerms("allocated CAT 3", ["cat"])).toEqual([
      { text: "allocated ", hit: false },
      { text: "CAT", hit: true },
      { text: " 3", hit: false },
    ]);
  });

  it("merges overlapping hits and returns plain text with no terms", () => {
    expect(splitByTerms("free hit", ["free", "free hit".split(" ")[0]]).filter((p) => p.hit)).toHaveLength(1);
    expect(splitByTerms("abc", [])).toEqual([{ text: "abc", hit: false }]);
  });
});
