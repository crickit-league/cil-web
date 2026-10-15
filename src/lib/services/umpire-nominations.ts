import { prisma } from "@/lib/db/prisma";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";
import { diffRecords, recordAudit } from "@/lib/services/audit";
import { findCurrentSeries } from "@/lib/services/series";
import { MatchNotFoundError } from "@/lib/services/schedule";
import { normalizeName } from "@/lib/import/cricclubs-matches";
import { umpireEntryLockSchema, umpireNominationSchema } from "@/lib/validation/umpires";

// Umpire nominations: each fixture's umpiring team names two people (umpire 1
// and a backup) with phone numbers. The committee wants this open to anyone,
// no sign-in — in practice a rep of the umpiring team fills it in — with a
// series-wide admin lock. Names are public. Phone numbers are never returned
// by a page query: only revealUmpirePhones reads them, behind a button, which
// keeps them out of the HTML that scrapers fetch. That's anti-scraping, not
// access control — anyone can press the button.

export class UmpireEntryClosedError extends Error {
  constructor(message = "Umpire entry is closed. Contact the committee to make a change.") {
    super(message);
    this.name = "UmpireEntryClosedError";
  }
}

export class InvalidUmpireNominationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUmpireNominationError";
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
    if (phone) throw new InvalidUmpireNominationError(`${label}: enter a name for that phone number.`);
    return { name: null, phone: null };
  }
  const samePerson = saved.name !== null && normalizeName(saved.name) === normalizeName(name);
  const resolved = phone ?? (samePerson ? saved.phone : null);
  if (!resolved) {
    throw new InvalidUmpireNominationError(
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

/**
 * Saves the umpires for a match. `actor` is null for the public form. Anyone
 * may save while the series' umpire entry is open and the match is still to
 * be played; admins may save at any time.
 */
export async function saveUmpireNomination(actor: SessionUser | null, matchId: string, input: unknown) {
  const isAdmin = can(actor, "manage-league");
  const data = umpireNominationSchema.parse(input);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      status: true,
      series: { select: { umpireEntryLocked: true } },
      teamOne: { select: { displayName: true } },
      teamTwo: { select: { displayName: true } },
      umpireNomination: true,
    },
  });
  if (!match || match.status === "CANCELLED") throw new MatchNotFoundError();

  if (!isAdmin) {
    if (match.series.umpireEntryLocked) throw new UmpireEntryClosedError();
    if (match.status !== "SCHEDULED") {
      throw new UmpireEntryClosedError("This match has been played, so its umpires can't be changed here.");
    }
  }

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
    throw new InvalidUmpireNominationError("Fill in Umpire 1 before the backup umpire.");
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
      summary: `${actor ? "" : "(public form) "}updated the umpires for ${label}`,
      changes,
    });
  });
}

/**
 * The one read that returns umpire phone numbers. Deliberately no permission
 * check (see the note at the top of this file) — callers are the "Show umpire
 * numbers" button and the admin pages.
 */
export async function revealUmpirePhones(matchId: string) {
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
  const n = match.umpireNomination;
  const slot = (name: string | null | undefined, phone: string | null | undefined) =>
    name && phone ? { name, phone } : null;
  return {
    umpireOne: slot(n?.umpireOneName, n?.umpireOnePhone),
    umpireTwo: slot(n?.umpireTwoName, n?.umpireTwoPhone),
  };
}

/** Opens or closes public umpire entry for the current series. Admins can still edit while it's closed. */
export async function setUmpireEntryLocked(user: SessionUser, input: unknown) {
  if (!can(user, "manage-league")) throw new ForbiddenError();
  const { locked } = umpireEntryLockSchema.parse(input);

  const { series } = await findCurrentSeries();
  if (!series) throw new InvalidUmpireNominationError("There's no current series.");
  if (series.umpireEntryLocked === locked) return;

  await prisma.$transaction(async (tx) => {
    await tx.series.update({ where: { id: series.id }, data: { umpireEntryLocked: locked } });
    await recordAudit(tx, user, {
      action: locked ? "series.lockUmpireEntry" : "series.unlockUmpireEntry",
      entityType: "Series",
      entityId: series.id,
      summary: `${locked ? "closed" : "opened"} public umpire entry for "${series.name}"`,
      changes: { umpireEntryLocked: [series.umpireEntryLocked, locked] },
    });
  });
}
