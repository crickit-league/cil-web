"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { CrestBadge } from "./crest-badge";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";

// Hash links scroll to a home-page section; plain paths are their own pages.
// The league pages keep their /league/... URLs (the points-table work builds
// on them) but are top-level items here. Results are shown on Fixtures.
const NAV = [
  { href: "/", label: "Home" },
  { href: "/league/fixtures", label: "Fixtures" },
  { href: "/league/points-table", label: "Points Table" },
  { href: "/rules", label: "Rules" },
  { href: "/contact", label: "Contact" },
];

// Sign in / Sign out sits at the end of the menu as an outlined pill, apart from the page links.
const authPill =
  "font-display border-line text-chalk hover:border-clay hover:text-clay rounded-full border px-4 py-2 text-lg leading-none font-bold tracking-wide whitespace-nowrap uppercase transition-colors";

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const signedIn = Boolean(session?.user);
  const isAdmin = Boolean(
    session?.user?.roles?.includes("ADMIN") || session?.user?.roles?.includes("SUPER_ADMIN"),
  );
  // Admins get a Control Panel option after the public pages; Sign in / Sign out is the last item.
  const links = isAdmin ? [...NAV, { href: "/admin", label: "Control Panel" }] : NAV;
  const who = session?.user?.name || session?.user?.email || "";
  const onHome = pathname === "/";
  // Phone menu. Remembering the page it was opened on makes it close by itself
  // when you navigate, with no effect needed.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuOpen = openOn === pathname;

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

  const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (onHome) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="bg-dugout/95 border-line sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-x-6 px-5 py-2.5 sm:px-8">
        <Link href="/" onClick={handleHomeClick} className="flex items-center gap-3">
          <CrestBadge size={44} />
          <span className="flex flex-col gap-1">
            <span className="font-display text-xl leading-none font-extrabold tracking-wide uppercase">
              Crick-It
            </span>
            <span className="font-data text-chalk-dim text-[0.62rem] leading-none tracking-[0.16em] uppercase">
              Inter League
            </span>
          </span>
        </Link>

        {/* Desktop: inline nav, the current page as a filled pill. Phones use the menu below. */}
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((item) => {
            const current = isCurrent(item.href);
            return (
              <Link
                key={item.href}
                href={sectionHref(item.href)}
                onClick={item.href === "/" ? handleHomeClick : undefined}
                aria-current={current ? "page" : undefined}
                className={`font-display rounded-full px-4 py-2 text-lg leading-none font-bold tracking-wide whitespace-nowrap uppercase transition-colors ${
                  current ? "bg-clay text-on-accent" : "text-chalk-dim hover:bg-pitch-deep hover:text-chalk"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {status === "loading" ? null : signedIn ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              title={who ? `Signed in as ${who}` : undefined}
              className={`${authPill} ml-2 cursor-pointer`}
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              aria-current={pathname.startsWith("/login") ? "page" : undefined}
              className={`${authPill} ml-2`}
            >
              Sign in
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpenOn(menuOpen ? null : pathname)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="border-line text-chalk-dim hover:border-clay hover:text-clay flex h-9 w-9 items-center justify-center rounded-full border transition-colors md:hidden"
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav id="mobile-nav" aria-label="Main" className="border-line border-t md:hidden">
          <ul className="mx-auto flex max-w-[1180px] flex-col px-5 py-2 sm:px-8">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={sectionHref(item.href)}
                  onClick={(event) => {
                    if (item.href === "/") handleHomeClick(event);
                    setOpenOn(null);
                  }}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className={`font-display my-1 block rounded-lg px-3 py-2.5 text-xl font-bold tracking-wide uppercase transition-colors ${
                    isCurrent(item.href) ? "bg-clay text-on-accent" : "text-chalk hover:bg-pitch-deep"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {status === "loading" ? null : (
              <li className="border-line mt-1 border-t pt-2">
                {signedIn ? (
                  <>
                    {who ? (
                      <p className="font-data text-chalk-faint truncate px-3 pb-1 text-[0.68rem] tracking-[0.08em] uppercase">
                        Signed in as {who}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="font-display text-chalk hover:bg-pitch-deep my-1 block w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-xl font-bold tracking-wide uppercase transition-colors"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpenOn(null)}
                    className="font-display text-chalk hover:bg-pitch-deep my-1 block rounded-lg px-3 py-2.5 text-xl font-bold tracking-wide uppercase transition-colors"
                  >
                    Sign in
                  </Link>
                )}
              </li>
            )}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
