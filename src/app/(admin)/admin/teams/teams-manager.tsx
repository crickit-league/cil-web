"use client";

import { useState, useTransition } from "react";
import type { AddTeamsResult } from "@/lib/services/series";
import { addRegistrationsAction, renameTeamAction, setPoolAction } from "./actions";

export type AdminTeamRow = {
  id: string;
  name: string;
  pool: string | null;
  captain: string | null;
  viceCaptain: string | null;
};

const POOL_OPTIONS = ["A", "B"];

const fieldClass =
  "border-line bg-pitch text-chalk focus:border-clay w-full min-w-0 border px-2 py-1.5 text-sm outline-none disabled:opacity-60";
const smallButton =
  "font-data border-clay text-clay hover:bg-clay hover:text-pitch-deep inline-flex shrink-0 items-center justify-center border px-3 py-1.5 text-[0.68rem] tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const primaryButton =
  "font-data border-clay bg-clay text-pitch-deep hover:border-clay-bright hover:bg-clay-bright inline-flex items-center justify-center border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60";

function PoolSelect({ team, onError }: { team: AdminTeamRow; onError: (message: string) => void }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label={`Pool for ${team.name}`}
      value={team.pool ?? ""}
      disabled={pending}
      onChange={(event) => {
        const pool = event.target.value;
        startTransition(async () => {
          const result = await setPoolAction(team.id, pool);
          if (!result.ok) onError(result.message);
        });
      }}
      className={fieldClass}
    >
      <option value="">Unassigned</option>
      {POOL_OPTIONS.map((p) => (
        <option key={p} value={p}>
          Pool {p}
        </option>
      ))}
    </select>
  );
}

/**
 * The team's name with a Rename button; renaming goes through renameTeam,
 * which updates the name everywhere and keeps the old one for imports.
 */
function TeamName({ team }: { team: AdminTeamRow }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 font-medium break-words">{team.name}</span>
        <button
          type="button"
          onClick={() => {
            setName(team.name);
            setError(null);
            setEditing(true);
          }}
          className={smallButton}
        >
          Rename
        </button>
      </div>
    );
  }

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await renameTeamAction(team.id, name);
      if (result.ok) setEditing(false);
      else setError(result.message);
    });
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <input
        aria-label={`New name for ${team.name}`}
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={pending}
        maxLength={80}
        autoFocus
        className={fieldClass}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={pending || !name.trim()} className={smallButton}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" disabled={pending} onClick={() => setEditing(false)} className={smallButton}>
          Cancel
        </button>
      </div>
      <p className="text-chalk-faint text-xs">
        Shows everywhere on the site. Also rename it in CricClubs; files with the old name still match.
      </p>
      {error ? (
        <p role="alert" className="text-clay-bright text-sm">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function TeamGroup({
  title,
  teams,
  onError,
}: {
  title: string;
  teams: AdminTeamRow[];
  onError: (message: string) => void;
}) {
  if (teams.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-extrabold tracking-wide uppercase">
        {title} <span className="font-data text-chalk-dim text-sm font-normal">· {teams.length}</span>
      </h2>

      {/* Cards below `sm` — four columns don't fit a phone. */}
      <div className="flex flex-col gap-3 sm:hidden">
        {teams.map((team) => (
          <div key={team.id} className="border-line bg-dugout flex flex-col gap-3 border p-4">
            <div>
              <TeamName team={team} />
              <div className="text-chalk-dim mt-1 text-sm">
                C: {team.captain ?? "—"}
                {team.viceCaptain ? ` · VC: ${team.viceCaptain}` : ""}
              </div>
            </div>
            <PoolSelect team={team} onError={onError} />
          </div>
        ))}
      </div>

      {/* Table at `sm` and up. */}
      <div className="border-line hidden overflow-x-auto border sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="font-data border-line text-chalk-dim border-b text-[0.68rem] tracking-[0.1em] uppercase">
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Captain</th>
              <th className="px-4 py-3">Vice Captain</th>
              <th className="w-40 px-4 py-3">Pool</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-line border-b last:border-0">
                <td className="px-4 py-3">
                  <TeamName team={team} />
                </td>
                <td className="px-4 py-3">{team.captain ?? "—"}</td>
                <td className="text-chalk-dim px-4 py-3">{team.viceCaptain ?? "—"}</td>
                <td className="px-4 py-2">
                  <PoolSelect team={team} onError={onError} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TeamsManager({
  seriesId,
  teams,
  pendingRegistrations,
}: {
  seriesId: string;
  teams: AdminTeamRow[];
  pendingRegistrations: number;
}) {
  const [adding, startAdding] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [addResult, setAddResult] = useState<AddTeamsResult | null>(null);

  const byPool = (pool: string | null) => teams.filter((t) => t.pool === pool);

  const addTeams = () => {
    setError(null);
    startAdding(async () => {
      const response = await addRegistrationsAction(seriesId);
      if (response.ok) setAddResult(response.result);
      else setError(response.message);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="font-data text-chalk-dim flex flex-wrap gap-x-6 gap-y-1 text-xs tracking-[0.08em] uppercase">
          <span>{teams.length} teams</span>
          {POOL_OPTIONS.map((p) => (
            <span key={p}>
              Pool {p}: {byPool(p).length}
            </span>
          ))}
          <span>Unassigned: {byPool(null).length}</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {pendingRegistrations > 0 ? (
            <button type="button" onClick={addTeams} disabled={adding} className={primaryButton}>
              {adding
                ? "Adding…"
                : `Add ${pendingRegistrations} registered team${pendingRegistrations === 1 ? "" : "s"}`}
            </button>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-clay-bright text-sm">
            {error}
          </p>
        ) : null}

        {addResult ? (
          <div className="border-line bg-dugout border p-4 text-sm">
            <p>
              Added {addResult.added.length} team{addResult.added.length === 1 ? "" : "s"}.
            </p>
            {addResult.skipped.length > 0 ? (
              <ul className="text-clay-bright mt-2 flex list-disc flex-col gap-1 pl-5">
                {addResult.skipped.map((s) => (
                  <li key={s.teamName}>
                    {s.teamName}: {s.reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      {teams.length === 0 ? (
        <p className="text-chalk-dim">
          No teams yet. Add the registered teams to start. Pools are set when the schedule is imported.
        </p>
      ) : (
        <>
          {POOL_OPTIONS.map((p) => (
            <TeamGroup key={p} title={`Pool ${p}`} teams={byPool(p)} onError={setError} />
          ))}
          <TeamGroup title="Unassigned" teams={byPool(null)} onError={setError} />
        </>
      )}
    </div>
  );
}
