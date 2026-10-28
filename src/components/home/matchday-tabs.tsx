"use client";

import { useId, useState } from "react";

// Results / Fixtures switch on the home page. Both panels are rendered on the
// server; this only decides which one shows. The server picks the opening tab
// (results early in the week, fixtures from Thursday — see pickMatchday).

/** `detail` (the dates) goes on its own line under the label, so both tabs fit a phone. */
export type MatchdayTab = { key: string; label: string; detail: string | null; content: React.ReactNode };

export function MatchdayTabs({ tabs, initial }: { tabs: MatchdayTab[]; initial: string }) {
  const [active, setActive] = useState(tabs.some((t) => t.key === initial) ? initial : tabs[0]?.key);
  const baseId = useId();

  return (
    <div className="flex flex-col gap-6">
      {tabs.length > 1 ? (
        <div
          role="tablist"
          aria-label="Results or fixtures"
          className="border-line bg-pitch-deep flex w-full max-w-md border p-1"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.key}`}
              aria-selected={tab.key === active}
              aria-controls={`${baseId}-panel-${tab.key}`}
              onClick={() => setActive(tab.key)}
              className={`font-data flex flex-1 flex-col items-center gap-0.5 px-3 py-2 text-[0.68rem] tracking-[0.08em] uppercase transition-colors ${
                tab.key === active ? "bg-chalk text-pitch" : "text-chalk-dim hover:text-chalk"
              }`}
            >
              <span>{tab.label}</span>
              {tab.detail ? (
                <span className={tab.key === active ? "text-pitch/70" : "text-chalk-faint"}>
                  {tab.detail}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {tabs.map((tab) => (
        <div
          key={tab.key}
          role={tabs.length > 1 ? "tabpanel" : undefined}
          id={`${baseId}-panel-${tab.key}`}
          aria-labelledby={tabs.length > 1 ? `${baseId}-tab-${tab.key}` : undefined}
          hidden={tab.key !== active}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
