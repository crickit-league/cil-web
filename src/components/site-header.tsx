"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

        {/* One nav for every width: inline on desktop, its own full-width row
            under the logo on phones (all five items fit at 375px). */}
        <nav
          aria-label="Main"
          className="order-last flex w-full items-center justify-between gap-3 md:order-none md:w-auto md:justify-start md:gap-8"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={sectionHref(item.href)}
              onClick={item.href === "/" ? handleLogoClick : undefined}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={`font-data hover:border-clay hover:text-chalk border-b py-1 text-[0.68rem] tracking-[0.06em] whitespace-nowrap uppercase transition-colors md:py-0 md:text-xs md:tracking-[0.1em] ${
                isCurrent(item.href) ? "border-clay text-chalk" : "text-chalk-dim border-transparent"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <UserMenu />
      </div>
    </header>
  );
}
