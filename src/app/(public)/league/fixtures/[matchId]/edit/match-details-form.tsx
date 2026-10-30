"use client";

import { useActionState } from "react";
import { updateMatchInfoAction, type EditMatchState } from "./actions";

export type MatchDetailsOptions = {
  fields: { id: string; label: string }[];
  teams: { id: string; name: string }[];
};

export type MatchDetailsInitial = {
  /** "YYYY-MM-DD" in league time, or "" while the date is TBD. */
  date: string;
  /** "HH:mm" in league time, or "" while the time is TBD. */
  time: string;
  fieldId: string | null;
  umpiringTeamId: string | null;
  /** The two playing teams, who can't also umpire. */
  playingTeamIds: string[];
};

const initialState: EditMatchState = { status: "idle" };

const inputClass =
  "border-line bg-pitch text-chalk focus:border-clay w-full min-w-0 border px-3 py-2.5 text-sm outline-none";
const labelClass = "font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase";

/** Date, start time, field and umpiring team of one match. */
export function MatchDetailsForm({
  matchId,
  options,
  initial,
}: {
  matchId: string;
  options: MatchDetailsOptions;
  initial: MatchDetailsInitial;
}) {
  const [state, formAction, pending] = useActionState(
    updateMatchInfoAction.bind(null, matchId),
    initialState,
  );
  const umpiringChoices = options.teams.filter((t) => !initial.playingTeamIds.includes(t.id));
  // React resets the form after its action runs; remount the fields so they keep what was submitted.
  const fieldsKey = state.status === "idle" ? "idle" : `${state.status}-${state.at}`;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div key={fieldsKey} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Date</span>
          <input type="date" name="date" defaultValue={initial.date} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Start time</span>
          <input type="time" name="time" defaultValue={initial.time} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Field</span>
          <select name="fieldId" defaultValue={initial.fieldId ?? ""} className={inputClass}>
            <option value="">To be confirmed</option>
            {options.fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Umpiring team</span>
          <select name="umpiringTeamId" defaultValue={initial.umpiringTeamId ?? ""} className={inputClass}>
            <option value="">To be assigned</option>
            {umpiringChoices.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-chalk-faint text-xs">
        Clear the date for &ldquo;Date TBD&rdquo;, or keep the date and clear the time for &ldquo;Time
        TBD&rdquo; (Atlanta time). A later CricClubs schedule import overwrites the date, time and field; the
        umpiring team set here is kept.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="font-data border-clay bg-clay text-on-accent hover:border-clay-bright hover:bg-clay-bright border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save details"}
        </button>
        {state.status === "error" ? (
          <p role="alert" className="text-clay-bright text-sm">
            {state.message}
          </p>
        ) : null}
        {state.status === "saved" ? (
          <p role="status" className="text-clay text-sm">
            Saved.
          </p>
        ) : null}
      </div>
    </form>
  );
}
