import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";

// Gate the entire admin console here rather than per-page, per CLAUDE.md:
// "never rely on a hidden UI button." Every request under /admin re-runs
// this check server-side.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user, "access-admin-console")) {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <header className="border-line bg-dugout border-b">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/admin" className="font-display text-lg font-extrabold tracking-wide uppercase">
            Admin Console
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-data text-chalk-dim text-xs">{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="font-data text-chalk-dim hover:text-chalk border-line border px-3 py-1.5 text-xs tracking-[0.08em] uppercase transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
