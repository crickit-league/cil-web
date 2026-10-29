import Link from "next/link";
import { CrestBadge } from "./crest-badge";
import { PresentedBy } from "./presented-by";

const LINKS = [
  { href: "/league/fixtures", label: "Fixtures & results" },
  { href: "/league/points-table", label: "Points table" },
  { href: "/grounds", label: "Grounds" },
  { href: "/sponsors", label: "Our sponsors" },
  { href: "/contact", label: "Contact the committee" },
  { href: "/login", label: "Admin" },
];

const heading = "font-data text-clay text-[0.7rem] tracking-[0.18em] uppercase";

export function SiteFooter() {
  return (
    <footer className="bg-dugout border-line border-t">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <CrestBadge size={56} />
            <span className="flex flex-col gap-1">
              <span className="font-display text-2xl leading-none font-extrabold tracking-wide uppercase">
                Crick-It
              </span>
              <span className="font-data text-chalk-dim text-[0.62rem] leading-none tracking-[0.16em] uppercase">
                Inter League
              </span>
            </span>
          </div>
          <p className="text-chalk-dim max-w-[38ch] text-sm">
            Atlanta&rsquo;s weekend cricket league: F15, hard tennis ball, on the city&rsquo;s baseball fields
            since 2013.
          </p>
          <PresentedBy size="lg" stacked className="mt-1" />
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-3">
          <h2 className={heading}>Explore</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-chalk-dim hover:text-clay transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-3">
          <h2 className={heading}>Get in touch</h2>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <a
                href="mailto:registration@crickitinterleague.org"
                className="text-chalk-dim hover:text-clay break-all transition-colors"
              >
                registration@crickitinterleague.org
              </a>
            </li>
            <li>
              <a
                href="mailto:admin@crickitinterleague.org"
                className="text-chalk-dim hover:text-clay break-all transition-colors"
              >
                admin@crickitinterleague.org
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-line border-t">
        <div className="font-data text-chalk-faint mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-4 text-[0.68rem] tracking-[0.08em] uppercase sm:px-8">
          <span>Atlanta, GA &middot; Est. 2013</span>
          <span>2026&ndash;27 Season</span>
        </div>
      </div>
    </footer>
  );
}
