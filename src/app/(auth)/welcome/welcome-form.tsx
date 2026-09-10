"use client";

import { useActionState, useEffect } from "react";
import { setDisplayNameAction, type SetNameState } from "./actions";

const initialState: SetNameState = { status: "idle" };

export function WelcomeForm() {
  const [state, formAction, pending] = useActionState(setDisplayNameAction, initialState);

  // Full reload rather than a client-side redirect: the header's session
  // state (via next-auth/react's SessionProvider) only refetches on window
  // focus or an interval, not on navigation, so a soft redirect here would
  // show the old (nameless) state until the next focus event.
  useEffect(() => {
    if (state.status === "success") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload is the point, see comment above
      window.location.href = "/";
    }
  }, [state.status]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="name" className="font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase">
        Name
      </label>
      <input
        id="name"
        name="name"
        type="text"
        required
        autoComplete="name"
        placeholder="Your name"
        className="border-line text-chalk placeholder:text-chalk-faint focus:border-clay border-0 border-b-[1.5px] bg-transparent px-0.5 py-2 text-[1.02rem] focus:outline-none"
      />
      {state.status === "error" ? (
        <p role="alert" className="text-clay-bright text-sm">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="font-data border-clay bg-clay text-pitch-deep hover:border-clay-bright hover:bg-clay-bright mt-4 border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
