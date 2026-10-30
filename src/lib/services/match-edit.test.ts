import { describe, expect, it, vi } from "vitest";

// The role check runs before any database access, so the client is never reached.
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));

import type { SessionUser } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/auth/permissions";
import { getMatchEditView } from "@/lib/services/match-edit";
import { getMatchEditOptions, updateMatchInfo } from "@/lib/services/schedule";
import { leagueDateTimeInputs, leagueWallTimeToUtc } from "@/lib/time";

const nobody = { id: "u1", roles: [] } as unknown as SessionUser;

describe("editing a match is admin-only", () => {
  it("rejects a user without an admin role", async () => {
    await expect(updateMatchInfo(nobody, "m1", {})).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getMatchEditOptions(nobody)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getMatchEditView(nobody, "m1")).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("leagueDateTimeInputs", () => {
  it("gives the Atlanta date and 24-hour time an HTML form takes", () => {
    expect(leagueDateTimeInputs(leagueWallTimeToUtc("2026-10-31", "15:00"))).toEqual({
      date: "2026-10-31",
      time: "15:00",
    });
    // Across the November DST change the wall-clock time stays what was entered.
    expect(leagueDateTimeInputs(leagueWallTimeToUtc("2026-11-01", "09:00"))).toEqual({
      date: "2026-11-01",
      time: "09:00",
    });
  });
});
