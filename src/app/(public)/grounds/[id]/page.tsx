import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronDown, MapPin, Navigation } from "lucide-react";
import {
  fieldChipLabel,
  groundAppleMapsHref,
  groundDirectionsHref,
  groundEmbedSrc,
  groundWazeHref,
} from "@/lib/grounds";
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

            {/* One Directions button that lets the visitor pick the maps app (a plain <details>: no script). */}
            <details className="relative w-fit">
              <summary
                className={`${linkButton} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
              >
                <Navigation className="size-4" aria-hidden="true" />
                Directions
                <ChevronDown className="size-4" aria-hidden="true" />
              </summary>
              <ul className="border-line bg-dugout absolute z-10 mt-1 flex min-w-full flex-col overflow-hidden rounded-[6px] border shadow-lg">
                {[
                  { name: "Google Maps", href: groundDirectionsHref(ground) },
                  { name: "Apple Maps", href: groundAppleMapsHref(ground) },
                  { name: "Waze", href: groundWazeHref(ground) },
                ].map((app) => (
                  <li key={app.name}>
                    <a
                      href={app.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-clay block px-4 py-3 text-sm whitespace-nowrap"
                    >
                      {app.name}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          {/* Google's keyless embed: a map with the pin on the ground. Not on phones: the
              Directions menu covers them (and a lazy iframe in a
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
