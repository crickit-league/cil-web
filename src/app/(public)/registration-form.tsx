"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { submitRegistrationAction, type RegistrationFormState } from "./actions";

const initialState: RegistrationFormState = { status: "idle" };

// Formats digits as the user types into a US-style "(404) 555-0142" mask.
function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  error,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  error?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
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
        value={value}
        onChange={onChange}
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
  const [mobile, setMobile] = useState("");

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
      <div className="grid grid-cols-1 gap-6">
        <Field
          id="teamName"
          label="Team Name"
          placeholder="e.g. Peachtree Panthers"
          error={state.fieldErrors?.teamName}
        />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field
          id="captainFirstName"
          label="Captain First Name"
          placeholder="First name"
          error={state.fieldErrors?.captainFirstName}
        />
        <Field
          id="captainLastName"
          label="Captain Last Name"
          placeholder="Last name"
          error={state.fieldErrors?.captainLastName}
        />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field
          id="captainMobile"
          label="Mobile Number"
          type="tel"
          placeholder="(404) 555-0142"
          error={state.fieldErrors?.captainMobile}
          value={mobile}
          onChange={(event) => setMobile(formatPhoneInput(event.target.value))}
        />
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
