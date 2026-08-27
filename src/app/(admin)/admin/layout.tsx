import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Gate the entire admin console here rather than per-page, per CLAUDE.md:
// "never rely on a hidden UI button." Every request under /admin re-runs
// this check server-side. Uses the same header/footer as the rest of the
// site — the admin console is a section of it, not a separate app.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!can(session.user, "access-admin-console")) {
    redirect("/");
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1180px] flex-1 px-5 py-8 sm:px-8">{children}</main>
      <SiteFooter />
    </>
  );
}
