import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { can, ForbiddenError, type SessionUser } from "@/lib/auth/permissions";

export type AuditValue = string | number | boolean | null;
export type AuditChanges = Record<string, [AuditValue, AuditValue]>;

type AuditEntry = {
  /** Dotted verb, e.g. "registration.update". */
  action: string;
  entityType: string;
  entityId: string;
  /** Human-readable one-liner, e.g. `edited registration "Atlanta Strikers"`. */
  summary: string;
  changes?: AuditChanges;
};

/**
 * Compares two flat records and returns `{ field: [old, new] }` for just the
 * fields that differ. Only looks at keys of `after`, so pass exactly the
 * fields the action is allowed to change.
 */
export function diffRecords<A extends Record<string, AuditValue>>(
  before: { [K in keyof A]: AuditValue },
  after: A,
): AuditChanges {
  const changes: AuditChanges = {};
  for (const key of Object.keys(after)) {
    if (before[key] !== after[key]) {
      changes[key] = [before[key], after[key]];
    }
  }
  return changes;
}

/**
 * Appends an audit entry. Call it with the transaction client from the same
 * `prisma.$transaction` as the change being logged, so the two commit or roll
 * back together. Every admin action's service function should call this.
 */
export async function recordAudit(tx: Prisma.TransactionClient, actor: SessionUser, entry: AuditEntry) {
  await tx.auditLog.create({
    data: {
      actorUserId: actor.id,
      actorEmail: actor.email ?? "unknown",
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      summary: entry.summary,
      changes: entry.changes as Prisma.InputJsonValue | undefined,
    },
  });
}

const PAGE_SIZE = 100;

/** Newest first. Visible to every admin, per the committee's accountability goal. */
export async function listAuditLog(user: SessionUser, page = 1) {
  if (!can(user, "access-admin-console")) {
    throw new ForbiddenError();
  }

  const skip = (Math.max(1, page) - 1) * PAGE_SIZE;
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE + 1,
  });

  return {
    entries: rows.slice(0, PAGE_SIZE).map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      actorEmail: r.actorEmail,
      action: r.action,
      summary: r.summary,
      changes: (r.changes ?? null) as AuditChanges | null,
    })),
    hasMore: rows.length > PAGE_SIZE,
  };
}
