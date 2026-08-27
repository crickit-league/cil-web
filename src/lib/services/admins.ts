import { prisma } from "@/lib/db/prisma";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { grantAdminSchema } from "@/lib/validation/admin";

/**
 * Everyone currently holding ADMIN or SUPER_ADMIN, for the "manage admins"
 * section of the console (docs/architecture.md §7 — super-admin only).
 */
export async function listAdminAccounts(user: SessionUser) {
  if (!can(user, "manage-admins")) {
    throw new ForbiddenError();
  }

  const roles = await prisma.userRole.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, scopeType: "GLOBAL" },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return roles.map((role) => ({
    userRoleId: role.id,
    userId: role.user.id,
    email: role.user.email,
    name: role.user.name,
    role: role.role,
    grantedAt: role.createdAt,
  }));
}

/**
 * Grants ADMIN to an email address, creating the User row if it doesn't
 * exist yet (same pattern as prisma/promote-admin.ts — auth is magic-link
 * only, so there's no signup step to hang this off of). SUPER_ADMIN isn't
 * grantable here on purpose; that stays a CLI-only action.
 */
export async function grantAdminRole(actingUser: SessionUser, rawEmail: string) {
  if (!can(actingUser, "manage-admins")) {
    throw new ForbiddenError();
  }

  const { email } = grantAdminSchema.parse({ email: rawEmail });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const existing = await prisma.userRole.findFirst({
    where: { userId: user.id, role: "ADMIN", scopeType: "GLOBAL" },
  });
  if (existing) return;

  await prisma.userRole.create({ data: { userId: user.id, role: "ADMIN" } });
}

/**
 * Revokes a single ADMIN grant by its UserRole id. Deliberately can't touch
 * SUPER_ADMIN rows or the acting user's own row — those two guards are the
 * actual protection (not the UI, which simply doesn't render a button for
 * either case; see CLAUDE.md on never relying on a hidden UI button).
 */
export async function revokeAdminRole(actingUser: SessionUser, userRoleId: string) {
  if (!can(actingUser, "manage-admins")) {
    throw new ForbiddenError();
  }

  const role = await prisma.userRole.findUnique({ where: { id: userRoleId } });
  if (!role) return;

  if (role.role !== "ADMIN") {
    throw new Error("Only ADMIN grants can be revoked here — SUPER_ADMIN is CLI-only.");
  }
  if (role.userId === actingUser.id) {
    throw new Error("You can't revoke your own admin access.");
  }

  await prisma.userRole.delete({ where: { id: userRoleId } });
}
