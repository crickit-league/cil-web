"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CrestBadge } from "./crest-badge";
import { UserMenu } from "./user-menu";

// Hash links scroll to a home-page section; plain paths are their own pages.
// The league pages keep their /league/... URLs (the points-table work builds
// on them) but are top-level items here. Results are shown on Fixtures.
const NAV = [
  { href: "/", label: "Home" },
  { href: "/league/fixtures", label: "Fixtures" },
  { href: "/league/points-table", label: "Points Table" },
  { href: "/rules", label: "Rules" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  // Phone menu. Remembering the page it was opened on makes it close by itself
  // when you navigate, with no effect needed.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuOpen = openOn === pathname;
  const closeMenu = () => setOpenOn(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const sectionHref = (href: string) => (!href.startsWith("#") || onHome ? href : `/${href}`);
  // Home only on "/" itself; a league item also on the pages under it (e.g. a fixture's page).
  const isCurrent = (href: string) =>
    href === "/" ? onHome : !href.startsWith("#") && (pathname === href || pathname.startsWith(`${href}/`));

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (onHome) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="border-line bg-pitch/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-x-6 px-5 py-3 sm:px-8 md:py-4">
        <Link href="/" onClick={handleLogoClick} className="flex items-center gap-3">
          <CrestBadge size={42} />
          <span className="flex flex-col gap-0.5">
            <span className="font-display text-xl leading-none font-extrabold tracking-wide uppercase">
              Crick-It
            </span>
            <span className="font-data text-chalk-dim text-[0.62rem] tracking-[0.16em] uppercase">
              Inter League
            </span>
          </span>
        </Link>

        {/* Desktop: inline nav. Phones use the hamburger menu below instead. */}
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={sectionHref(item.href)}
              onClick={item.href === "/" ? handleLogoClick : undefined}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={`font-data hover:border-clay hover:text-chalk border-b text-xs tracking-[0.1em] whitespace-nowrap uppercase transition-colors ${
                isCurrent(item.href) ? "border-clay text-chalk" : "text-chalk-dim border-transparent"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <UserMenu />
          <button
            type="button"
            onClick={() => setOpenOn(menuOpen ? null : pathname)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="border-line text-chalk-dim hover:border-chalk-dim hover:text-chalk flex h-9 w-9 items-center justify-center border transition-colors md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav id="mobile-nav" aria-label="Main" className="border-line bg-pitch border-t md:hidden">
          <ul className="mx-auto flex max-w-[1180px] flex-col px-5 py-2 sm:px-8">
            {NAV.map((item) => (
              <li key={item.href} className="border-line border-b last:border-b-0">
                <Link
                  href={sectionHref(item.href)}
                  onClick={(event) => {
                    if (item.href === "/") handleLogoClick(event);
                    closeMenu();
                  }}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className={`font-data block border-l-2 py-3.5 pl-3 text-sm tracking-[0.1em] uppercase transition-colors ${
                    isCurrent(item.href)
                      ? "border-clay text-chalk"
                      : "text-chalk-dim hover:text-chalk border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
