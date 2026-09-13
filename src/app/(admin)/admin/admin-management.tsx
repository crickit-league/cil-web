"use client";

import { useActionState } from "react";
import { grantAdminAction, revokeAdminAction, type GrantAdminState } from "./admin-management-actions";

type AdminAccount = {
  userRoleId: string;
  userId: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "SUPER_ADMIN";
  grantedAt: Date;
};

const initialState: GrantAdminState = { status: "idle" };

function RevokeButton({ userRoleId }: { userRoleId: string }) {
  return (
    <form action={revokeAdminAction}>
      <input type="hidden" name="userRoleId" value={userRoleId} />
      <button
        type="submit"
        className="font-data text-clay-bright hover:text-clay-bright text-xs tracking-[0.08em] uppercase underline-offset-2 transition-colors hover:underline"
      >
        Revoke
      </button>
    </form>
  );
}

export function AdminManagement({
  admins,
  currentUserId,
}: {
  admins: AdminAccount[];
  currentUserId: string;
}) {
  const [state, formAction, pending] = useActionState(grantAdminAction, initialState);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-wide uppercase">Admins</h2>
        <p className="text-chalk-dim mt-1 text-sm">
          Grant or revoke admin access. Super admins are managed separately and aren&apos;t shown as revocable
          here.
        </p>
      </div>

      {/* Cards below `sm` — five columns don't fit a phone. See docs/architecture.md §13. */}
      <div className="flex flex-col gap-3 sm:hidden">
        {admins.map((admin) => (
          <div key={admin.userRoleId} className="border-line bg-dugout border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{admin.name || admin.email}</div>
                {admin.name ? <div className="text-chalk-dim text-sm">{admin.email}</div> : null}
              </div>
              <span className="font-data text-chalk-dim shrink-0 text-[0.62rem] tracking-[0.08em] uppercase">
                {admin.role}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-data text-chalk-dim text-[0.68rem] tracking-[0.05em] uppercase">
                Granted {admin.grantedAt.toLocaleDateString()}
              </span>
              {admin.role === "ADMIN" && admin.userId !== currentUserId ? (
                <RevokeButton userRoleId={admin.userRoleId} />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Table at `sm` and up. */}
      <div className="border-line hidden overflow-x-auto border sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="font-data border-line text-chalk-dim border-b text-[0.68rem] tracking-[0.1em] uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Granted</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.userRoleId} className="border-line border-b last:border-0">
                <td className="px-4 py-3">{admin.name || "—"}</td>
                <td className="px-4 py-3">{admin.email}</td>
                <td className="px-4 py-3">{admin.role}</td>
                <td className="text-chalk-dim px-4 py-3">{admin.grantedAt.toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {admin.role === "ADMIN" && admin.userId !== currentUserId ? (
                    <RevokeButton userRoleId={admin.userRoleId} />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={formAction} className="flex max-w-sm flex-col gap-3">
        <label
          htmlFor="admin-email"
          className="font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase"
        >
          Grant admin access
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          placeholder="teammate@example.com"
          className="border-line text-chalk placeholder:text-chalk-faint focus:border-clay border-0 border-b-[1.5px] bg-transparent px-0.5 py-2 text-[1.02rem] focus:outline-none"
        />
        {state.status === "error" ? (
          <p role="alert" className="text-clay-bright text-sm">
            {state.message}
          </p>
        ) : null}
        {state.status === "success" ? <p className="text-chalk-dim text-sm">{state.message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="font-data border-clay bg-clay text-pitch-deep hover:border-clay-bright hover:bg-clay-bright mt-2 border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Granting…" : "Grant Admin Access"}
        </button>
      </form>
    </section>
  );
}
