"use client";

import { useActionState, useEffect, useRef } from "react";
import { Pencil } from "lucide-react";
import { updateMatchInfoAction, type EditMatchState } from "./actions";

// The admin-only pencil on a fixture card: opens a dialog to change the match's
// date, start time, field and umpiring team. Rendered only for admins (the
// parent checks), and the server action / service check the role again.

export type EditMatchOptions = {
  fields: { id: string; label: string }[];
  teams: { id: string; name: string }[];
};

export type EditMatchInitial = {
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

export function EditMatchButton({
  matchId,
  title,
  options,
  initial,
}: {
  matchId: string;
  /** "Team A v Team B", for the dialog heading and the button's label. */
  title: string;
  options: EditMatchOptions;
  initial: EditMatchInitial;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(
    updateMatchInfoAction.bind(null, matchId),
    initialState,
  );
  const closedAt = useRef<number | null>(null);

  useEffect(() => {
    if (state.status === "saved" && closedAt.current !== state.at) {
      closedAt.current = state.at;
      dialogRef.current?.close();
    }
  }, [state]);

  const umpiringChoices = options.teams.filter((t) => !initial.playingTeamIds.includes(t.id));
  // React resets the form after its action runs; remount the fields so they show the saved values.
  const fieldsKey = state.status === "idle" ? "idle" : `${state.status}-${state.at}`;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Edit match: ${title}`}
        title="Edit match (admin)"
        className="text-chalk-faint hover:text-clay-bright -my-1 flex h-7 w-7 items-center justify-center rounded transition-colors"
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </button>

      <dialog
        ref={dialogRef}
        aria-label={`Edit match: ${title}`}
        className="border-line bg-dugout text-chalk m-auto w-[min(32rem,calc(100vw-2rem))] border p-0 backdrop:bg-black/60"
        onClick={(event) => {
          // A click on the backdrop (the dialog element itself) closes it.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <form action={formAction} className="flex flex-col gap-5 p-5 sm:p-6">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-wide uppercase">Edit match</h2>
            <p className="text-chalk-dim mt-1 text-sm">{title}</p>
          </div>

          <div key={fieldsKey} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Date</span>
                <input type="date" name="date" defaultValue={initial.date} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Start time</span>
                <input type="time" name="time" defaultValue={initial.time} className={inputClass} />
              </label>
            </div>
            <p className="text-chalk-faint -mt-2 text-xs">
              Clear the date for &ldquo;Date TBD&rdquo;. Keep the date and clear the time for &ldquo;Time
              TBD&rdquo;. Atlanta time.
            </p>

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
              <select
                name="umpiringTeamId"
                defaultValue={initial.umpiringTeamId ?? ""}
                className={inputClass}
              >
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
            A later CricClubs schedule import overwrites the date, time and field from its file. The umpiring
            team set here is kept.
          </p>

          {state.status === "error" ? (
            <p role="alert" className="text-clay-bright text-sm">
              {state.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className="font-data border-clay bg-clay text-on-accent hover:border-clay-bright hover:bg-clay-bright border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => dialogRef.current?.close()}
              className="font-data border-line text-chalk-dim hover:border-clay hover:text-chalk border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
