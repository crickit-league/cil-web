import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parsePointsTable, readCsvLines } from "./cricclubs-points-table";

// A trimmed copy of CricClubs' viewPointsTableExcel.csv (2025-26), keeping its
// quirks: leading blank lines, ",,,Group A" title rows, header cells with
// stray spaces, "%" on WIN%, decimal PTS, negative NRR, runs/overs strings.
const sample = readFileSync(join(__dirname, "__fixtures__", "cricclubs-points-table.csv"), "utf8");

const HEADER = "  SNO ,TEAM , MAT, WON, LOST , N/R, TIE, PTS, WIN%,NET RR, FOR, AGAINST";
const parse = (text: string) => parsePointsTable(readCsvLines(text));

describe("readCsvLines", () => {
  it("splits cells, keeps line numbers, and handles CRLF and quoted commas", () => {
    expect(readCsvLines('a,b\r\n\r\n"x, y","say ""hi"""\r\n')).toEqual([
      { lineNumber: 1, cells: ["a", "b"] },
      { lineNumber: 2, cells: [""] },
      { lineNumber: 3, cells: ["x, y", 'say "hi"'] },
    ]);
  });

  it("drops a UTF-8 byte-order mark", () => {
    expect(readCsvLines("﻿SNO,TEAM")[0].cells).toEqual(["SNO", "TEAM"]);
  });
});

describe("parsePointsTable", () => {
  it("reads the CricClubs export into groups in file order", () => {
    const { groups, problems } = parse(sample);
    expect(problems).toEqual([]);
    expect(groups.map((g) => [g.name, g.rows.length])).toEqual([
      ["Group A", 5],
      ["Group B", 3],
    ]);
    expect(groups[0].rows[0]).toEqual({
      lineNumber: 5,
      position: 1,
      teamName: "KCC Yoddhas",
      played: 10,
      won: 8,
      lost: 0,
      noResult: 2,
      tied: 0,
      points: 18,
      winPercent: 100,
      netRunRate: 1.8753,
      runsFor: "519/104.4",
      runsAgainst: "370/120",
    });
  });

  it("keeps negative NRR, ties and whole-over runs/overs as given", () => {
    const { groups } = parse(sample);
    const velocity = groups[1].rows.find((r) => r.teamName === "Velocity CC")!;
    expect(velocity).toMatchObject({ tied: 1, points: 2, winPercent: 0, netRunRate: -2.2234 });
    expect(velocity.runsFor).toBe("439/135");
    expect(groups[0].rows.find((r) => r.teamName === "Spades")!.netRunRate).toBe(-0.2812);
  });

  it("parses the same file with Windows line endings", () => {
    expect(parse(sample.replace(/\r?\n/g, "\r\n"))).toEqual(parse(sample));
  });

  it("reports a bad row with its line number and team, and keeps the others", () => {
    const text = sample.replace("2,Team Chargers,10,7,2,1,0,15.0", "2,Team Chargers,ten,7,2,1,0,15.0");
    const { groups, problems } = parse(text);
    expect(problems).toEqual([{ lineNumber: 6, message: "Team Chargers: MAT must be a whole number." }]);
    expect(groups[0].rows.map((r) => r.teamName)).not.toContain("Team Chargers");
  });

  it("rejects malformed WIN%, NRR and runs/overs", () => {
    const row = "1,Hawks,10,4,5,1,0,9.0,lots,0.5x,505-119.4,486/134.1";
    const { problems } = parse(`,,,Group B\n${HEADER}\n${row}\n`);
    expect(problems).toHaveLength(1);
    expect(problems[0].message).toMatch(/WIN%/);
    expect(problems[0].message).toMatch(/NET RR/);
    expect(problems[0].message).toMatch(/FOR/);
  });

  it("flags a team listed twice in a group", () => {
    const row = "1,Hawks,10,4,5,1,0,9.0,44.44%,0.5977,505/119.4,486/134.1";
    const dup = "2,hawks,10,4,5,1,0,9.0,44.44%,0.5977,505/119.4,486/134.1";
    const { problems } = parse(`,,,Group B\n${HEADER}\n${row}\n${dup}\n`);
    expect(problems[0].message).toMatch(/appears twice/);
  });

  it("flags rows before any header", () => {
    const row = "1,Hawks,10,4,5,1,0,9.0,44.44%,0.5977,505/119.4,486/134.1";
    const { problems } = parse(`${row}\n,,,Group B\n${HEADER}\n`);
    expect(problems[0]).toEqual({ lineNumber: 1, message: "A team row comes before the column headers." });
  });

  it("names missing required columns in the header", () => {
    const { problems } = parse(",,,Group A\nSNO,TEAM,PTS\n1,Hawks,9.0\n");
    expect(problems[0].message).toMatch(/missing MAT, WON, LOST, NET RR/);
  });

  it("says so when the file isn't a points table at all", () => {
    expect(parse("Match Type,Date,Team One\nleague,2025-10-25,Hawks\n").problems[0].message).toMatch(
      /doesn't look like a CricClubs points table/,
    );
  });

  it("puts a header with no group title into one unnamed group", () => {
    const { groups } = parse(`${HEADER}\n1,Hawks,10,4,5,1,0,9.0,44.44%,0.5977,505/119.4,486/134.1\n`);
    expect(groups.map((g) => g.name)).toEqual(["Points Table"]);
  });
});
