import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { fieldChipLabel } from "@/lib/grounds";
import { listGrounds, type PublicGround } from "@/lib/services/grounds";

// Grounds change when the schedule import meets a new one or an admin edits one.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Grounds",
  description: "Where the CIL Winter League plays: each ground, its address and its fields.",
};

const chip = "border-line text-chalk rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap";

function FieldChips({ ground }: { ground: PublicGround }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {ground.fields.map((field) => (
        <li key={field.id} className={chip}>
          {fieldChipLabel(field.label)}
        </li>
      ))}
    </ul>
  );
}

export default async function GroundsPage() {
  const grounds = await listGrounds();

  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <h1 className="font-display mb-2 text-[2.5rem] leading-none font-extrabold uppercase sm:text-[3.5rem]">
          Grounds
        </h1>
        <p className="text-chalk-dim mb-6 text-sm">Where we play. Tap a ground for its fields and a map.</p>

        {grounds === null || grounds.length === 0 ? (
          <p className="border-line bg-dugout text-chalk-dim rounded-[10px] border p-6 text-sm">
            {grounds === null
              ? "The grounds couldn't be loaded right now. Try again shortly."
              : "No grounds have been added yet."}
          </p>
        ) : (
          <>
            {/* Phones: a stacked list, one tappable row per ground. */}
            <ul className="bg-dugout border-line divide-line divide-y overflow-hidden rounded-[10px] border sm:hidden">
              {grounds.map((ground) => (
                <li key={ground.id}>
                  <Link
                    href={`/grounds/${ground.id}`}
                    className="hover:bg-dugout-2 flex items-center gap-3 px-4 py-3 transition-colors"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-display text-xl leading-tight font-bold uppercase">
                        {ground.name}
                      </span>
                      <span className="text-chalk-dim truncate text-sm">
                        {ground.address ?? "Address to be confirmed"}
                      </span>
                      <span className="text-chalk-faint text-xs">
                        {ground.fields.length === 1 ? "1 field" : `${ground.fields.length} fields`}
                      </span>
                    </span>
                    <ChevronRight className="text-chalk-faint size-5 shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>

            {/* From sm: a table, with the whole row a link to the ground. */}
            <div className="bg-dugout border-line hidden overflow-hidden rounded-[10px] border sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-line font-data text-chalk-faint border-b text-[0.68rem] tracking-[0.1em] uppercase">
                    <th scope="col" className="px-4 py-3 font-normal">
                      Ground
                    </th>
                    <th scope="col" className="px-4 py-3 font-normal">
                      Address
                    </th>
                    <th scope="col" className="px-4 py-3 font-normal">
                      Fields
                    </th>
                    <th scope="col" className="w-10 px-4 py-3">
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-line divide-y">
                  {grounds.map((ground) => (
                    <tr key={ground.id} className="hover:bg-dugout-2 relative transition-colors">
                      <th scope="row" className="px-4 py-3 align-top">
                        {/* The link's ::after covers the row, so a click anywhere on it opens the ground. */}
                        <Link
                          href={`/grounds/${ground.id}`}
                          className="font-display text-xl leading-tight font-bold uppercase after:absolute after:inset-0"
                        >
                          {ground.name}
                        </Link>
                      </th>
                      <td className="text-chalk-dim px-4 py-3 align-top">
                        {ground.address ? (
                          <span className="flex items-start gap-1.5">
                            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {ground.address}
                          </span>
                        ) : (
                          <span className="text-chalk-faint">Address to be confirmed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <FieldChips ground={ground} />
                      </td>
                      <td className="text-chalk-faint px-4 py-3 align-middle">
                        <ChevronRight className="size-5" aria-hidden="true" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
