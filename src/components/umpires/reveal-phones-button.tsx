"use client";

import { useState, useTransition } from "react";
import { revealUmpirePhonesAction, type RevealResult } from "./actions";

type Revealed = Extract<RevealResult, { ok: true }>;

/**
 * Numbers are fetched only when pressed, so they're never in the page HTML
 * (anti-scraping, not access control). One press shows both umpires.
 */
export function RevealPhonesButton({ matchId }: { matchId: string }) {
  const [pending, startTransition] = useTransition();
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (revealed) {
    const rows = [
      { label: "Umpire 1", slot: revealed.umpireOne },
      { label: "Umpire 2", slot: revealed.umpireTwo },
    ].filter((r) => r.slot);
    if (rows.length === 0) return <p className="text-chalk-dim text-sm">No numbers saved yet.</p>;
    return (
      <ul className="flex flex-col gap-1 text-sm">
        {rows.map(({ label, slot }) => (
          <li key={label}>
            <span className="text-chalk-dim">{label}: </span>
            {slot!.name}{" "}
            <a
              href={`tel:+1${slot!.phone.replace(/\D/g, "")}`}
              className="font-data text-clay-bright underline-offset-2 hover:underline"
            >
              {slot!.phone}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await revealUmpirePhonesAction(matchId);
            if (result.ok) setRevealed(result);
            else setError(result.message);
          });
        }}
        className="font-data border-line text-chalk hover:border-clay self-start border px-3 py-2 text-[0.68rem] tracking-[0.08em] uppercase transition-colors disabled:opacity-60"
      >
        {pending ? "Loading…" : "Show umpire numbers"}
      </button>
      {error ? (
        <p role="alert" className="text-clay-bright text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
