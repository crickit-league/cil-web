"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type AdminNavIcon = "registration" | "super-admin";
export type AdminNavItem = { href: string; label: string; icon: AdminNavIcon };

const STORAGE_KEY = "cil-admin-nav-collapsed";

const ICON_PATHS: Record<AdminNavIcon, React.ReactNode> = {
  // Clipboard with checklist lines
  registration: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="1.5" />
      <path d="M9 4V3h6v1M9 11h6M9 15h6" />
    </>
  ),
  // Shield with a check
  "super-admin": (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
};

function NavIcon({ name }: { name: AdminNavIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

// Left sidebar at `md` and up (collapsible to an icon rail, remembered per
// browser); a horizontally scrollable tab strip below it, so it works at
// phone width without eating vertical space. Collapse only applies at `md`+.
export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Read after mount so server and first client render match.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // storage unavailable — stay expanded
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <nav
      aria-label="Admin sections"
      className={`border-line -mx-5 flex gap-1 overflow-x-auto border-b px-5 sm:-mx-8 sm:px-8 md:mx-0 md:shrink-0 md:flex-col md:overflow-visible md:border-r md:border-b-0 md:px-0 md:pr-3 ${
        collapsed ? "md:w-14" : "md:w-52"
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        title={collapsed ? "Expand navigation" : "Collapse navigation"}
        className="text-chalk-dim hover:text-chalk hidden items-center gap-3 px-3 py-3 transition-colors md:flex"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 transition-transform ${collapsed ? "rotate-180" : ""}`}
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
        <span className={`font-data text-xs tracking-[0.1em] uppercase ${collapsed ? "md:hidden" : ""}`}>
          Collapse
        </span>
      </button>

      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            title={item.label}
            className={`font-data -mb-px flex shrink-0 items-center gap-3 border-b-2 px-4 py-3 text-xs tracking-[0.1em] whitespace-nowrap uppercase transition-colors md:mb-0 md:border-b-0 md:border-l-2 md:px-3 ${
              active ? "border-clay text-chalk" : "text-chalk-dim hover:text-chalk border-transparent"
            }`}
          >
            <NavIcon name={item.icon} />
            <span className={collapsed ? "md:sr-only" : ""}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
