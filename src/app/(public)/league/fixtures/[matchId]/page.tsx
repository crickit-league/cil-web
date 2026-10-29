import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { listMatchPictures } from "@/lib/services/photos";
import { STAGE_LABEL } from "@/lib/import/schedule-plan";
import { getPublicFixture } from "@/lib/services/schedule";
import { FixtureCard } from "../fixture-card";

const sectionTitle = "font-display border-line border-b pb-2 text-[1.4rem] font-extrabold uppercase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fixture",
  // One page per fixture adds nothing to search results.
  robots: { index: false },
};

export default async function FixturePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const fixture = await getPublicFixture(matchId);
  // Only played matches have a details page; fixtures still to come are just cards in the list.
  if (!fixture || fixture.match.fixtureStatus !== "COMPLETED") notFound();
  const { match: m, info } = fixture;
  const pictures = await listMatchPictures(matchId);
  const infoRows: [string, React.ReactNode][] = [
    ["Series", fixture.series.name],
    [
      "Match type",
      [
        STAGE_LABEL[m.stage],
        info.matchNumber ? `M${info.matchNumber}` : null,
        info.week ? `Week ${info.week}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    ],
    ["Format", `${info.overs} overs a side`],
    [
      "Ground",
      m.ground && m.fieldId ? (
        <Link
          href={`/grounds/field/${m.fieldId}`}
          className="hover:text-clay underline-offset-2 hover:underline"
        >
          {m.ground}
        </Link>
      ) : (
        (m.ground ?? "To be confirmed")
      ),
    ],
    ["Umpiring team", m.umpiringTeam?.name ?? "To be assigned"],
    ...(info.toss ? ([["Toss", info.toss]] as [string, React.ReactNode][]) : []),
    ...(info.playerOfMatch
      ? ([["Player of the match", info.playerOfMatch]] as [string, React.ReactNode][])
      : []),
  ];
  const canEdit = can((await auth())?.user, "manage-league");

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/league/fixtures"
        className="font-data text-chalk-dim hover:text-chalk self-start text-xs tracking-[0.08em] uppercase"
      >
        ← All fixtures
      </Link>

      {/* Same card as the fixtures list. Admins get a gear icon here that opens the edit page. */}
      <FixtureCard m={m} highlight={null} canEdit={canEdit} standalone />

      <section aria-labelledby="match-info" className="flex flex-col gap-4">
        <h2 id="match-info" className={sectionTitle}>
          Match info
        </h2>
        <dl className="border-line bg-dugout grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 rounded-[10px] border px-4 py-3 text-sm">
          {infoRows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-data text-chalk-faint text-[0.68rem] tracking-[0.1em] uppercase">
                {label}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {m.fixtureStatus === "COMPLETED" ? (
        <section aria-labelledby="match-scorecard" className="flex flex-col gap-4">
          <h2 id="match-scorecard" className={sectionTitle}>
            Scorecard
          </h2>
          <p className="text-chalk-dim border-line bg-dugout rounded-[10px] border p-4 text-sm">
            The full scorecard (batting, bowling and fall of wickets) will appear here once it is available.
          </p>
        </section>
      ) : null}

      {pictures.length > 0 ? (
        <section aria-labelledby="match-pictures" className="flex flex-col gap-4">
          <h2 id="match-pictures" className={sectionTitle}>
            Pictures
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pictures.map((p) => (
              <li key={p.id} className="border-line bg-dugout flex flex-col border">
                <div className="bg-pitch-deep relative aspect-[4/3]">
                  <Image
                    src={p.url}
                    alt={p.title ?? p.caption ?? "Match picture"}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-contain"
                  />
                </div>
                {p.title || p.body ? (
                  <div className="flex flex-col gap-1 px-3 py-2">
                    {p.title ? <span className="text-sm font-semibold">{p.title}</span> : null}
                    {p.body ? <p className="text-chalk-dim text-sm">{p.body}</p> : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
