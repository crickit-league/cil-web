import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { getPublicFixture } from "@/lib/services/schedule";
import { FixtureCard } from "../fixture-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fixture",
  // One page per fixture adds nothing to search results.
  robots: { index: false },
};

export default async function FixturePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const fixture = await getPublicFixture(matchId);
  if (!fixture) notFound();
  const { match: m } = fixture;
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
    </div>
  );
}
