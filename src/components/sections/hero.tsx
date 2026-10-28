import Image from "next/image";
import { titleSponsor } from "@/lib/sponsors";

// The home page's opening band, kept from the registration-era hero at the
// committee's request (2026-10-28): the faded crest watermark, the drifting
// lattice with its light glint, the "presented by" title sponsor and a short
// line about the league. Shorter than before so the photos still show early.

export function Hero() {
  return (
    <section className="hero-texture hero-crest-watermark relative overflow-hidden pt-10 pb-8 sm:pt-14 sm:pb-10 lg:pt-16">
      <div className="relative z-10 mx-auto max-w-[1180px] px-5 sm:px-8">
        <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">
          Metro Atlanta &middot; Est. 2013
        </span>
        <h1 className="font-display mt-3 text-[2.6rem] leading-[0.92] font-extrabold text-balance uppercase sm:text-[3.75rem] lg:text-[4.75rem]">
          CIL Winter League
          <br />
          <span className="text-clay">Championship</span>
        </h1>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          {titleSponsor ? (
            <div className="flex shrink-0 items-center gap-4">
              <span className="font-data text-chalk-dim text-[0.68rem] tracking-[0.18em] uppercase">
                Presented by
              </span>
              <a
                href={titleSponsor.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${titleSponsor.name} (opens Instagram)`}
                className="border-line hover:border-clay-bright block overflow-hidden rounded-lg border bg-white p-1.5 transition-colors"
              >
                <span className="relative block aspect-[2.45/1] w-[140px] overflow-hidden rounded sm:w-[170px]">
                  <Image
                    src={titleSponsor.logo}
                    alt={`${titleSponsor.name} logo`}
                    fill
                    priority
                    sizes="(min-width: 640px) 170px, 140px"
                    className="scale-[1.08] object-cover"
                  />
                </span>
              </a>
            </div>
          ) : null}
          <p className="text-chalk-dim sm:border-line max-w-[46ch] sm:border-l sm:pl-8">
            Over 13 years of weekend cricket at Atlanta continues with another exciting season. The
            2026&ndash;27 league stage began October 24 &mdash; results, photos and the table are below.
          </p>
        </div>
      </div>
    </section>
  );
}
