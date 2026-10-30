import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Globe, MapPin, Phone } from "lucide-react";
import { SectionTitle } from "@/components/section-title";
import { otherSponsors, titleSponsor } from "@/lib/sponsors";

export const metadata: Metadata = {
  title: "Sponsors",
  description: "The partners behind the CIL Winter League, and where to find them.",
};

const buttonBase =
  "font-display inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-lg leading-none font-extrabold tracking-wide uppercase transition-colors";

function TitleSponsor() {
  if (!titleSponsor?.details) return null;
  const { details } = titleSponsor;

  return (
    <section
      aria-labelledby="title-sponsor"
      className="border-line bg-dugout grid overflow-hidden rounded-lg border shadow-sm md:grid-cols-[minmax(0,20rem)_1fr]"
    >
      <div className="border-line flex items-center justify-center border-b bg-white p-8 md:border-r md:border-b-0">
        <Image
          src={titleSponsor.logo}
          alt={`${titleSponsor.name} logo`}
          width={titleSponsor.logoWidth}
          height={titleSponsor.logoHeight}
          priority
          className="h-auto w-full max-w-[16rem]"
        />
      </div>

      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div>
          <span className="bg-clay text-on-accent font-display inline-block rounded px-3 py-1 text-sm leading-none font-extrabold tracking-wide uppercase">
            Title sponsor
          </span>
          <h2
            id="title-sponsor"
            className="font-display mt-3 text-4xl leading-none font-extrabold tracking-wide uppercase"
          >
            {titleSponsor.name}
          </h2>
          <p className="text-clay-bright mt-2 font-semibold">{details.tagline}</p>
        </div>

        <p className="text-chalk-dim max-w-[60ch]">{details.about}</p>

        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex items-start gap-2">
            <MapPin className="text-clay mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{details.address}</span>
          </li>
          <li className="flex items-center gap-2">
            <Phone className="text-clay size-4 shrink-0" aria-hidden="true" />
            <a href={`tel:${details.phone.tel}`} className="hover:text-clay-bright">
              {details.phone.display}
            </a>
          </li>
        </ul>

        <div className="flex flex-wrap gap-3">
          <a
            href={titleSponsor.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonBase} bg-clay text-on-accent hover:bg-clay-bright`}
          >
            <Globe className="size-5" aria-hidden="true" />
            Visit website
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <a
            href={details.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonBase} border-line hover:border-clay hover:text-clay border`}
          >
            Instagram
            <ArrowUpRight className="size-5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default function SponsorsPage() {
  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-10 px-5 sm:px-8">
        <SectionTitle as="h1" eyebrow="Thank you to our sponsors" title="Our sponsors" />
        <TitleSponsor />

        {otherSponsors.length > 0 ? (
          <section aria-labelledby="partners" className="flex flex-col gap-4">
            <h2 id="partners" className="font-display text-2xl font-extrabold tracking-wide uppercase">
              Partners
            </h2>
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
          </section>
        ) : null}
      </div>
    </section>
  );
}
