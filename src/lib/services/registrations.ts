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

  const registration = await prisma.registration.create({
    data: {
      seasonId: openSeason.id,
      teamName: data.teamName,
      captainFirstName: data.captainFirstName,
      captainLastName: data.captainLastName,
      captainEmail: data.captainEmail,
      captainMobile: data.captainMobile,
    },
  });

  try {
    await sendRegistrationConfirmationEmail({
      captainEmail: data.captainEmail,
      captainFirstName: data.captainFirstName,
      captainLastName: data.captainLastName,
      paymentDeadline: openSeason.registrationClosesAt,
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
