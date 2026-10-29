"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import {
  addRegistrationsToSeries,
  createSeries,
  setTeamPool,
  type AddTeamsResult,
} from "@/lib/services/series";
import { renameTeam } from "@/lib/services/teams";

export type ActionResult = { ok: true } | { ok: false; message: string };
export type CreateSeriesState = { status: "idle" } | { status: "error"; message: string };

function errorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Check the fields and try again.";
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

function revalidateLeague() {
  revalidatePath("/admin/teams");
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/activity");
  revalidatePath("/league", "layout");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin/points-table");
}

export async function createSeriesAction(
  _prev: CreateSeriesState,
  formData: FormData,
): Promise<CreateSeriesState> {
  const session = await auth();
  if (!session?.user) {
    return { status: "error", message: "You must be signed in." };
  }

  try {
    await createSeries(session.user, {
      name: formData.get("name"),
      startDate: formData.get("startDate"),
    });
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }

  revalidateLeague();
  return { status: "idle" };
}

export async function addRegistrationsAction(
  seriesId: string,
): Promise<{ ok: true; result: AddTeamsResult } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "You must be signed in." };
  }

  try {
    const result = await addRegistrationsToSeries(session.user, seriesId);
    revalidateLeague();
    return { ok: true, result };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function setPoolAction(teamEntryId: string, pool: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "You must be signed in." };
  }

  try {
    await setTeamPool(session.user, teamEntryId, { pool });
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }

  revalidateLeague();
  return { ok: true };
}

export async function renameTeamAction(teamEntryId: string, name: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "You must be signed in." };
  }

  try {
    await renameTeam(session.user, teamEntryId, { name });
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }

  revalidateLeague();
  return { ok: true };
}
