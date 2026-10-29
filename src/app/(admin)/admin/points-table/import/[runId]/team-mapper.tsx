"use client";

import { useState, useTransition } from "react";
import { mapPointsTableTeamAction } from "../../actions";

const fieldClass =
  "border-line bg-pitch text-chalk focus:border-clay w-full min-w-0 border px-2 py-1.5 text-sm outline-none disabled:opacity-60";
const secondaryButton =
  "font-data border-clay text-clay hover:bg-clay hover:text-on-accent inline-flex items-center justify-center border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60";

function MapRow({
  runId,
  rawName,
  teamOptions,
}: {
  runId: string;
  rawName: string;
  teamOptions: { id: string; name: string }[];
}) {
  const [target, setTarget] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="border-line flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <span className="font-medium sm:w-1/3">{rawName}</span>
      <select
        aria-label={`Team for "${rawName}"`}
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        disabled={pending}
        className={`${fieldClass} sm:flex-1`}
      >
        <option value="">Same team as…</option>
        {teamOptions.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!target || pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await mapPointsTableTeamAction(runId, rawName, target);
            if (!result.ok) setError(result.message);
          });
        }}
        className={secondaryButton}
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {error ? (
        <p role="alert" className="text-clay-bright text-sm">
          {error}
        </p>
      ) : null}
    </li>
  );
}

/** Unknown names in a points table upload; each can be mapped to a team (saved as an alias). */
export function TeamMapper({
  runId,
  unmatched,
  teamOptions,
}: {
  runId: string;
  unmatched: string[];
  teamOptions: { id: string; name: string }[];
}) {
  return (
    <ul className="border-line bg-dugout border px-4">
      {unmatched.map((name) => (
        <MapRow key={name} runId={runId} rawName={name} teamOptions={teamOptions} />
      ))}
    </ul>
  );
}
