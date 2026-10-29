import { describe, expect, it, vi } from "vitest";

// The role check runs before any database access, so the client is never reached.
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));

import type { SessionUser } from "@/lib/auth/permissions";
import { can, ForbiddenError } from "@/lib/auth/permissions";
import { updateMatchInfo } from "@/lib/services/schedule";
import { saveUmpireAssignment } from "@/lib/services/umpire-assignments";

const input = { umpireOneName: "A", umpireOnePhone: "", umpireTwoName: "", umpireTwoPhone: "" };
const captain = { id: "u1", roles: [] } as unknown as SessionUser;

const asUser = (...roles: string[]) => ({ id: "u", roles }) as unknown as SessionUser;

describe("edit-umpires permission", () => {
  it("is held by ADMIN and SUPER_ADMIN only", () => {
    expect(can(asUser("ADMIN"), "edit-umpires")).toBe(true);
    expect(can(asUser("SUPER_ADMIN"), "edit-umpires")).toBe(true);
    expect(can(asUser(), "edit-umpires")).toBe(false);
    expect(can(asUser("CAPTAIN"), "edit-umpires")).toBe(false);
    expect(can(null, "edit-umpires")).toBe(false);
  });
});

describe("assigning umpires and editing match info is admin-only", () => {
  it("rejects a signed-out visitor", async () => {
    await expect(saveUmpireAssignment(null, "m1", input)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(updateMatchInfo(null as unknown as SessionUser, "m1", {})).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("rejects a signed-in user without an admin role", async () => {
    await expect(saveUmpireAssignment(captain, "m1", input)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(updateMatchInfo(captain, "m1", {})).rejects.toBeInstanceOf(ForbiddenError);
  });
});
