"use client";

import { PhoneLink, useUmpirePhones } from "@/components/umpires/reveal-phones-button";

// The fixture card's dashed footer, shown only once umpires are assigned (on the
// admin edit-match page): one labelled line per assigned umpire, with a compact
// numbers toggle on the right; revealed numbers go next to the name. The umpiring
// team itself is on the card's ground line.

const label = "font-data text-chalk-faint text-[0.62rem] tracking-[0.12em] whitespace-nowrap uppercase";
const action =
  "font-data text-clay-bright py-0.5 text-[0.68rem] tracking-[0.08em] whitespace-nowrap uppercase underline-offset-2 hover:underline disabled:opacity-60";

export function FixtureFooter({
  matchId,
  completed,
  umpires,
}: {
  matchId: string;
  completed: boolean;
  umpires: { one: string | null; two: string | null; hasPhones: boolean };
}) {
  const phones = useUmpirePhones(matchId);
  // Played matches show names only; the service refuses their numbers too.
  const showNumbersToggle = umpires.hasPhones && !completed;

  const slots = [
    { label: "Umpire 1", name: umpires.one, phone: phones.revealed?.umpireOne?.phone ?? null },
    { label: "Umpire 2", name: umpires.two, phone: phones.revealed?.umpireTwo?.phone ?? null },
  ].filter((slot) => slot.name);

  return (
    <div className="border-line mt-auto border-t border-dashed px-4 py-3 text-sm">
      {/* Phones: actions in a row under the labels, so names get the full width
          and don't wrap. From sm: actions in a column on the right. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1">
          {slots.map((slot) => (
            <div key={slot.label} className="contents">
              <dt className={label}>{slot.label}</dt>
              <dd className="min-w-0 break-words">
                {slot.name}
                {slot.phone ? (
                  <>
                    {" "}
                    <PhoneLink phone={slot.phone} />
                  </>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>

        {showNumbersToggle ? (
          <div className="flex shrink-0 flex-wrap items-start gap-x-5 gap-y-1 sm:flex-col sm:items-end">
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
    </div>
  );
}
