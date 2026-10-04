"use client";

import { useState, useTransition } from "react";
import { updateRegistrationAction } from "./actions";

type Status = "SUBMITTED" | "APPROVED" | "REJECTED" | "WITHDRAWN";
type FeeTier = "STANDARD" | "SPONSORSHIP";
type FeeStatusValue = "UNPAID" | "PAID" | "WAIVED";

export type RegistrationRow = {
  id: string;
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainMobile: string;
  viceCaptainName: string | null;
  viceCaptainEmail: string | null;
  viceCaptainMobile: string | null;
  seasonName: string;
  status: Status;
  feeTier: FeeTier;
  feeStatus: FeeStatusValue;
  marketingConsent: boolean;
  submitted: string;
};

// Plain-string draft: inputs are controlled, blanks mean "not provided".
type Draft = {
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainMobile: string;
  viceCaptainName: string;
  viceCaptainEmail: string;
  viceCaptainMobile: string;
  status: Status;
  feeTier: FeeTier;
  feeStatus: FeeStatusValue;
  marketingConsent: boolean;
};

type TextField =
  | "teamName"
  | "captainName"
  | "captainEmail"
  | "captainMobile"
  | "viceCaptainName"
  | "viceCaptainEmail"
  | "viceCaptainMobile";

const STATUSES: Status[] = ["SUBMITTED", "APPROVED", "REJECTED", "WITHDRAWN"];
const FEE_STATUSES: FeeStatusValue[] = ["UNPAID", "PAID", "WAIVED"];

// Mirrors lib/registrations/labels.ts, which types its keys from Prisma's
// generated client — kept local so this client component doesn't import it.
const FEE_TIER_LABEL: Record<FeeTier, string> = {
  STANDARD: "$650 Standard",
  SPONSORSHIP: "$800 Sponsorship",
};

function toDraft(r: RegistrationRow): Draft {
  return {
    teamName: r.teamName,
    captainName: r.captainName,
    captainEmail: r.captainEmail,
    captainMobile: r.captainMobile,
    viceCaptainName: r.viceCaptainName ?? "",
    viceCaptainEmail: r.viceCaptainEmail ?? "",
    viceCaptainMobile: r.viceCaptainMobile ?? "",
    status: r.status,
    feeTier: r.feeTier,
    feeStatus: r.feeStatus,
    marketingConsent: r.marketingConsent,
  };
}

const fieldClass =
  "border-line bg-pitch text-chalk focus:border-clay w-full min-w-0 border px-2 py-1.5 text-sm outline-none";
const buttonClass =
  "font-data inline-flex items-center justify-center border px-3 py-2 text-[0.68rem] tracking-[0.08em] uppercase transition-colors disabled:opacity-50";
const labelClass = "text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase";

