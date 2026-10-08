import { auth } from "@/lib/auth";
import { listRegistrations } from "@/lib/services/registrations";
import { RegistrationsTable } from "./registrations-table";

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
        <RegistrationsTable
          rows={registrations.map((r) => ({
            id: r.id,
            teamName: r.teamName,
            captainName: r.captainName,
            captainEmail: r.captainEmail,
            captainMobile: r.captainMobile,
            viceCaptainName: r.viceCaptainName,
            viceCaptainEmail: r.viceCaptainEmail,
            viceCaptainMobile: r.viceCaptainMobile,
            seasonName: r.season.name,
            status: r.status,
            feeTier: r.feeTier,
            feeStatus: r.feeStatus,
            marketingConsent: r.marketingConsent,
            submitted: r.createdAt.toLocaleDateString(),
            submittedAt: r.createdAt.toISOString(),
          }))}
        />
      )}
    </section>
  );
}
