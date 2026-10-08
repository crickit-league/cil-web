import Link from "next/link";
import { auth } from "@/lib/auth";
import { listAuditLog, type AuditChanges, type AuditValue } from "@/lib/services/audit";

const FIELD_LABEL: Record<string, string> = {
  teamName: "Team",
  captainName: "Captain",
  captainEmail: "Captain email",
  captainMobile: "Captain mobile",
  viceCaptainName: "Vice captain",
  viceCaptainEmail: "Vice captain email",
  viceCaptainMobile: "Vice captain mobile",
  feeTier: "Fee tier",
  feeStatus: "Fee status",
  marketingConsent: "Marketing consent",
  status: "Status",
  role: "Role",
};

function formatValue(value: AuditValue) {
  if (value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

// Pinned to the league's timezone: server components render in UTC on Vercel.
function formatWhen(date: Date) {
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Changes({ changes }: { changes: AuditChanges | null }) {
  const entries = changes ? Object.entries(changes) : [];
  if (entries.length === 0) return <span className="text-chalk-dim">—</span>;
  return (
    <ul className="flex flex-col gap-1">
      {entries.map(([field, [from, to]]) => (
        <li key={field} className="break-words">
          <span className="text-chalk-dim">{FIELD_LABEL[field] ?? field}: </span>
          <span className="text-chalk-dim line-through">{formatValue(from)}</span>
          <span className="text-chalk-dim"> → </span>
          <span>{formatValue(to)}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const { entries, hasMore } = await listAuditLog(session!.user, page);

  const pagerClass =
    "font-data border-clay text-clay hover:bg-clay hover:text-pitch-deep inline-flex items-center border px-4 py-2 text-xs tracking-[0.08em] uppercase transition-colors";

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Activity</h1>
        <p className="text-chalk-dim mt-1 text-sm">
          A record of changes made in the admin console. Times are Eastern.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-chalk-dim">No activity recorded yet.</p>
      ) : (
        <>
          {/* Cards below `sm` — see docs/architecture.md §13. */}
          <div className="flex flex-col gap-4 sm:hidden">
            {entries.map((e) => (
              <div key={e.id} className="border-line bg-dugout border p-4">
                <div className="font-data text-chalk-dim text-[0.65rem] tracking-[0.08em] uppercase">
                  {formatWhen(e.createdAt)}
                </div>
                <p className="mt-2 text-sm break-words">
                  <span className="font-medium">{e.actorEmail}</span> {e.summary}
                </p>
                <div className="font-data mt-3 text-sm">
                  <Changes changes={e.changes} />
                </div>
              </div>
            ))}
          </div>

          <div className="border-line hidden overflow-x-auto border sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="font-data border-line text-chalk-dim border-b text-[0.68rem] tracking-[0.1em] uppercase">
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Changes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-line border-b align-top last:border-0">
                    <td className="text-chalk-dim px-4 py-3 whitespace-nowrap">{formatWhen(e.createdAt)}</td>
                    <td className="px-4 py-3">{e.actorEmail}</td>
                    <td className="px-4 py-3">{e.summary}</td>
                    <td className="px-4 py-3">
                      <Changes changes={e.changes} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {page > 1 || hasMore ? (
            <div className="flex gap-3">
              {page > 1 ? (
                <Link href={`/admin/activity?page=${page - 1}`} className={pagerClass}>
                  Newer
                </Link>
              ) : null}
              {hasMore ? (
                <Link href={`/admin/activity?page=${page + 1}`} className={pagerClass}>
                  Older
                </Link>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
