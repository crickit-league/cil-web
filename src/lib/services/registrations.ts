import { prisma } from "@/lib/db/prisma";
import { registrationSchema, type RegistrationInput } from "@/lib/validation/registration";

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
