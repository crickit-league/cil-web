"use client";

import { useMemo, useState, useTransition } from "react";
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type Cell,
  type ColumnDef,
} from "@tanstack/react-table";

// Shared admin table: sorting, search, column toggle, pagination, inline row
// editing, and a stacked-card layout below `sm` (CLAUDE.md mobile-first rule).
// Pages define columns with `createAdminColumnHelper` at module scope and hand
// them to <DataTable>; nothing here knows about any particular record type.

export const adminTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnVisibilityFeature,
});

type AdminFeatures = typeof adminTableFeatures;

export function createAdminColumnHelper<T extends object>() {
  return createColumnHelper<AdminFeatures, T>();
}

// `any` for the cell value is deliberate: a table's columns each have a
// different value type, and the helper's own `columns()` already types each one.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdminColumns<T extends object> = ColumnDef<AdminFeatures, T, any>[];

export type SaveResult = { ok: true } | { ok: false; message: string };

export type EditorContext<T, D> = {
  row: T;
  draft: D;
  set: <K extends keyof D>(key: K, value: D[K]) => void;
};

export type EditConfig<T, D> = {
  /** Starting values for the edit form, derived from the row being edited. */
  getDraft: (row: T) => D;
  /** Persist the draft. Must go through a server action → service layer. */
  onSave: (row: T, draft: D) => Promise<SaveResult>;
  /** Editor per column id. Columns without one stay read-only while editing. */
  editors: Record<string, (ctx: EditorContext<T, D>) => React.ReactNode>;
};

type DataTableProps<T extends object, D> = {
  data: T[];
  columns: AdminColumns<T>;
  getRowId: (row: T) => string;
  /** Column id shown as the heading of each card on phones. */
  cardTitleColumn: string;
  searchPlaceholder?: string;
  pageSize?: number;
  edit?: EditConfig<T, D>;
  /** Keep the first column pinned while scrolling sideways. Default true. */
  pinFirstColumn?: boolean;
};

// Pinned cells need an opaque background so scrolled content doesn't show
// through, and a right-edge line to mark where the pinned area ends.
const PIN_CELL = "sticky left-0 shadow-[inset_-1px_0_0_var(--color-line)]";

const buttonClass =
  "font-data inline-flex items-center justify-center border px-3 py-2 text-[0.68rem] tracking-[0.08em] uppercase transition-colors disabled:opacity-50";
const inputClass =
  "border-line bg-pitch text-chalk focus:border-clay min-w-0 border px-3 py-2 text-sm outline-none";
const labelClass = "text-chalk-dim text-[0.62rem] tracking-[0.08em] uppercase";

