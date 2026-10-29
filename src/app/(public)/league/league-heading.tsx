"use client";

import { usePathname } from "next/navigation";

// Fixtures and Points Table are top-level items in the site header,
// so the league pages have no tab bar of their own. The shared layout's
// heading names whichever one you're on (fixture pages count as Fixtures).
const SECTIONS = [
  { href: "/league/fixtures", title: "Fixtures" },
  { href: "/league/points-table", title: "Points Table" },
] as const;

export function LeagueHeading() {
  const pathname = usePathname();
  const section = SECTIONS.find((s) => pathname === s.href || pathname.startsWith(`${s.href}/`));
  return (
    <h1 className="font-display text-[2.5rem] leading-none font-extrabold uppercase sm:text-[3.5rem]">
      {section?.title ?? "League"}
    </h1>
  );
}
