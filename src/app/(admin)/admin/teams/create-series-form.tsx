"use client";

import { useActionState } from "react";
import { createSeriesAction, type CreateSeriesState } from "./actions";

const initialState: CreateSeriesState = { status: "idle" };

const inputClass =
  "border-line text-chalk placeholder:text-chalk-faint focus:border-clay border-0 border-b-[1.5px] bg-transparent px-0.5 py-2 text-[1.02rem] focus:outline-none";
const labelClass = "font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase";

export function CreateSeriesForm({ seasonName }: { seasonName: string }) {
  const [state, formAction, pending] = useActionState(createSeriesAction, initialState);

  return (
    <form action={formAction} className="border-line bg-dugout flex max-w-lg flex-col gap-5 border p-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-wide uppercase">Create the series</h2>
        <p className="text-chalk-dim mt-1 text-sm">
          The {seasonName} season doesn&apos;t have a series yet. Teams and pools hang off it.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="series-name" className={labelClass}>
          Series name
        </label>
        <input
          id="series-name"
          name="name"
          required
          defaultValue={`CIL Winter Championship ${seasonName}`}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="series-start" className={labelClass}>
          First match day
        </label>
        <input id="series-start" name="startDate" type="date" required className={inputClass} />
      </div>

      <p className="text-chalk-dim text-sm">
        Format: 15 overs a side, 10 players, 2 pools. Win 2, tie 1, no result 1.
      </p>

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
        {pending ? "Creating…" : "Create Series"}
      </button>
    </form>
  );
}
