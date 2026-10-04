"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { updateRegistration } from "@/lib/services/registrations";

export type UpdateRegistrationResult = { ok: true } | { ok: false; message: string };

export async function updateRegistrationAction(
  id: string,
  input: unknown,
): Promise<UpdateRegistrationResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "You must be signed in." };
  }

  try {
    await updateRegistration(session.user, id, input);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, message: error.issues[0]?.message ?? "Check the fields and try again." };
    }
    return { ok: false, message: error instanceof Error ? error.message : "Something went wrong." };
  }

  revalidatePath("/admin/registrations");
  return { ok: true };
}
