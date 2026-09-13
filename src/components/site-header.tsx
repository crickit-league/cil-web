"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrestBadge } from "./crest-badge";
import { UserMenu } from "./user-menu";

const NAV = [
  { href: "#format", label: "Format" },
  { href: "#registration-form", label: "Register" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  const sectionHref = (hash: string) => (onHome ? hash : `/${hash}`);

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
              className="font-data text-chalk-dim hover:border-clay hover:text-chalk border-b border-transparent text-xs tracking-[0.1em] uppercase transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Link
            href={sectionHref("#registration-form")}
            className="font-data border-clay bg-clay text-pitch-deep hover:border-clay-bright hover:bg-clay-bright inline-flex items-center gap-2 border px-4 py-3 text-xs tracking-[0.08em] uppercase transition-colors sm:px-5"
          >
            <span className="sm:hidden">Register</span>
            <span className="hidden sm:inline">Register Team</span>
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
