import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminNav, type AdminNavItem } from "./admin-nav";

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

  // Sections are listed here so adding one is a one-line change. Super Admin
  // is hidden from plain admins; its page re-checks the permission itself.
  const navItems: AdminNavItem[] = [
    { href: "/admin/registrations", label: "Registration", icon: "registration" },
  ];
  navItems.push({ href: "/admin/activity", label: "Activity", icon: "activity" });
  if (can(session.user, "manage-admins")) {
    navItems.push({ href: "/admin/super-admin", label: "Super Admin", icon: "super-admin" });
  }

  return (
    <>
      <SiteHeader />
      <main className="w-full flex-1 px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <AdminNav items={navItems} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
