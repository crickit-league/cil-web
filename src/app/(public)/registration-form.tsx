"use client";

import { useActionState } from "react";
import { submitRegistrationAction, type RegistrationFormState } from "./actions";

const initialState: RegistrationFormState = { status: "idle" };

function Field({
  id,
  label,
  type = "text",
  placeholder,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        required
        className="border-line text-chalk placeholder:text-chalk-faint focus:border-clay focus-visible:outline-gold border-0 border-b-[1.5px] bg-transparent px-0.5 py-2 text-[1.02rem] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      {error ? (
        <span id={`${id}-error`} className="text-clay-bright text-sm">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(submitRegistrationAction, initialState);

  if (state.status === "success") {
    return (
      <div className="border-line bg-dugout border p-8 text-center">
        <p className="font-display text-2xl font-extrabold uppercase">You&rsquo;re on the card.</p>
        <p className="text-chalk-dim mt-2">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="border-line bg-dugout border p-6 sm:p-9" noValidate>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field
          id="teamName"
          label="Team Name"
          placeholder="e.g. Peachtree Panthers"
          error={state.fieldErrors?.teamName}
        />
        <Field
          id="captainFirstName"
          label="Captain First Name"
          placeholder="First name"
          error={state.fieldErrors?.captainFirstName}
        />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field
          id="captainLastName"
          label="Captain Last Name"
          placeholder="Last name"
          error={state.fieldErrors?.captainLastName}
        />
        <Field
          id="captainMobile"
          label="Mobile Number"
          type="tel"
          placeholder="(404) 555-0142"
          error={state.fieldErrors?.captainMobile}
        />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6">
        <Field
          id="captainEmail"
          label="Email Address"
          type="email"
          placeholder="captain@email.com"
          error={state.fieldErrors?.captainEmail}
        />
      </div>

      {state.status === "error" && state.message ? (
        <p role="alert" className="text-clay-bright mt-6 text-sm">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="font-data border-clay bg-clay text-chalk hover:border-clay-bright hover:bg-clay-bright mt-8 w-full border px-5 py-4 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit Registration"}
      </button>
    </form>
  );
}
