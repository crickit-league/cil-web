import { prisma } from "@/lib/db/prisma";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { diffRecords, recordAudit } from "@/lib/services/audit";
import { MatchNotFoundError } from "@/lib/services/schedule";
import { normalizeName } from "@/lib/import/cricclubs-matches";
import { umpireAssignmentSchema } from "@/lib/validation/umpires";

// Umpire assignments: an admin assigns two people (Umpire 1 and Umpire 2), with
// phone numbers, to each fixture. It is an admin-only action (it was open to
// anyone until 2026-11-01). Names are public. Phone numbers are never returned
// by a page query: only revealUmpirePhones reads them, behind a button, which
// keeps them out of the HTML that scrapers fetch. That's anti-scraping, not
// access control — anyone can press the button (for a match still to be played).

export class UmpireEntryClosedError extends Error {
  constructor(message = "Umpire entry is closed. Contact the committee to make a change.") {
    super(message);
    this.name = "UmpireEntryClosedError";
  }
}

export class InvalidUmpireAssignmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUmpireAssignmentError";
  }
}

type Slot = { name: string | null; phone: string | null };

/**
 * Works out one umpire slot from the form. The form never shows a saved
 * number, so a blank phone keeps the saved one — but only while the name is
 * the same person; a new name needs its own number.
 */
function resolveSlot(label: string, name: string, phone: string | null, saved: Slot): Slot {
  if (!name) {
    if (phone) throw new InvalidUmpireAssignmentError(`${label}: enter a name for that phone number.`);
    return { name: null, phone: null };
  }
  const samePerson = saved.name !== null && normalizeName(saved.name) === normalizeName(name);
  const resolved = phone ?? (samePerson ? saved.phone : null);
  if (!resolved) {
    throw new InvalidUmpireAssignmentError(
      samePerson || saved.name === null
        ? `${label}: enter a phone number.`
        : `${label}: enter a phone number for ${name} (the saved number belongs to ${saved.name}).`,
    );
  }
  return { name, phone: resolved };
}

/** "4045550123" → "(•••) •••-0123", so the audit log records that a number changed without storing it again. */
function maskPhone(phone: string | null) {
  return phone ? `(•••) •••-${phone.slice(-4)}` : null;
}

/** Saves the umpires assigned to a match. Admins only, at any time (before or after the match). */
export async function saveUmpireAssignment(actor: SessionUser | null, matchId: string, input: unknown) {
  if (!can(actor, "edit-umpires")) throw new ForbiddenError();
  const data = umpireAssignmentSchema.parse(input);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      status: true,
      teamOne: { select: { displayName: true } },
      teamTwo: { select: { displayName: true } },
      umpireNomination: true,
    },
  });
  if (!match || match.status === "CANCELLED") throw new MatchNotFoundError();

  const saved = match.umpireNomination;
  const one = resolveSlot("Umpire 1", data.umpireOneName, data.umpireOnePhone, {
    name: saved?.umpireOneName ?? null,
    phone: saved?.umpireOnePhone ?? null,
  });
  const two = resolveSlot("Umpire 2", data.umpireTwoName, data.umpireTwoPhone, {
    name: saved?.umpireTwoName ?? null,
    phone: saved?.umpireTwoPhone ?? null,
  });
  if (!one.name && two.name) {
    throw new InvalidUmpireAssignmentError("Fill in Umpire 1 before Umpire 2.");
  }

  const next = {
    umpireOneName: one.name,
    umpireOnePhone: one.phone,
    umpireTwoName: two.name,
    umpireTwoPhone: two.phone,
  };
  const changes = diffRecords(
    {
      umpireOneName: saved?.umpireOneName ?? null,
      umpireOnePhone: maskPhone(saved?.umpireOnePhone ?? null),
      umpireTwoName: saved?.umpireTwoName ?? null,
      umpireTwoPhone: maskPhone(saved?.umpireTwoPhone ?? null),
    },
    {
      ...next,
      umpireOnePhone: maskPhone(next.umpireOnePhone),
      umpireTwoPhone: maskPhone(next.umpireTwoPhone),
    },
  );
  // A same-last-four number swap still counts as a change.
  const phonesChanged =
    (saved?.umpireOnePhone ?? null) !== next.umpireOnePhone ||
    (saved?.umpireTwoPhone ?? null) !== next.umpireTwoPhone;
  if (Object.keys(changes).length === 0 && !phonesChanged) return;

  const label = `${match.teamOne?.displayName ?? "TBD"} v ${match.teamTwo?.displayName ?? "TBD"}`;
  await prisma.$transaction(async (tx) => {
    const row = await tx.umpireNomination.upsert({
      where: { matchId },
      create: { matchId, ...next },
      update: next,
    });
    await recordAudit(tx, actor, {
      action: "match.setUmpires",
      entityType: "UmpireNomination",
      entityId: row.id,
      summary: `updated the umpires for ${label}`,
      changes,
    });
  });
}

/**
 * The one read that returns umpire phone numbers. No sign-in needed for a
 * match still to be played (see the note at the top of this file). Once it's
 * been played the numbers are no use to the public, so only admins get them —
 * the committee's call: played fixtures show umpire names only.
 */
export async function revealUmpirePhones(actor: SessionUser | null, matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      status: true,
      umpireNomination: {
        select: { umpireOneName: true, umpireOnePhone: true, umpireTwoName: true, umpireTwoPhone: true },
      },
    },
  });
  if (!match || match.status === "CANCELLED") throw new MatchNotFoundError();
  if (match.status !== "SCHEDULED" && !can(actor, "edit-umpires")) {
    throw new UmpireEntryClosedError("Umpire numbers are only shown for matches still to be played.");
  }
  const n = match.umpireNomination;
  const slot = (name: string | null | undefined, phone: string | null | undefined) =>
    name && phone ? { name, phone } : null;
  return {
    umpireOne: slot(n?.umpireOneName, n?.umpireOnePhone),
    umpireTwo: slot(n?.umpireTwoName, n?.umpireTwoPhone),
  };
}
