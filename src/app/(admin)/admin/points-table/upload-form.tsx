"use client";

import { useActionState } from "react";
import { uploadPointsTableAction, type UploadState } from "./actions";

const initialState: UploadState = { status: "idle" };

export function UploadForm() {
  const [state, formAction, pending] = useActionState(uploadPointsTableAction, initialState);

  return (
    <form action={formAction} className="border-line bg-dugout flex flex-col gap-4 border p-5">
      <div>
        <h2 className="font-display text-xl font-extrabold tracking-wide uppercase">Upload from CricClubs</h2>
        <p className="text-chalk-dim mt-1 text-sm">
          Upload the series&apos; Points Table export (.csv). You&apos;ll see the table before it&apos;s
          published, and publishing replaces the one on the site.
        </p>
      </div>
      <input
        type="file"
        name="file"
        required
        accept=".csv,text/csv"
        className="text-chalk-dim file:font-data file:border-clay file:text-clay hover:file:bg-clay hover:file:text-on-accent w-full min-w-0 text-sm file:mr-4 file:border file:bg-transparent file:px-4 file:py-2 file:text-xs file:tracking-[0.08em] file:uppercase"
      />
      {state.status === "error" ? (
        <p role="alert" className="text-clay-bright text-sm">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="font-data border-clay bg-clay text-on-accent hover:border-clay-bright hover:bg-clay-bright self-start border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Reading…" : "Upload & Preview"}
      </button>
    </form>
  );
}
