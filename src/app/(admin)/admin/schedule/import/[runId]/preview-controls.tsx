"use client";

import { useState, useTransition } from "react";
import {
  addAllUnmatchedTeamsAction,
  commitImportAction,
  discardImportAction,
  mapTeamNameAction,
} from "../../actions";

const fieldClass =
  "border-line bg-pitch text-chalk focus:border-clay w-full min-w-0 border px-2 py-1.5 text-sm outline-none disabled:opacity-60";
const primaryButton =
  "font-data border-clay bg-clay text-on-accent hover:border-clay-bright hover:bg-clay-bright inline-flex items-center justify-center border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "font-data border-clay text-clay hover:bg-clay hover:text-on-accent inline-flex items-center justify-center border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60";

function MapRow({
  runId,
  rawName,
  detail,
  teamOptions,
  allowNew = true,
}: {
  runId: string;
  rawName: string;
  detail?: string;
  teamOptions: { id: string; name: string }[];
  allowNew?: boolean;
}) {
  const [target, setTarget] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="border-line flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <span className="flex flex-col sm:w-1/3">
        <span className="font-medium">{rawName}</span>
        {detail ? <span className="text-chalk-dim text-xs">{detail}</span> : null}
      </span>
      <select
        aria-label={`Team for "${rawName}"`}
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        disabled={pending}
        className={`${fieldClass} sm:flex-1`}
      >
        <option value="">Choose…</option>
        {allowNew ? <option value="new">Add as a new team</option> : null}
        <optgroup label="Same team as">
          {teamOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </optgroup>
      </select>
      <button
        type="button"
        disabled={!target || pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await mapTeamNameAction(runId, rawName, target);
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

export function TeamMapper({
  runId,
  unmatched,
  teamOptions,
}: {
  runId: string;
  unmatched: string[];
  teamOptions: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <ul className="border-line bg-dugout border px-4">
        {unmatched.map((name) => (
          <MapRow key={name} runId={runId} rawName={name} teamOptions={teamOptions} />
        ))}
      </ul>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Add all ${unmatched.length} names as new teams in the series?`)) return;
          setError(null);
          startTransition(async () => {
            const result = await addAllUnmatchedTeamsAction(runId);
            if (!result.ok) setError(result.message);
          });
        }}
        className={`${secondaryButton} self-start`}
      >
        {pending ? "Adding…" : `Add all ${unmatched.length} as new teams`}
      </button>
      {error ? (
        <p role="alert" className="text-clay-bright text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** "Umpire One" names on unplayed matches that aren't a known team. Mapping is optional. */
export function UmpiringTeamMapper({
  runId,
  unmatched,
  teamOptions,
}: {
  runId: string;
  unmatched: { name: string; rowNumbers: number[] }[];
  teamOptions: { id: string; name: string }[];
}) {
  return (
    <ul className="border-line bg-dugout border px-4">
      {unmatched.map((u) => (
        <MapRow
          key={u.name}
          runId={runId}
          rawName={u.name}
          detail={`Row${u.rowNumbers.length === 1 ? "" : "s"} ${u.rowNumbers.join(", ")}`}
          teamOptions={teamOptions}
          allowNew={false}
        />
      ))}
    </ul>
  );
}

export function CommitBar({ runId, canCommit }: { runId: string; canCommit: boolean }) {
  const [committing, startCommit] = useTransition();
  const [discarding, startDiscard] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!canCommit || committing || discarding}
          onClick={() => {
            setError(null);
            startCommit(async () => {
              const result = await commitImportAction(runId);
              if (result && !result.ok) setError(result.message);
            });
          }}
          className={primaryButton}
        >
          {committing ? "Importing…" : "Import These Changes"}
        </button>
        <button
          type="button"
          disabled={committing || discarding}
          onClick={() => {
            setError(null);
            startDiscard(async () => {
              const result = await discardImportAction(runId);
              if (result && !result.ok) setError(result.message);
            });
          }}
          className={secondaryButton}
        >
          {discarding ? "Discarding…" : "Discard"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-clay-bright text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
