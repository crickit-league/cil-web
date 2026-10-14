"use client";

import { useActionState } from "react";
import { uploadScheduleAction, type UploadState } from "./actions";

const initialState: UploadState = { status: "idle" };

export function UploadForm() {
  const [state, formAction, pending] = useActionState(uploadScheduleAction, initialState);

  return (
    <form action={formAction} className="border-line bg-dugout flex flex-col gap-4 border p-5">
      <div>
        <h2 className="font-display text-xl font-extrabold tracking-wide uppercase">Import from CricClubs</h2>
        <p className="text-chalk-dim mt-1 text-sm">
          Upload the series&apos; Matches export (.xlsx). You&apos;ll see every change before anything is
          saved, and no emails are sent.
        </p>
      </div>
      <input
        type="file"
        name="file"
        required
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="text-chalk-dim file:font-data file:border-clay file:text-clay hover:file:bg-clay hover:file:text-pitch-deep w-full min-w-0 text-sm file:mr-4 file:border file:bg-transparent file:px-4 file:py-2 file:text-xs file:tracking-[0.08em] file:uppercase"
      />
      {state.status === "error" ? (
        <p role="alert" className="text-clay-bright text-sm">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="font-data border-clay bg-clay text-pitch-deep hover:border-clay-bright hover:bg-clay-bright self-start border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Reading…" : "Upload & Preview"}
      </button>
    </form>
  );
}