export function DataTable<T extends object, D = never>({
  data,
  columns,
  getRowId,
  cardTitleColumn,
  searchPlaceholder = "Search…",
  pageSize = 25,
  edit,
  pinFirstColumn = true,
}: DataTableProps<T, D>) {
  const table = useTable({
    features: adminTableFeatures,
    columns,
    data,
    getRowId,
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const startEdit = (row: T, id: string) => {
    if (!edit) return;
    setEditingId(id);
    setDraft(edit.getDraft(row));
    setError(null);
  };

  const cancel = () => {
    setEditingId(null);
    setDraft(null);
    setError(null);
  };

  const save = (row: T) => {
    if (!edit || draft === null) return;
    startTransition(async () => {
      const result = await edit.onSave(row, draft);
      if (result.ok) {
        cancel();
      } else {
        setError(result.message);
      }
    });
  };

  const set = <K extends keyof D>(key: K, value: D[K]) =>
    setDraft((d) => (d === null ? d : { ...d, [key]: value }));

  const renderCell = (cell: Cell<AdminFeatures, T, unknown>, rowId: string) => {
    const editor = edit?.editors[cell.column.id];
    if (edit && editor && editingId === rowId && draft !== null) {
      return editor({ row: cell.row.original, draft, set });
    }
    return <table.FlexRender cell={cell} />;
  };

  const actions = (row: T, rowId: string) => {
    if (!edit) return null;
    if (editingId === rowId) {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => save(row)}
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
      );
    }
    return (
      <button
        type="button"
        onClick={() => startEdit(row, rowId)}
        disabled={editingId !== null}
        className={`${buttonClass} border-clay text-clay hover:bg-clay hover:text-pitch-deep`}
      >
        Edit
      </button>
    );
  };

  const rows = table.getRowModel().rows;
  const total = table.getPrePaginatedRowModel().rows.length;
  const { pageIndex, pageSize: size } = table.state.pagination;
  const from = total === 0 ? 0 : pageIndex * size + 1;
  const to = Math.min(total, (pageIndex + 1) * size);
  const searching = String(table.state.globalFilter ?? "") !== "";

  const sortableColumns = useMemo(
    () => table.getAllLeafColumns().filter((c) => c.getCanSort()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns],
  );
  const activeSort = table.state.sorting[0];

  const headerLabel = (column: { columnDef: { header?: unknown }; id: string }) =>
    typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={String(table.state.globalFilter ?? "")}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search"
          className={`${inputClass} sm:w-72`}
        />

        {/* Phones have no column headers to click, so sorting is a control. */}
        <div className="flex gap-2 sm:hidden">
          <select
            aria-label="Sort by"
            value={activeSort?.id ?? ""}
            onChange={(e) =>
              table.setSorting(
                e.target.value ? [{ id: e.target.value, desc: activeSort?.desc ?? false }] : [],
              )
            }
            className={`${inputClass} flex-1`}
          >
            <option value="">Sort by…</option>
            {sortableColumns.map((c) => (
              <option key={c.id} value={c.id}>
                {headerLabel(c)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!activeSort}
            onClick={() => activeSort && table.setSorting([{ id: activeSort.id, desc: !activeSort.desc }])}
            aria-label={activeSort?.desc ? "Sorted descending" : "Sorted ascending"}
            className={`${buttonClass} border-line text-chalk-dim hover:text-chalk`}
          >
            {activeSort?.desc ? "Z–A" : "A–Z"}
          </button>
        </div>

        <details className="relative hidden sm:ml-auto sm:block">
          <summary
            className={`${buttonClass} border-line text-chalk-dim hover:text-chalk cursor-pointer list-none`}
          >
            Columns
          </summary>
          <div className="border-line bg-dugout absolute right-0 z-30 mt-1 flex max-h-72 w-52 flex-col gap-1 overflow-y-auto border p-3 shadow-lg shadow-black/30">
            {table
              .getAllLeafColumns()
              .filter((c) => c.getCanHide())
              .map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={c.getIsVisible()}
                    onChange={(e) => c.toggleVisibility(e.target.checked)}
                  />
                  {headerLabel(c)}
                </label>
              ))}
          </div>
        </details>
      </div>

      {rows.length === 0 ? (
        <p className="text-chalk-dim">{searching ? "No matching rows." : "Nothing to show."}</p>
      ) : (
        <>
          {/* Cards below `sm` — a wide table doesn't fit a phone. See docs/architecture.md §13. */}
          <div className="flex flex-col gap-4 sm:hidden">
            {rows.map((row) => {
              const cells = row.getAllCells();
              const titleCell = cells.find((c) => c.column.id === cardTitleColumn);
              return (
                <div key={row.id} className="border-line bg-dugout border p-5">
                  {titleCell ? (
                    <div className="font-display text-lg leading-tight font-extrabold uppercase">
                      {renderCell(titleCell, row.id)}
                    </div>
                  ) : null}
                  <dl className="font-data mt-3 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-sm">
                    {cells
                      .filter((c) => c.column.id !== cardTitleColumn)
                      .map((cell) => (
                        <div key={cell.id} className="contents">
                          <dt className={labelClass}>{headerLabel(cell.column)}</dt>
                          <dd className="min-w-0 break-words">{renderCell(cell, row.id)}</dd>
                        </div>
                      ))}
                  </dl>
                  {edit ? <div className="mt-4">{actions(row.original, row.id)}</div> : null}
                </div>
              );
            })}
          </div>

          {/* Table at `sm` and up. The header sticks inside this scroll box (a sticky header can't escape an overflow container). */}
          <div className="border-line hidden max-h-[calc(100vh-12rem)] overflow-auto border sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                {table.getHeaderGroups().map((group) => (
                  <tr
                    key={group.id}
                    className="font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase"
                  >
                    {group.headers.map((header, index) => {
                      const sorted = header.column.getIsSorted();
                      const canSort = header.column.getCanSort();
                      return (
                        <th
                          key={header.id}
                          className={`bg-dugout sticky top-0 px-4 py-3 whitespace-nowrap ${
                            pinFirstColumn && index === 0
                              ? "left-0 z-20 shadow-[inset_-1px_-1px_0_var(--color-line)]"
                              : "z-10 shadow-[inset_0_-1px_0_var(--color-line)]"
                          }`}
                          aria-sort={
                            sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                          }
                        >
                          {header.isPlaceholder ? null : canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="hover:text-chalk inline-flex items-center gap-1 uppercase transition-colors"
                            >
                              <table.FlexRender header={header} />
                              <span aria-hidden="true" className={sorted ? "text-clay" : "opacity-30"}>
                                {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}
                              </span>
                            </button>
                          ) : (
                            <table.FlexRender header={header} />
                          )}
                        </th>
                      );
                    })}
                    {edit ? (
                      <th className="bg-dugout sticky top-0 z-10 px-4 py-3 shadow-[inset_0_-1px_0_var(--color-line)]">
                        <span className="sr-only">Actions</span>
                      </th>
                    ) : null}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-line border-b align-top last:border-0">
                    {row.getVisibleCells().map((cell, index) => (
                      <td
                        key={cell.id}
                        className={`min-w-28 px-4 py-3 ${
                          pinFirstColumn && index === 0 ? `${PIN_CELL} bg-pitch z-10` : ""
                        }`}
                      >
                        {renderCell(cell, row.id)}
                      </td>
                    ))}
                    {edit ? <td className="px-4 py-3">{actions(row.original, row.id)}</td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-data text-chalk-dim text-xs">
              {from}–{to} of {total}
            </p>
            {table.getPageCount() > 1 ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className={`${buttonClass} border-line text-chalk-dim hover:text-chalk`}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className={`${buttonClass} border-line text-chalk-dim hover:text-chalk`}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
