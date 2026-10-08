import ExcelJS from "exceljs";
import { prisma } from "@/lib/db/prisma";
import {
  adminRegistrationUpdateSchema,
  registrationSchema,
  type RegistrationInput,
} from "@/lib/validation/registration";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { sendRegistrationConfirmationEmail } from "@/lib/email/send-registration-confirmation";
import { diffRecords, recordAudit } from "@/lib/services/audit";
import { FEE_TIER_LABEL } from "@/lib/registrations/labels";

export class NoOpenSeasonError extends Error {
  constructor() {
    super("Registration is not currently open for any season.");
    this.name = "NoOpenSeasonError";
  }
}

export class RegistrationNotFoundError extends Error {
  constructor() {
    super("That registration no longer exists.");
    this.name = "RegistrationNotFoundError";
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

/**
 * Admin edit of a single registration. Re-validates with the same rules as
 * the public form (plus status/fee status) and re-applies the per-season
 * duplicate checks, excluding the row being edited.
 */
export async function updateRegistration(user: SessionUser, id: string, input: unknown) {
  if (!can(user, "access-admin-console")) {
    throw new ForbiddenError();
  }

  const data = adminRegistrationUpdateSchema.parse(input);

  const existing = await prisma.registration.findUnique({ where: { id } });
  if (!existing) {
    throw new RegistrationNotFoundError();
  }

  const [teamClash, emailClash] = await Promise.all([
    prisma.registration.findFirst({
      where: { seasonId: existing.seasonId, teamName: data.teamName, NOT: { id } },
    }),
    prisma.registration.findFirst({
      where: { seasonId: existing.seasonId, captainEmail: data.captainEmail, NOT: { id } },
    }),
  ]);
  if (teamClash) throw new DuplicateTeamNameError();
  if (emailClash) throw new DuplicateCaptainEmailError();

  const next = {
    teamName: data.teamName,
    captainName: data.captainName,
    captainEmail: data.captainEmail,
    captainMobile: data.captainMobile,
    // `?? null` so clearing a field actually clears it (undefined = "leave alone" to Prisma).
    viceCaptainName: data.viceCaptainName ?? null,
    viceCaptainEmail: data.viceCaptainEmail ?? null,
    viceCaptainMobile: data.viceCaptainMobile ?? null,
    feeTier: data.feeTier,
    marketingConsent: data.marketingConsent,
    status: data.status,
    feeStatus: data.feeStatus,
  };

  const changes = diffRecords(existing, next);
  if (Object.keys(changes).length === 0) {
    return existing;
  }

  // Update and audit entry commit together � no change without a log line.
  return prisma.$transaction(async (tx) => {
    const updated = await tx.registration.update({ where: { id }, data: next });
    await recordAudit(tx, user, {
      action: "registration.update",
      entityType: "Registration",
      entityId: id,
      summary: `edited registration "${updated.teamName}"`,
      changes,
    });
    return updated;
  });
}

/**
 * Builds an .xlsx workbook of every registration (same rows and order as
 * the admin table) for the committee to work with offline. Permission is
 * enforced by `listRegistrations`, so this is safe to call from any route.
 */
export async function exportRegistrationsToExcel(user: SessionUser): Promise<ArrayBuffer> {
  const registrations = await listRegistrations(user);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CIL Web";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Registrations", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Team", key: "teamName", width: 28 },
    { header: "Captain", key: "captainName", width: 24 },
    { header: "Captain Email", key: "captainEmail", width: 32 },
    { header: "Captain Mobile", key: "captainMobile", width: 16 },
    { header: "Vice Captain", key: "viceCaptainName", width: 24 },
    { header: "Vice Captain Email", key: "viceCaptainEmail", width: 32 },
    { header: "Vice Captain Mobile", key: "viceCaptainMobile", width: 18 },
    { header: "Season", key: "season", width: 20 },
    { header: "Status", key: "status", width: 14 },
    { header: "Fee Tier", key: "feeTier", width: 18 },
    { header: "Fee Status", key: "feeStatus", width: 12 },
    { header: "Marketing Consent", key: "marketingConsent", width: 18 },
    { header: "Submitted", key: "createdAt", width: 20, style: { numFmt: "yyyy-mm-dd hh:mm" } },
  ];

  for (const r of registrations) {
    sheet.addRow({
      teamName: r.teamName,
      captainName: r.captainName,
      captainEmail: r.captainEmail,
      // Stored as text so Excel doesn't strip leading zeros or `+`.
      captainMobile: r.captainMobile,
      viceCaptainName: r.viceCaptainName ?? "",
      viceCaptainEmail: r.viceCaptainEmail ?? "",
      viceCaptainMobile: r.viceCaptainMobile ?? "",
      season: r.season.name,
      status: r.status,
      feeTier: FEE_TIER_LABEL[r.feeTier],
      feeStatus: r.feeStatus,
      marketingConsent: r.marketingConsent ? "Yes" : "No",
      createdAt: r.createdAt,
    });
  }

  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };

  return workbook.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}
