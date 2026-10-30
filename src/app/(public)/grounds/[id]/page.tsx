import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, Navigation } from "lucide-react";
import { fieldChipLabel, groundDirectionsHref, groundEmbedSrc, groundMapsHref } from "@/lib/grounds";
import { getGround } from "@/lib/services/grounds";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const ground = await getGround((await params).id);
  return {
    title: ground?.name ?? "Ground",
    description: ground ? `${ground.name}: address, fields and a map.` : undefined,
  };
}

const linkButton =
  "font-data border-line hover:border-clay hover:text-clay inline-flex items-center gap-2 rounded-[6px] border px-4 py-2.5 text-xs tracking-[0.08em] uppercase transition-colors";

export default async function GroundPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ field?: string }>;
}) {
  const ground = await getGround((await params).id);
  const { field: currentFieldId } = await searchParams;
  if (!ground) notFound();

  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 sm:px-8">
        <Link
          href="/grounds"
          className="font-data text-chalk-dim hover:text-chalk inline-flex items-center gap-2 self-start text-xs tracking-[0.08em] uppercase"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All grounds
        </Link>

        <h1 className="font-display text-[2.5rem] leading-none font-extrabold uppercase sm:text-[3.5rem]">
          {ground.name}
        </h1>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div className="bg-dugout border-line flex flex-col gap-5 rounded-[10px] border p-5">
            <div className="flex flex-col gap-1.5">
              <span className="font-data text-chalk-faint text-[0.62rem] tracking-[0.12em] uppercase">
                Address
              </span>
              <p className="flex items-start gap-2">
                <MapPin className="text-clay mt-0.5 size-5 shrink-0" aria-hidden="true" />
                {ground.address ?? <span className="text-chalk-dim">To be confirmed</span>}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-data text-chalk-faint text-[0.62rem] tracking-[0.12em] uppercase">
                {ground.fields.length === 1 ? "Field" : "Fields"}
              </span>
              <ul className="flex flex-wrap gap-1.5">
                {ground.fields.map((field) => (
                  <li
                    key={field.id}
                    aria-current={field.id === currentFieldId ? "true" : undefined}
                    className={`rounded-full border px-3 py-1 text-sm whitespace-nowrap ${
                      field.id === currentFieldId
                        ? "border-clay text-clay font-semibold"
                        : "border-line text-chalk"
                    }`}
                  >
                    {fieldChipLabel(field.label)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={groundDirectionsHref(ground)}
                target="_blank"
                rel="noopener noreferrer"
                className={linkButton}
              >
                <Navigation className="size-4" aria-hidden="true" />
                Directions
              </a>
              <a
                href={groundMapsHref(ground)}
                target="_blank"
                rel="noopener noreferrer"
                className={linkButton}
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Open in Google Maps
              </a>
            </div>
          </div>

          {/* Google's keyless embed: a map with the pin on the ground. Not on phones: the
              Directions and Open in Google Maps buttons cover them (and a lazy iframe in a
              hidden box isn't fetched). */}
          <div className="border-line bg-dugout hidden aspect-[4/3] overflow-hidden rounded-[10px] border sm:block lg:aspect-auto lg:min-h-[24rem]">
            <iframe
              title={`Map of ${ground.name}`}
              src={groundEmbedSrc(ground)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