export function RegistrationsList({ rows }: { rows: RegistrationRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const startEdit = (row: RegistrationRow) => {
    setEditingId(row.id);
    setDraft(toDraft(row));
    setError(null);
  };

  const cancel = () => {
    setEditingId(null);
    setDraft(null);
    setError(null);
  };

  const save = () => {
    if (!editingId || !draft) return;
    startTransition(async () => {
      const result = await updateRegistrationAction(editingId, draft);
      if (result.ok) {
        cancel();
      } else {
        setError(result.message);
      }
    });
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const text = (key: TextField, type: "text" | "email" | "tel" = "text") => (
    <input
      type={type}
      value={draft?.[key] ?? ""}
      onChange={(e) => set(key, e.target.value)}
      aria-label={key}
      className={fieldClass}
    />
  );

  const statusSelect = (
    <select
      value={draft?.status}
      onChange={(e) => set("status", e.target.value as Status)}
      className={fieldClass}
      aria-label="status"
    >
      {STATUSES.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  );

  const feeTierSelect = (
    <select
      value={draft?.feeTier}
      onChange={(e) => set("feeTier", e.target.value as FeeTier)}
      className={fieldClass}
      aria-label="fee tier"
    >
      {(Object.keys(FEE_TIER_LABEL) as FeeTier[]).map((t) => (
        <option key={t} value={t}>
          {FEE_TIER_LABEL[t]}
        </option>
      ))}
    </select>
  );

  const feeStatusSelect = (
    <select
      value={draft?.feeStatus}
      onChange={(e) => set("feeStatus", e.target.value as FeeStatusValue)}
      className={fieldClass}
      aria-label="fee status"
    >
      {FEE_STATUSES.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  );

  const marketingCheckbox = (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={draft?.marketingConsent ?? false}
        onChange={(e) => set("marketingConsent", e.target.checked)}
      />
      Yes
    </label>
  );

  const actions = (row: RegistrationRow) =>
    editingId === row.id ? (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className={`${buttonClass} border-clay bg-clay text-pitch-deep hover:bg-clay-bright`}
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className={`${buttonClass} border-line text-chalk-dim hover:text-chalk`}
          >
            Cancel
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-clay-bright max-w-48 text-xs">
            {error}
          </p>
        ) : null}
      </div>
    ) : (
      <button
        type="button"
        onClick={() => startEdit(row)}
        disabled={editingId !== null}
        className={`${buttonClass} border-clay text-clay hover:bg-clay hover:text-pitch-deep`}
      >
        Edit
      </button>
    );

  return (
    <>
      {/* Cards below `sm` — a wide table doesn't fit a phone. See docs/architecture.md §13. */}
      <div className="flex flex-col gap-4 sm:hidden">
        {rows.map((r) => {
          const editing = editingId === r.id && draft !== null;
          return (
            <div key={r.id} className="border-line bg-dugout border p-5">
              <div className="flex items-start justify-between gap-3">
                {editing ? (
                  <div className="flex-1">{text("teamName")}</div>
                ) : (
                  <>
                    <span className="font-display text-lg leading-tight font-extrabold uppercase">
                      {r.teamName}
                    </span>
                    <span className="font-data text-chalk-dim shrink-0 text-[0.65rem] tracking-[0.08em] uppercase">
                      {r.status}
                    </span>
                  </>
                )}
              </div>
              <dl className="font-data mt-3 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-sm">
                <dt className={labelClass}>Captain</dt>
                <dd>{editing ? text("captainName") : r.captainName}</dd>
                <dt className={labelClass}>Email</dt>
                <dd className="min-w-0 truncate">
                  {editing ? text("captainEmail", "email") : r.captainEmail}
                </dd>
                <dt className={labelClass}>Mobile</dt>
                <dd>{editing ? text("captainMobile", "tel") : r.captainMobile}</dd>
                <dt className={labelClass}>Vice Captain</dt>
                <dd>{editing ? text("viceCaptainName") : (r.viceCaptainName ?? "—")}</dd>
                <dt className={labelClass}>Email</dt>
                <dd className="min-w-0 truncate">
                  {editing ? text("viceCaptainEmail", "email") : (r.viceCaptainEmail ?? "—")}
                </dd>
                <dt className={labelClass}>Mobile</dt>
                <dd>{editing ? text("viceCaptainMobile", "tel") : (r.viceCaptainMobile ?? "—")}</dd>
                <dt className={labelClass}>Season</dt>
                <dd>{r.seasonName}</dd>
                {editing ? (
                  <>
                    <dt className={labelClass}>Status</dt>
                    <dd>{statusSelect}</dd>
                  </>
                ) : null}
                <dt className={labelClass}>Fee Tier</dt>
                <dd>{editing ? feeTierSelect : FEE_TIER_LABEL[r.feeTier]}</dd>
                <dt className={labelClass}>Fee Status</dt>
                <dd>{editing ? feeStatusSelect : r.feeStatus}</dd>
                <dt className={labelClass}>Marketing</dt>
                <dd>{editing ? marketingCheckbox : r.marketingConsent ? "Yes" : "No"}</dd>
                <dt className={labelClass}>Submitted</dt>
                <dd>{r.submitted}</dd>
              </dl>
              <div className="mt-4">{actions(r)}</div>
            </div>
          );
        })}
      </div>

      {/* Table at `sm` and up. */}
      <div className="border-line hidden overflow-x-auto border sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="font-data border-line text-chalk-dim border-b text-[0.68rem] tracking-[0.1em] uppercase">
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Captain</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Vice Captain</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Season</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Fee Tier</th>
              <th className="px-4 py-3">Fee Status</th>
              <th className="px-4 py-3">Marketing</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const editing = editingId === r.id && draft !== null;
              return (
                <tr key={r.id} className="border-line border-b align-top last:border-0">
                  <td className="min-w-40 px-4 py-3 font-medium">
                    {editing ? text("teamName") : r.teamName}
                  </td>
                  <td className="min-w-36 px-4 py-3">{editing ? text("captainName") : r.captainName}</td>
                  <td className="min-w-52 px-4 py-3">
                    {editing ? text("captainEmail", "email") : r.captainEmail}
                  </td>
                  <td className="min-w-36 px-4 py-3">
                    {editing ? text("captainMobile", "tel") : r.captainMobile}
                  </td>
                  <td className="min-w-36 px-4 py-3">
                    {editing ? text("viceCaptainName") : (r.viceCaptainName ?? "—")}
                  </td>
                  <td className="min-w-52 px-4 py-3">
                    {editing ? text("viceCaptainEmail", "email") : (r.viceCaptainEmail ?? "—")}
                  </td>
                  <td className="min-w-36 px-4 py-3">
                    {editing ? text("viceCaptainMobile", "tel") : (r.viceCaptainMobile ?? "—")}
                  </td>
                  <td className="px-4 py-3">{r.seasonName}</td>
                  <td className="px-4 py-3">{editing ? statusSelect : r.status}</td>
                  <td className="px-4 py-3">{editing ? feeTierSelect : FEE_TIER_LABEL[r.feeTier]}</td>
                  <td className="px-4 py-3">{editing ? feeStatusSelect : r.feeStatus}</td>
                  <td className="px-4 py-3">
                    {editing ? marketingCheckbox : r.marketingConsent ? "Yes" : "No"}
                  </td>
                  <td className="text-chalk-dim px-4 py-3">{r.submitted}</td>
                  <td className="px-4 py-3">{actions(r)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
