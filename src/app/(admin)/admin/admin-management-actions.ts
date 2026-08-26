"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { grantAdminRole, revokeAdminRole } from "@/lib/services/admins";

export type GrantAdminState = { status: "idle" | "error" | "success"; message?: string };

export async function grantAdminAction(
  _prev: GrantAdminState,
  formData: FormData,
): Promise<GrantAdminState> {
  const session = await auth();
  if (!session?.user) {
    return { status: "error", message: "You must be signed in." };
  }

  const email = formData.get("email");
  if (typeof email !== "string" || !email) {
    return { status: "error", message: "Enter an email address." };
  }

  try {
    await grantAdminRole(session.user, email);
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Something went wrong." };
  }

  revalidatePath("/admin");
  return { status: "success", message: `Granted admin access to ${email.toLowerCase()}.` };
}

export async function revokeAdminAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const userRoleId = formData.get("userRoleId");
  if (typeof userRoleId !== "string" || !userRoleId) return;

  try {
    await revokeAdminRole(session.user, userRoleId);
  } catch (error) {
    console.error("Failed to revoke admin role:", error);
  }

  revalidatePath("/admin");
}
