import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { otherSponsors, titleSponsor } from "@/lib/sponsors";

/** Home page partners band: the title sponsor (with a link to their page) and any other sponsors. */
export function Sponsors() {
  if (!titleSponsor && otherSponsors.length === 0) return null;

  return (
    <section id="sponsors" aria-labelledby="home-sponsors" className="py-12 sm:py-16">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-5 sm:px-8">
        <SectionTitle eyebrow="Thank you to our sponsors" title="Partners" id="home-sponsors" />

        {titleSponsor ? (
          <div className="border-line bg-dugout flex flex-col items-start gap-5 rounded-lg border p-5 shadow-sm sm:flex-row sm:items-center sm:gap-8 sm:p-6">
            <a
              href={titleSponsor.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${titleSponsor.name} website (opens in a new tab)`}
              className="border-line lift block shrink-0 rounded-lg border bg-white p-3"
            >
              <Image
                src={titleSponsor.logo}
                alt=""
                width={titleSponsor.logoWidth}
                height={titleSponsor.logoHeight}
                className="h-auto w-48"
              />
            </a>
            <div className="flex min-w-0 flex-col gap-2">
              <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">
                Title sponsor
              </span>
              <h3 className="font-display text-3xl leading-none font-extrabold tracking-wide uppercase">
                {titleSponsor.name}
              </h3>
              {titleSponsor.details ? <p className="text-chalk-dim">{titleSponsor.details.tagline}</p> : null}
              <Link
                href="/sponsors"
                className="font-display text-clay hover:text-clay-bright mt-1 inline-flex items-center gap-1.5 self-start text-lg font-bold tracking-wide uppercase"
              >
                Meet our sponsor
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : null}

        {otherSponsors.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {otherSponsors.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.name} (opens in a new tab)`}
                  className="border-line lift flex h-28 items-center justify-center rounded-lg border bg-white p-3 sm:h-32"
                >
                  <Image
                    src={s.logo}
                    alt=""
                    width={s.logoWidth}
                    height={s.logoHeight}
                    className="max-h-full w-auto object-contain"
                  />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
