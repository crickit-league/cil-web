import { describe, expect, it } from "vitest";
import { mockMomEnabled, mockMomEntries, mockMomEntry, mockMomPhotos } from "./mock-mom";

describe("mock Man of the Match data", () => {
  it("gives every entry a picture, a write-up and a played match with both scores", () => {
    const entries = mockMomEntries();
    expect(entries.length).toBeGreaterThanOrEqual(4);
    for (const e of entries) {
      expect(e.url).toMatch(/^\/mock\/mom-\d\.jpg$/);
      expect(e.title).toBeTruthy();
      expect(e.body).toBeTruthy();
      expect(e.match?.fixtureStatus).toBe("COMPLETED");
      expect(e.match?.scores).toHaveLength(2);
    }
  });

  it("finds an entry by id, and the carousel photos link to the same ids", () => {
    const [first] = mockMomPhotos();
    expect(mockMomEntry(first.id)?.title).toBe(first.title);
    expect(mockMomEntry("nope")).toBeNull();
  });

  it("is on unless MOCK_MOM=0", () => {
    const saved = process.env.MOCK_MOM;
    try {
      delete process.env.MOCK_MOM;
      expect(mockMomEnabled()).toBe(true);
      process.env.MOCK_MOM = "0";
      expect(mockMomEnabled()).toBe(false);
    } finally {
      if (saved === undefined) delete process.env.MOCK_MOM;
      else process.env.MOCK_MOM = saved;
    }
  });
});
