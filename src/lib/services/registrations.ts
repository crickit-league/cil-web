import { prisma } from "@/lib/db/prisma";
import { registrationSchema, type RegistrationInput } from "@/lib/validation/registration";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { sendRegistrationConfirmationEmail } from "@/lib/email/send-registration-confirmation";

export class NoOpenSeasonError extends Error {
  constructor() {
    super("Registration is not currently open for any season.");
    this.name = "NoOpenSeasonError";
  }
}

export class DuplicateTeamNameError extends Error {
  constructor() {
    super("A team with this name has already registered for this season.");
    this.name = "DuplicateTeamNameError";
  }
}

export class DuplicateCaptainEmailError extends Error {
  constructor() {
    super("This email address has already been used to register a team for this season.");
    this.name = "DuplicateCaptainEmailError";
  }
}

/**
 * Validates and stores a Phase 1a team registration against whichever
 * season currently has registration open, then sends the captain the
 * confirmation/payment-reminder email (docs/architecture.md §9).
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

  // Checked up front, not just left to the DB's unique constraint, so a
  // duplicate submission gets a message pointing at the actual field
  // instead of a generic failure.
  const [existingTeam, existingCaptainEmail] = await Promise.all([
    prisma.registration.findUnique({
      where: { seasonId_teamName: { seasonId: openSeason.id, teamName: data.teamName } },
    }),
    prisma.registration.findUnique({
      where: { seasonId_captainEmail: { seasonId: openSeason.id, captainEmail: data.captainEmail } },
    }),
  ]);

  if (existingTeam) {
    throw new DuplicateTeamNameError();
  }
  if (existingCaptainEmail) {
    throw new DuplicateCaptainEmailError();
  }

  const registration = await prisma.registration.create({
    data: {
      seasonId: openSeason.id,
      teamName: data.teamName,
      captainName: data.captainName,
      captainEmail: data.captainEmail,
      captainMobile: data.captainMobile,
      viceCaptainName: data.viceCaptainName,
      viceCaptainEmail: data.viceCaptainEmail,
      viceCaptainMobile: data.viceCaptainMobile,
      feeTier: data.feeTier,
      marketingConsent: data.marketingConsent,
    },
  });

  try {
    await sendRegistrationConfirmationEmail({
      captainEmail: data.captainEmail,
      captainName: data.captainName,
      teamName: data.teamName,
    });
  } catch (error) {
    // The registration itself is already saved — don't fail the whole
    // submission over an email hiccup. There's no admin-visible delivery
    // log yet (docs/architecture.md §13's health page), so this only
    // surfaces in server logs for now.
    console.error("Failed to send registration confirmation email:", error);
  }

  return registration;
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
