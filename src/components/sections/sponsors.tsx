import Image from "next/image";
import { SeamDivider } from "@/components/seam-divider";
import { otherSponsors } from "@/lib/sponsors";

export function Sponsors() {
  if (otherSponsors.length === 0) return null;

  return (
    <>
      <section id="sponsors" className="py-16 sm:py-20">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">
            Thank you to our sponsors
          </span>
          <h2 className="font-display mt-3 text-3xl font-extrabold uppercase sm:text-4xl">Sponsors</h2>
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {otherSponsors.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="border-line hover:border-clay-bright flex h-28 items-center justify-center border bg-white p-3 transition-colors sm:h-32"
                >
                  <Image
                    src={s.logo}
                    alt={s.name}
                    width={s.logoWidth}
                    height={s.logoHeight}
                    className="max-h-full w-auto object-contain"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <SeamDivider />
    </>
  );
}
