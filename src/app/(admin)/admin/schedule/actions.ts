"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { setUmpiringTeam } from "@/lib/services/schedule";
import { setUmpireEntryLocked } from "@/lib/services/umpire-nominations";
import {
  addUnmatchedImportTeams,
  commitScheduleImport,
  discardScheduleImport,
  mapImportTeamName,
  stageScheduleImport,
} from "@/lib/services/schedule-import";

export type ActionResult = { ok: true } | { ok: false; message: string };
export type UploadState = { status: "idle" } | { status: "error"; message: string };

function errorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Check the fields and try again.";
  return error instanceof Error ? error.message : "Something went wrong.";
}

function revalidateSchedule() {
  revalidatePath("/admin/schedule");
  revalidatePath("/admin/teams");
  revalidatePath("/admin/activity");
  revalidatePath("/league", "layout");
}

export async function uploadScheduleAction(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const session = await auth();
  if (!session?.user) return { status: "error", message: "You must be signed in." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose the CricClubs matches export (.xlsx) to upload." };
  }

  let runId: string;
  try {
    runId = await stageScheduleImport(session.user, { name: file.name, bytes: await file.arrayBuffer() });
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
  // Outside the try: redirect() works by throwing.
  redirect(`/admin/schedule/import/${runId}`);
}

export async function mapTeamNameAction(
  runId: string,
  rawName: string,
  target: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "You must be signed in." };
  try {
    await mapImportTeamName(session.user, runId, rawName, target);
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath(`/admin/schedule/import/${runId}`);
  revalidatePath("/admin/teams");
  return { ok: true };
}

export async function addAllUnmatchedTeamsAction(runId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "You must be signed in." };
  try {
    await addUnmatchedImportTeams(session.user, runId);
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidatePath(`/admin/schedule/import/${runId}`);
  revalidatePath("/admin/teams");
  return { ok: true };
}

export async function commitImportAction(runId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "You must be signed in." };

  let query: string;
  try {
    const s = await commitScheduleImport(session.user, runId);
    query = new URLSearchParams({
      imported: "1",
      created: String(s.created),
      updated: String(s.updated),
      cancelled: String(s.cancelled),
      conflicts: String(s.umpireConflicts),
    }).toString();
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidateSchedule();
  redirect(`/admin/schedule?${query}`);
}

export async function discardImportAction(runId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "You must be signed in." };
  try {
    await discardScheduleImport(session.user, runId);
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  redirect("/admin/schedule");
}

export async function setUmpiringTeamAction(matchId: string, teamEntryId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "You must be signed in." };
  try {
    await setUmpiringTeam(session.user, matchId, { teamEntryId });
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidateSchedule();
  return { ok: true };
}

export async function setUmpireEntryLockedAction(locked: boolean): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "You must be signed in." };
  try {
    await setUmpireEntryLocked(session.user, { locked });
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  revalidateSchedule();
  return { ok: true };
}
