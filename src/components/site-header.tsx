"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrestBadge } from "./crest-badge";
import { UserMenu } from "./user-menu";

// Hash links scroll to a home-page section; plain paths are their own pages.
const NAV = [
  { href: "/league", label: "League" },
  { href: "#format", label: "Format" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  const sectionHref = (href: string) => (!href.startsWith("#") || onHome ? href : `/${href}`);
  const isCurrent = (href: string) =>
    !href.startsWith("#") && (pathname === href || pathname.startsWith(`${href}/`));

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (onHome) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="border-line bg-pitch/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
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

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={sectionHref(item.href)}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={`font-data hover:border-clay hover:text-chalk border-b text-xs tracking-[0.1em] uppercase transition-colors ${
                isCurrent(item.href) ? "border-clay text-chalk" : "text-chalk-dim border-transparent"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          {/* The nav above is hidden on phones, so the league pages get a
              button there (fixtures and umpire entry live under it). */}
          {isCurrent("/league") ? null : (
            <Link
              href="/league"
              className="font-data border-clay bg-clay text-pitch-deep hover:border-clay-bright hover:bg-clay-bright inline-flex items-center gap-2 border px-4 py-3 text-xs tracking-[0.08em] uppercase transition-colors md:hidden"
            >
              League
            </Link>
          )}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
