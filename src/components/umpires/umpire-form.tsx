"use client";

import { useActionState } from "react";
import { saveUmpiresAction, type UmpireFormState } from "./actions";
import { PhoneInput } from "./phone-input";

const initialState: UmpireFormState = { status: "idle" };

const inputClass =
  "border-line bg-pitch text-chalk focus:border-clay w-full min-w-0 border px-3 py-2.5 text-sm outline-none placeholder:text-chalk-faint";
const labelClass = "font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase";

function Slot({
  n,
  title,
  name,
  phone,
  hasSavedName,
}: {
  n: "One" | "Two";
  title: string;
  name: string;
  phone: string;
  hasSavedName: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-display mb-2 text-lg font-extrabold tracking-wide uppercase">{title}</legend>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Name</span>
        <input
          name={`umpire${n}Name`}
          defaultValue={name}
          autoComplete="off"
          maxLength={80}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Phone</span>
        {/* Never pre-filled with a saved number — those stay out of the page.
            Only what was just typed comes back, after a failed save. */}
        <PhoneInput
          name={`umpire${n}Phone`}
          defaultValue={phone}
          placeholder={hasSavedName ? "Leave blank to keep the saved number" : "(404) 555-0123"}
          className={inputClass}
        />
      </label>
    </fieldset>
  );
}

/**
 * Umpire 1 + backup umpire for one match. Shows saved names (public) but
 * never saved numbers; a blank phone keeps the saved one for the same name.
 */
export function UmpireForm({
  matchId,
  umpireOneName,
  umpireTwoName,
}: {
  matchId: string;
  umpireOneName: string | null;
  umpireTwoName: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveUmpiresAction.bind(null, matchId), initialState);
  // React resets a form after its action runs; after an error, remount the
  // fields with what was typed so nothing is lost.
  const typed = state.status === "error" ? state.values : null;
  const fieldsKey = state.status === "idle" ? "idle" : `${state.status}-${state.at}`;

  return (
    // Container query, not a viewport one: the admin schedule puts this in a narrow table cell.
    <form action={formAction} className="@container flex flex-col gap-6">
      <div key={fieldsKey} className="grid gap-6 @lg:grid-cols-2">
        <Slot
          n="One"
          title="Umpire 1"
          name={typed?.umpireOneName ?? umpireOneName ?? ""}
          phone={typed?.umpireOnePhone ?? ""}
          hasSavedName={Boolean(umpireOneName)}
        />
        <Slot
          n="Two"
          title="Umpire 2 (backup)"
          name={typed?.umpireTwoName ?? umpireTwoName ?? ""}
          phone={typed?.umpireTwoPhone ?? ""}
          hasSavedName={Boolean(umpireTwoName)}
        />
      </div>
      <p className="text-chalk-faint text-xs">
        Names are shown publicly next to the fixture. Phone numbers are only shown to someone who presses
        &ldquo;Show umpire numbers&rdquo;. To remove an umpire, clear their name.
      </p>
      {state.status === "error" ? (
        <p role="alert" className="text-clay-bright text-sm">
          {state.message}
        </p>
      ) : null}
      {state.status === "saved" ? (
        <p role="status" className="text-gold text-sm">
          Saved.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="font-data border-clay bg-clay text-pitch-deep hover:border-clay-bright hover:bg-clay-bright self-start border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save umpires"}
      </button>
    </form>
  );
}
