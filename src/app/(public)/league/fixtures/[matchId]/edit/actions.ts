"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { updateMatchInfo } from "@/lib/services/schedule";

// Admin-only. The service re-checks the role, so hiding the gear icon from
// everyone else is a convenience, not the gate.

export type EditMatchState =
  { status: "idle" } | { status: "saved"; at: number } | { status: "error"; message: string; at: number };

function errorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the fields and try again.";
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function updateMatchInfoAction(
  matchId: string,
  _prev: EditMatchState,
  formData: FormData,
): Promise<EditMatchState> {
  const session = await auth();
  if (!session?.user) return { status: "error", message: "You must be signed in.", at: Date.now() };
  const field = (key: string) => String(formData.get(key) ?? "");
  try {
    await updateMatchInfo(session.user, matchId, {
      date: field("date"),
      time: field("time"),
      fieldId: field("fieldId"),
      umpiringTeamId: field("umpiringTeamId"),
    });
  } catch (error) {
    return { status: "error", message: errorMessage(error), at: Date.now() };
  }
  revalidatePath("/", "layout");
  return { status: "saved", at: Date.now() };
}
