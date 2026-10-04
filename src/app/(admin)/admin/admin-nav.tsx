"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = { href: string; label: string };

// Left sidebar at `md` and up; a horizontally scrollable tab strip below it,
// so it works at phone width without eating vertical space.
export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="border-line -mx-5 flex gap-1 overflow-x-auto border-b px-5 sm:-mx-8 sm:px-8 md:mx-0 md:w-52 md:shrink-0 md:flex-col md:overflow-visible md:border-r md:border-b-0 md:px-0 md:pr-6"
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`font-data -mb-px shrink-0 border-b-2 px-4 py-3 text-xs tracking-[0.1em] whitespace-nowrap uppercase transition-colors md:mb-0 md:border-b-0 md:border-l-2 ${
              active ? "border-clay text-chalk" : "text-chalk-dim hover:text-chalk border-transparent"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
