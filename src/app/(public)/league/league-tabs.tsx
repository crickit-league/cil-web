"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// One tab per route segment under /league. To add a tab, add its folder
// (e.g. league/results/page.tsx) and an entry here.
export const LEAGUE_TABS = [
  { href: "/league/fixtures", label: "Fixtures" },
  { href: "/league/results", label: "Results" },
  { href: "/league/points-table", label: "Points Table" },
] as const;

export function LeagueTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="League" className="border-line -mx-5 overflow-x-auto border-b px-5 sm:mx-0 sm:px-0">
      <ul className="flex gap-6 sm:gap-8">
        {LEAGUE_TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`font-data -mb-px inline-block border-b-2 py-3 text-xs tracking-[0.1em] whitespace-nowrap uppercase transition-colors ${
                  active
                    ? "border-clay text-chalk"
                    : "text-chalk-dim hover:text-chalk hover:border-line border-transparent"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
