"use client";

import { useState, useTransition } from "react";
import { formatPhone } from "@/lib/phone";
import { revealUmpirePhonesAction, type RevealResult } from "./actions";

export type RevealedPhones = Extract<RevealResult, { ok: true }>;

/**
 * Numbers are fetched only on request, so they're never in the page HTML
 * (anti-scraping, not access control). `toggle` shows both umpires' numbers;
 * hiding drops them from state (and so the DOM), and showing again refetches
 * so a just-changed number is current.
 */
export function useUmpirePhones(matchId: string) {
  const [pending, startTransition] = useTransition();
  const [revealed, setRevealed] = useState<RevealedPhones | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = () => {
    setError(null);
    if (revealed) {
      setRevealed(null);
      return;
    }
    startTransition(async () => {
      const result = await revealUmpirePhonesAction(matchId);
      if (result.ok) setRevealed(result);
      else setError(result.message);
    });
  };

  return { pending, revealed, error, toggle };
}

/** A tappable "(404) 555-0123" that dials the number. */
export function PhoneLink({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:+1${phone.replace(/\D/g, "")}`}
      className="font-data text-clay-bright whitespace-nowrap underline-offset-2 hover:underline"
    >
      {formatPhone(phone)}
    </a>
  );
}

const buttonClass =
  "font-data border-line text-chalk hover:border-clay self-start border px-3 py-2 text-[0.68rem] tracking-[0.08em] uppercase transition-colors disabled:opacity-60";

/** The standalone button + list, used on the admin fixtures page. */
export function RevealPhonesButton({ matchId }: { matchId: string }) {
  const { pending, revealed, error, toggle } = useUmpirePhones(matchId);

  const rows = revealed
    ? [
        { label: "Umpire 1", slot: revealed.umpireOne },
        { label: "Umpire 2", slot: revealed.umpireTwo },
      ].filter((r) => r.slot)
    : [];

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        aria-expanded={revealed !== null}
        onClick={toggle}
        className={buttonClass}
      >
        {pending ? "Loading…" : revealed ? "Hide umpire numbers" : "Show umpire numbers"}
      </button>
      {revealed ? (
        rows.length === 0 ? (
          <p className="text-chalk-dim text-sm">No numbers saved yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {rows.map(({ label, slot }) => (
              <li key={label}>
                <span className="text-chalk-dim">{label}: </span>
                {slot!.name} <PhoneLink phone={slot!.phone} />
              </li>
            ))}
          </ul>
        )
      ) : null}
      {error ? (
        <p role="alert" className="text-clay-bright text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
