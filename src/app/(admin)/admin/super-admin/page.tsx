import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { listAdminAccounts } from "@/lib/services/admins";
import { AdminManagement } from "./admin-management";

export default async function SuperAdminPage() {
  const session = await auth();
  // The nav hides this tab from plain admins, but that's cosmetic — enforce here.
  if (!can(session!.user, "manage-admins")) {
    redirect("/admin/registrations");
  }
  const admins = await listAdminAccounts(session!.user);

  return <AdminManagement admins={admins} currentUserId={session!.user.id} />;
}
