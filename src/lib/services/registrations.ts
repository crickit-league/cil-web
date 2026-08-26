import { prisma } from "@/lib/db/prisma";
import { registrationSchema, type RegistrationInput } from "@/lib/validation/registration";
import { can, type SessionUser } from "@/lib/auth/permissions";

export class ForbiddenError extends Error {
  constructor() {
    super("You do not have permission to perform this action.");
    this.name = "ForbiddenError";
  }
}

export class NoOpenSeasonError extends Error {
  constructor() {
    super("Registration is not currently open for any season.");
    this.name = "NoOpenSeasonError";
  }
}

/**
 * Validates and stores a Phase 1a team registration against whichever
 * season currently has registration open. Does not send any email yet —
 * that's the next piece to wire up (Resend), see docs/architecture.md §9.
 */
export async function submitRegistration(input: RegistrationInput) {
  const data = registrationSchema.parse(input);

  const openSeason = await prisma.season.findFirst({
    where: { status: "REGISTRATION_OPEN" },
    orderBy: { registrationOpensAt: "desc" },
  });

  if (!openSeason) {
    throw new NoOpenSeasonError();
  }

  return prisma.registration.create({
    data: {
      seasonId: openSeason.id,
      teamName: data.teamName,
      captainFirstName: data.captainFirstName,
      captainLastName: data.captainLastName,
      captainEmail: data.captainEmail,
      captainMobile: data.captainMobile,
    },
  });
}

/**
 * Lists all registrations, most recent first, for the admin console.
 * No review/approve workflow yet (Phase 1b) — this is read-only.
 */
export async function listRegistrations(user: SessionUser) {
  if (!can(user, "access-admin-console")) {
    throw new ForbiddenError();
  }

  return prisma.registration.findMany({
    include: { season: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
