import Link from "next/link";
import { CrestBadge } from "./crest-badge";
import { UserMenu } from "./user-menu";

const NAV = [
  { href: "#format", label: "Format" },
  { href: "#registration-form", label: "Register" },
  { href: "#prizes", label: "Prizes" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="border-line bg-pitch/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
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
            <a
              key={item.href}
              href={item.href}
              className="font-data text-chalk-dim hover:border-clay hover:text-chalk border-b border-transparent text-xs tracking-[0.1em] uppercase transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <a
            href="#registration-form"
            className="font-data border-clay bg-clay text-chalk hover:border-clay-bright hover:bg-clay-bright inline-flex items-center gap-2 border px-4 py-3 text-xs tracking-[0.08em] uppercase transition-colors sm:px-5"
          >
            <span className="sm:hidden">Register</span>
            <span className="hidden sm:inline">Register Team</span>
          </a>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
