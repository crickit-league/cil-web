import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { getMatchEditOptions, getPublicFixture } from "@/lib/services/schedule";
import { UmpireForm } from "@/components/umpires/umpire-form";
import { FixtureCard } from "../fixture-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fixture umpires · CIL Winter League",
  // Edit pages for every fixture add nothing to search results.
  robots: { index: false },
};

export default async function FixturePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const fixture = await getPublicFixture(matchId);
  if (!fixture) notFound();
  const { match: m } = fixture;
  const session = await auth();
  const canEditUmpires = can(session?.user, "edit-umpires");
  const canEditMatch = can(session?.user, "manage-league");
  const editOptions = canEditMatch && session?.user ? await getMatchEditOptions(session.user) : null;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/league/fixtures"
        className="font-data text-chalk-dim hover:text-chalk self-start text-xs tracking-[0.08em] uppercase"
      >
        ← All fixtures
      </Link>

      {/* Same card as the fixtures list; entry happens in the form below instead of inline. */}
      <FixtureCard m={m} highlight={null} canEditUmpires={false} editOptions={editOptions} standalone />

      {canEditUmpires ? (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-wide uppercase">Assign umpires</h2>
            <p className="text-chalk-dim mt-1 text-sm">
              Assign Umpire 1 and Umpire 2 for this match, with a phone number for each.
            </p>
          </div>
          <UmpireForm matchId={m.id} umpireOneName={m.umpires.one} umpireTwoName={m.umpires.two} />
        </section>
      ) : (
        <p role="status" className="border-gold/40 bg-dugout border p-4 text-sm">
          Only admins can assign or change umpires. Contact the committee if this fixture&apos;s umpires need
          to change.
        </p>
      )}
    </div>
  );
}
