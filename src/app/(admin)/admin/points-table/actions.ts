"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import {
  commitPointsTableImport,
  discardPointsTableImport,
  mapPointsTableTeamName,
  stagePointsTableImport,
} from "@/lib/services/points-table";

export type ActionResult = { ok: true } | { ok: false; message: string };
export type UploadState = { status: "idle" } | { status: "error"; message: string };

function errorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the file and try again.";
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function uploadPointsTableAction(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const session = await auth();
  if (!session?.user) return { status: "error", message: "You must be signed in." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose the CricClubs points table export (.csv) to upload." };
  }

  let runId: string;
  try {
    runId = await stagePointsTableImport(session.user, { name: file.name, bytes: await file.arrayBuffer() });
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
  // Outside the try: redirect() works by throwing.
  redirect(`/admin/points-table/import/${runId}`);
}

export async function publishPointsTableAction(runId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "You must be signed in." };
  try {
    await commitPointsTableImport(session.user, runId);
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath("/admin/points-table");
  revalidatePath("/admin/activity");
  revalidatePath("/league", "layout");
  redirect("/admin/points-table?published=1");
}

export async function discardPointsTableAction(runId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "You must be signed in." };
  try {
    await discardPointsTableImport(session.user, runId);
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  redirect("/admin/points-table");
}

export async function mapPointsTableTeamAction(
  runId: string,
  rawName: string,
  teamEntryId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "You must be signed in." };
  try {
    await mapPointsTableTeamName(session.user, runId, rawName, teamEntryId);
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath(`/admin/points-table/import/${runId}`);
  revalidatePath("/admin/activity");
  return { ok: true };
}
