"use client";

import { useState, useTransition } from "react";
import { setUmpiringTeamAction } from "./actions";

const fieldClass =
  "border-line bg-pitch text-chalk focus:border-clay w-full min-w-0 border px-2 py-1.5 text-sm outline-none disabled:opacity-60";

export function UmpiringSelect({
  matchId,
  value,
  options,
  label,
}: {
  matchId: string;
  value: string | null;
  /** Teams allowed to umpire this match (the two playing teams already excluded). */
  options: { id: string; name: string }[];
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <select
        aria-label={label}
        value={value ?? ""}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value;
          setError(null);
          startTransition(async () => {
            const result = await setUmpiringTeamAction(matchId, next);
            if (!result.ok) setError(result.message);
          });
        }}
        className={fieldClass}
      >
        <option value="">No umpiring team</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      {error ? (
        <p role="alert" className="text-clay-bright text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
