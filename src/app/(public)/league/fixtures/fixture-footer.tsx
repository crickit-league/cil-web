"use client";

import { PhoneLink, useUmpirePhones } from "@/components/umpires/reveal-phones-button";
import { UmpireEntryPanel, UmpireEntryToggle } from "./umpire-entry";

// The fixture card's dashed footer. Always three labelled lines — Umpiring,
// Umpire 1, Umpire 2 — whether or not umpires are entered, so cards in a row
// stay the same height. Actions sit on the right: enter/change umpires and a
// compact numbers toggle. Revealed numbers go next to each name.

const label = "font-data text-chalk-faint text-[0.62rem] tracking-[0.12em] whitespace-nowrap uppercase";
const action =
  "font-data text-clay-bright py-0.5 text-[0.68rem] tracking-[0.08em] whitespace-nowrap uppercase underline-offset-2 hover:underline disabled:opacity-60";

export function FixtureFooter({
  matchId,
  completed,
  umpiringTeam,
  umpiringHighlighted,
  umpires,
  canEnter,
}: {
  matchId: string;
  completed: boolean;
  umpiringTeam: string | null;
  umpiringHighlighted: boolean;
  umpires: { one: string | null; two: string | null; hasPhones: boolean };
  /** Inline umpire entry is available (scheduled match, entry open, on the fixtures list). */
  canEnter: boolean;
}) {
  const phones = useUmpirePhones(matchId);
  // Played matches show names only; the service refuses their numbers too.
  const showNumbersToggle = umpires.hasPhones && !completed;
  const nominated = Boolean(umpires.one || umpires.two);

  const slots = [
    { label: "Umpire 1", name: umpires.one, phone: phones.revealed?.umpireOne?.phone ?? null },
    { label: "Umpire 2", name: umpires.two, phone: phones.revealed?.umpireTwo?.phone ?? null },
  ];

  return (
    <div className="border-line mt-auto border-t border-dashed px-4 py-3 text-sm">
      {/* Phones: actions in a row under the labels, so names get the full width
          and don't wrap. From sm: actions in a column on the right. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1">
          <dt className={label}>Umpiring</dt>
          <dd className={umpiringHighlighted ? "text-gold font-semibold" : "text-chalk"}>
            {umpiringTeam ?? <span className="text-chalk-faint">{completed ? "—" : "To be assigned"}</span>}
          </dd>
          {slots.map((slot) => (
            <div key={slot.label} className="contents">
              <dt className={label}>{slot.label}</dt>
              <dd className="min-w-0 break-words">
                {slot.name ? (
                  <>
                    {slot.name}
                    {slot.phone ? (
                      <>
                        {" "}
                        <PhoneLink phone={slot.phone} />
                      </>
                    ) : null}
                  </>
                ) : (
                  // A dash, not "Not nominated yet": the line must not wrap, so
                  // every card's footer is three lines ("Enter umpires →" says the rest).
                  <span className="text-chalk-faint" aria-label="Not nominated">
                    —
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {canEnter || showNumbersToggle ? (
          <div className="flex shrink-0 flex-wrap items-start gap-x-5 gap-y-1 sm:flex-col sm:items-end">
            {canEnter ? <UmpireEntryToggle matchId={matchId} nominated={nominated} /> : null}
            {showNumbersToggle ? (
              <button
                type="button"
                onClick={phones.toggle}
                disabled={phones.pending}
                aria-expanded={phones.revealed !== null}
                aria-label={phones.revealed ? "Hide umpire numbers" : "Show umpire numbers"}
                className={action}
              >
                {phones.pending ? "Loading…" : phones.revealed ? "Hide numbers" : "Show numbers"}
              </button>
            ) : null}
            {phones.error ? (
              <span role="alert" className="text-clay-bright text-xs sm:max-w-40 sm:text-right">
                {phones.error}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {canEnter ? (
        <UmpireEntryPanel matchId={matchId} umpireOneName={umpires.one} umpireTwoName={umpires.two} />
      ) : null}
    </div>
  );
}
