import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { HomeMatchCard } from "@/components/home/home-match-card";
import { SectionTitle } from "@/components/section-title";
import { getMomEntry } from "@/lib/services/photos";

// A photo from the home carousel (usually a Man of the Match shot) on its own:
// the picture, its title and write-up, and the match it is linked to.

// Photos and results change with uploads and imports; refresh at most once a minute.
export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const entry = await getMomEntry(id);
  if (!entry) return { title: "Photo · CIL Winter League" };
  const title = entry.title ?? entry.caption ?? "Man of the match";
  return {
    title: `${title} · CIL Winter League`,
    description: entry.body?.split("\n\n")[0] ?? "A photo from the CIL Winter League.",
  };
}

export default async function MomPage({ params }: Props) {
  const { id } = await params;
  const entry = await getMomEntry(id);
  if (!entry) notFound();

  const heading = entry.title ?? entry.caption ?? "Match photo";
  const paragraphs = entry.body ? entry.body.split(/\n{2,}/).filter(Boolean) : [];

  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 sm:px-8">
        <Link
          href="/"
          className="font-data text-chalk-dim hover:text-clay-bright inline-flex items-center gap-2 self-start text-xs tracking-[0.1em] uppercase transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to home
        </Link>

        <div className="grid gap-8 sm:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] sm:items-start lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <figure className="border-line bg-pitch-deep mx-auto w-full max-w-sm overflow-hidden rounded-lg border sm:mx-0 sm:max-w-none">
            <Image
              src={entry.url}
              alt={heading}
              width={entry.width}
              height={entry.height}
              priority
              sizes="(min-width: 1024px) 416px, (min-width: 640px) 352px, 100vw"
              className="h-auto w-full"
            />
          </figure>

          <div className="flex flex-col gap-6">
            <SectionTitle as="h1" eyebrow="Man of the match" title={heading} />

            {paragraphs.length > 0 ? (
              <div className="flex max-w-[60ch] flex-col gap-4 text-lg">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-chalk-dim">
                    {p}
                  </p>
                ))}
              </div>
            ) : null}

            {entry.caption && entry.title ? (
              <p className="text-chalk-faint text-sm">{entry.caption}</p>
            ) : null}

            {entry.match ? (
              <section aria-labelledby="mom-match" className="flex flex-col gap-3">
                <h2 id="mom-match" className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">
                  The match
                </h2>
                <HomeMatchCard m={entry.match} />
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
