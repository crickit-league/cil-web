"use client";

import { useState, useTransition } from "react";
import { discardPointsTableAction, publishPointsTableAction } from "../../actions";

const primaryButton =
  "font-data border-clay bg-clay text-pitch-deep hover:border-clay-bright hover:bg-clay-bright inline-flex items-center justify-center border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "font-data border-clay text-clay hover:bg-clay hover:text-pitch-deep inline-flex items-center justify-center border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export function CommitBar({ runId, canCommit }: { runId: string; canCommit: boolean }) {
  const [publishing, startPublish] = useTransition();
  const [discarding, startDiscard] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!canCommit || publishing || discarding}
          onClick={() => {
            setError(null);
            startPublish(async () => {
              const result = await publishPointsTableAction(runId);
              if (result && !result.ok) setError(result.message);
            });
          }}
          className={primaryButton}
        >
          {publishing ? "Publishing…" : "Publish This Table"}
        </button>
        <button
          type="button"
          disabled={publishing || discarding}
          onClick={() => {
            setError(null);
            startDiscard(async () => {
              const result = await discardPointsTableAction(runId);
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
