"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { revealUmpirePhones, saveUmpireNomination } from "@/lib/services/umpire-nominations";

// Used by both the public fixture page (no sign-in) and the admin schedule.
// The service decides what the caller may do: admins can edit while public
// entry is locked, everyone else can't.

export type UmpireFormState =
  | { status: "idle" }
  | { status: "saved"; at: number }
  // `values` is what was typed, so the form can put it back after React resets it.
  | { status: "error"; message: string; values: Record<string, string>; at: number };

export type RevealResult =
  | {
      ok: true;
      umpireOne: { name: string; phone: string } | null;
      umpireTwo: { name: string; phone: string } | null;
    }
  | { ok: false; message: string };

function errorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the fields and try again.";
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function saveUmpiresAction(
  matchId: string,
  _prev: UmpireFormState,
  formData: FormData,
): Promise<UmpireFormState> {
  const session = await auth();
  const field = (key: string) => String(formData.get(key) ?? "");
  const values = {
    umpireOneName: field("umpireOneName"),
    umpireOnePhone: field("umpireOnePhone"),
    umpireTwoName: field("umpireTwoName"),
    umpireTwoPhone: field("umpireTwoPhone"),
  };
  try {
    await saveUmpireNomination(session?.user ?? null, matchId, values);
  } catch (error) {
    return { status: "error", message: errorMessage(error), values, at: Date.now() };
  }
  revalidatePath("/league", "layout");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin/activity");
  return { status: "saved", at: Date.now() };
}

export async function revealUmpirePhonesAction(matchId: string): Promise<RevealResult> {
  try {
    const session = await auth();
    return { ok: true, ...(await revealUmpirePhones(session?.user ?? null, matchId)) };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}
