import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { titleSponsor } from "@/lib/sponsors";

// The banner under the score ticker: the league's name, a line about the league,
// two calls to action and the title sponsor, kept short so a phone still gets to
// the photos and scores quickly. Wider screens put the buttons and sponsor beside
// the headline. The drifting lattice with its light glint (hero-texture in globals.css) is kept
// from the original home page at the committee's request (2026-10-28); the crest
// watermark lives in the app-wide background (app-bg) instead.

const buttonBase =
  "font-display inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-base leading-none font-extrabold tracking-wide uppercase transition-colors sm:text-lg";

export function HomeHero() {
  return (
    <section className="hero-bg hero-texture on-brand relative isolate overflow-hidden">
      <div className="relative z-10 mx-auto flex max-w-[1180px] flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8 sm:py-9">
        <div>
          <span className="font-data text-clay inline-flex items-center gap-2 text-[0.68rem] tracking-[0.2em] uppercase sm:text-xs">
            <span aria-hidden="true" className="bg-clay h-px w-6 sm:w-8" />
            Atlanta &middot; Season 2026&ndash;27
          </span>
          <h1 className="font-display mt-2 text-[2.1rem] leading-[0.95] font-extrabold tracking-wide uppercase sm:text-5xl lg:text-6xl">
            CIL Winter League <span className="text-clay">Championship</span>
          </h1>
          <p className="text-chalk-dim mt-3 max-w-[50ch] text-sm sm:text-base">
            Over 13 years of weekend cricket at Atlanta continues with another exciting season. The
            2026&ndash;27 league stage began October 24.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <Link
              href="/league/fixtures"
              className={`${buttonBase} bg-clay text-on-accent hover:bg-clay-bright`}
            >
              Fixtures
              <ArrowRight className="size-4 sm:size-5" aria-hidden="true" />
            </Link>
            <Link
              href="/league/points-table"
              className={`${buttonBase} border-chalk/40 hover:border-clay hover:text-clay border`}
            >
              Points table
            </Link>
          </div>
          {titleSponsor ? (
            <a
              href={titleSponsor.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Presented by ${titleSponsor.name} (opens their website)`}
              className="inline-flex items-center gap-3"
            >
              <span className="font-data text-chalk-dim text-[0.62rem] tracking-[0.16em] uppercase">
                Presented by
              </span>
              <span className="block overflow-hidden rounded bg-white p-1">
                <span className="relative block aspect-[2.45/1] w-[96px] overflow-hidden rounded-sm">
                  <Image
                    src={titleSponsor.logo}
                    alt=""
                    fill
                    sizes="96px"
                    className="scale-[1.08] object-cover"
                  />
                </span>
              </span>
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
