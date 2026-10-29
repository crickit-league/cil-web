"use client";

import { useState, useTransition } from "react";
import { setUmpireEntryLockedAction } from "./actions";

/** Series-wide switch for the public umpire form. Admins can still edit umpires while it's closed. */
export function UmpireEntryLock({ locked }: { locked: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="border-line bg-dugout flex flex-col gap-3 border p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-xl font-extrabold tracking-wide uppercase">Public umpire entry</h2>
        <p className="text-chalk-dim mt-1 text-sm">
          {locked
            ? "Closed — the public fixture pages say so, and only admins can change umpires."
            : "Open — anyone can enter or change umpires on upcoming fixtures, no sign-in needed."}
        </p>
        {error ? (
          <p role="alert" className="text-clay-bright mt-1 text-sm">
            {error}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await setUmpireEntryLockedAction(!locked);
            if (!result.ok) setError(result.message);
          });
        }}
        className={`font-data shrink-0 self-start border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:opacity-60 sm:self-auto ${
          locked
            ? "border-clay bg-clay text-on-accent hover:bg-clay-bright"
            : "border-clay text-clay hover:bg-clay hover:text-on-accent"
        }`}
      >
        {pending ? "Saving…" : locked ? "Open entry" : "Close entry"}
      </button>
    </div>
  );
}
