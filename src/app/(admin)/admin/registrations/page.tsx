import { auth } from "@/lib/auth";
import { listRegistrations } from "@/lib/services/registrations";
import { FEE_TIER_LABEL } from "@/lib/registrations/labels";

export default async function RegistrationsPage() {
  const session = await auth();
  const registrations = await listRegistrations(session!.user);

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Registrations</h1>
          <p className="text-chalk-dim mt-1 text-sm">
            {registrations.length} submission{registrations.length === 1 ? "" : "s"} received.
          </p>
        </div>
        {registrations.length > 0 ? (
          // Plain link, not <Link>: this is a file download from a route
          // handler, not a client-side navigation.
          <a
            href="/admin/registrations/export"
            download
            className="font-data border-clay text-clay hover:bg-clay hover:text-pitch-deep inline-flex items-center justify-center self-start border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors sm:self-auto"
          >
            Download Excel
          </a>
        ) : null}
      </div>

      {registrations.length === 0 ? (
        <p className="text-chalk-dim">No registrations yet.</p>
      ) : (
        <>
          {/* Cards below `sm` — a wide table doesn't fit a phone. See docs/architecture.md §13. */}
          <div className="flex flex-col gap-4 sm:hidden">
            {registrations.map((r) => (
              <div key={r.id} className="border-line bg-dugout border p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-display text-lg leading-tight font-extrabold uppercase">
                    {r.teamName}
                  </span>
                  <span className="font-data text-chalk-dim shrink-0 text-[0.65rem] tracking-[0.08em] uppercase">
                    {r.status}
                  </span>
                </div>
                <dl className="font-data mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                  <dt className="text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase">Captain</dt>
                  <dd>{r.captainName}</dd>
                  <dt className="text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase">Email</dt>
                  <dd className="truncate">{r.captainEmail}</dd>
                  <dt className="text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase">Mobile</dt>
                  <dd>{r.captainMobile}</dd>
                  <dt className="text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase">Vice Captain</dt>
                  <dd>{r.viceCaptainName ?? "—"}</dd>
                  <dt className="text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase">Email</dt>
                  <dd className="truncate">{r.viceCaptainEmail ?? "—"}</dd>
                  <dt className="text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase">Mobile</dt>
                  <dd>{r.viceCaptainMobile ?? "—"}</dd>
                  <dt className="text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase">Season</dt>
                  <dd>{r.season.name}</dd>
                  <dt className="text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase">Fee Tier</dt>
                  <dd>{FEE_TIER_LABEL[r.feeTier]}</dd>
                  <dt className="text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase">Fee Status</dt>
                  <dd>{r.feeStatus}</dd>
                  <dt className="text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase">Marketing</dt>
                  <dd>{r.marketingConsent ? "Yes" : "No"}</dd>
                  <dt className="text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase">Submitted</dt>
                  <dd>{r.createdAt.toLocaleDateString()}</dd>
                </dl>
              </div>
            ))}
          </div>

          {/* Table at `sm` and up. */}
          <div className="border-line hidden overflow-x-auto border sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="font-data border-line text-chalk-dim border-b text-[0.68rem] tracking-[0.1em] uppercase">
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Captain</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Vice Captain</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Season</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Fee Tier</th>
                  <th className="px-4 py-3">Fee Status</th>
                  <th className="px-4 py-3">Marketing</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <tr key={r.id} className="border-line border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{r.teamName}</td>
                    <td className="px-4 py-3">{r.captainName}</td>
                    <td className="px-4 py-3">{r.captainEmail}</td>
                    <td className="px-4 py-3">{r.captainMobile}</td>
                    <td className="px-4 py-3">{r.viceCaptainName ?? "—"}</td>
                    <td className="px-4 py-3">{r.viceCaptainEmail ?? "—"}</td>
                    <td className="px-4 py-3">{r.viceCaptainMobile ?? "—"}</td>
                    <td className="px-4 py-3">{r.season.name}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">{FEE_TIER_LABEL[r.feeTier]}</td>
                    <td className="px-4 py-3">{r.feeStatus}</td>
                    <td className="px-4 py-3">{r.marketingConsent ? "Yes" : "No"}</td>
                    <td className="text-chalk-dim px-4 py-3">{r.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
