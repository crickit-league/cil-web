"use server";

import { auth } from "@/lib/auth";
import { setDisplayName } from "@/lib/services/users";
import { displayNameSchema } from "@/lib/validation/user";

export type SetNameState = { status: "idle" | "error" | "success"; message?: string };

export async function setDisplayNameAction(
  _prev: SetNameState,
  formData: FormData,
): Promise<SetNameState> {
  const session = await auth();
  if (!session?.user) {
    return { status: "error", message: "You must be signed in." };
  }

  const parsed = displayNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Enter a valid name." };
  }

  await setDisplayName(session.user.id, parsed.data.name);
  return { status: "success" };
}
