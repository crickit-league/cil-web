import type { Session } from "next-auth";

export type SessionUser = Session["user"];

export class ForbiddenError extends Error {
  constructor() {
    super("You do not have permission to perform this action.");
    this.name = "ForbiddenError";
  }
}

// Actions grow as new services need permission checks — see
// docs/architecture.md §7 for the full role/action table. Only the
// admin-console slice exists so far.
export type Action = "access-admin-console" | "manage-admins";

/**
 * Explicit permission check, per CLAUDE.md: never rely on a hidden UI
 * button. Every service function (and every admin route) calls this rather
 * than inlining a role check.
 */
export function can(user: SessionUser | null | undefined, action: Action): boolean {
  if (!user) return false;

  switch (action) {
    case "access-admin-console":
      return user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN");
    // Managing who has admin access is a super-admin-only capability, per
    // the role table in docs/architecture.md §7 — a plain admin is scoped
    // to "one season" of operational work, not to granting access itself.
    case "manage-admins":
      return user.roles.includes("SUPER_ADMIN");
    default:
      return false;
  }
}
