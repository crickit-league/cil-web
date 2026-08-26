import { auth } from "@/lib/auth";
import { listRegistrations } from "@/lib/services/registrations";

export default async function AdminDashboardPage() {
  const session = await auth();
  const registrations = await listRegistrations(session!.user);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Registrations</h1>
        <p className="text-chalk-dim mt-1 text-sm">
          {registrations.length} submission{registrations.length === 1 ? "" : "s"} received.
        </p>
      </div>

      {registrations.length === 0 ? (
        <p className="text-chalk-dim">No registrations yet.</p>
      ) : (
        <div className="border-line overflow-x-auto border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="font-data border-line text-chalk-dim border-b text-[0.68rem] tracking-[0.1em] uppercase">
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Captain</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Season</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-line border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{r.teamName}</td>
                  <td className="px-4 py-3">
                    {r.captainFirstName} {r.captainLastName}
                  </td>
                  <td className="px-4 py-3">{r.captainEmail}</td>
                  <td className="px-4 py-3">{r.captainMobile}</td>
                  <td className="px-4 py-3">{r.season.name}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">{r.feeStatus}</td>
                  <td className="text-chalk-dim px-4 py-3">{r.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
