"use client";

import { createAdminColumnHelper, DataTable, type AdminColumns } from "@/components/admin/data-table";
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
  /** Pre-formatted on the server so hydration can't disagree on timezone. */
  submitted: string;
  /** ISO timestamp, used only for sorting. */
  submittedAt: string;
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

const helper = createAdminColumnHelper<RegistrationRow>();

const columns: AdminColumns<RegistrationRow> = helper.columns([
  helper.accessor("teamName", { header: "Team", cell: (c) => <strong>{c.getValue()}</strong> }),
  helper.accessor("captainName", { header: "Captain", cell: (c) => c.getValue() }),
  helper.accessor("captainEmail", { header: "Captain Email", cell: (c) => c.getValue() }),
  helper.accessor("captainMobile", { header: "Captain Mobile", cell: (c) => c.getValue() }),
  helper.accessor((r) => r.viceCaptainName ?? "—", {
    id: "viceCaptainName",
    header: "Vice Captain",
    cell: (c) => c.getValue(),
  }),
  helper.accessor((r) => r.viceCaptainEmail ?? "—", {
    id: "viceCaptainEmail",
    header: "Vice Captain Email",
    cell: (c) => c.getValue(),
  }),
  helper.accessor((r) => r.viceCaptainMobile ?? "—", {
    id: "viceCaptainMobile",
    header: "Vice Captain Mobile",
    cell: (c) => c.getValue(),
  }),
  helper.accessor("seasonName", { header: "Season", cell: (c) => c.getValue() }),
  helper.accessor("status", { header: "Status", cell: (c) => c.getValue() }),
  helper.accessor((r) => FEE_TIER_LABEL[r.feeTier], {
    id: "feeTier",
    header: "Fee Tier",
    cell: (c) => c.getValue(),
  }),
  helper.accessor("feeStatus", { header: "Fee Status", cell: (c) => c.getValue() }),
  helper.accessor((r) => (r.marketingConsent ? "Yes" : "No"), {
    id: "marketingConsent",
    header: "Marketing",
    cell: (c) => c.getValue(),
  }),
  // Sorts on the ISO timestamp, displays the pre-formatted date.
  helper.accessor("submittedAt", {
    header: "Submitted",
    enableGlobalFilter: false,
    cell: (c) => <span className="text-chalk-dim">{c.row.original.submitted}</span>,
  }),
]);

export function RegistrationsTable({ rows }: { rows: RegistrationRow[] }) {
  return (
    <DataTable<RegistrationRow, Draft>
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      cardTitleColumn="teamName"
      searchPlaceholder="Search team, captain, email…"
      edit={{
        getDraft: toDraft,
        onSave: (row, draft) => updateRegistrationAction(row.id, draft),
        editors: {
          teamName: textEditor("teamName"),
          captainName: textEditor("captainName"),
          captainEmail: textEditor("captainEmail", "email"),
          captainMobile: textEditor("captainMobile", "tel"),
          viceCaptainName: textEditor("viceCaptainName"),
          viceCaptainEmail: textEditor("viceCaptainEmail", "email"),
          viceCaptainMobile: textEditor("viceCaptainMobile", "tel"),
          status: ({ draft, set }) => (
            <select
              value={draft.status}
              onChange={(e) => set("status", e.target.value as Status)}
              className={fieldClass}
              aria-label="Status"
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          ),
          feeTier: ({ draft, set }) => (
            <select
              value={draft.feeTier}
              onChange={(e) => set("feeTier", e.target.value as FeeTier)}
              className={fieldClass}
              aria-label="Fee tier"
            >
              {(Object.keys(FEE_TIER_LABEL) as FeeTier[]).map((t) => (
                <option key={t} value={t}>
                  {FEE_TIER_LABEL[t]}
                </option>
              ))}
            </select>
          ),
          feeStatus: ({ draft, set }) => (
            <select
              value={draft.feeStatus}
              onChange={(e) => set("feeStatus", e.target.value as FeeStatusValue)}
              className={fieldClass}
              aria-label="Fee status"
            >
              {FEE_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          ),
          marketingConsent: ({ draft, set }) => (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.marketingConsent}
                onChange={(e) => set("marketingConsent", e.target.checked)}
              />
              Yes
            </label>
          ),
        },
      }}
    />
  );
}

function textEditor(key: TextField, type: "text" | "email" | "tel" = "text") {
  return function TextEditor({
    draft,
    set,
  }: {
    draft: Draft;
    set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  }) {
    return (
      <input
        type={type}
        value={draft[key]}
        onChange={(e) => set(key, e.target.value)}
        aria-label={key}
        className={fieldClass}
      />
    );
  };
}
