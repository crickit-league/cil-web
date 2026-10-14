// Sponsors are hard-coded: they change rarely and don't need an admin UI.
// Logos live in public/img/sponsors/.

export type SponsorTier = "title" | "other";

export interface SponsorEntry {
  name: string;
  logo: string;
  href: string;
  tier: SponsorTier;
  logoWidth: number;
  logoHeight: number;
}

export const sponsors: readonly SponsorEntry[] = [
  {
    name: "Come2Chutneys",
    logo: "/img/sponsors/come2chutneys.jpeg",
    href: "https://www.instagram.com/come2chutneys",
    tier: "title",
    logoWidth: 1263,
    logoHeight: 597,
  },
];

export const titleSponsor = sponsors.find((s) => s.tier === "title");
export const otherSponsors = sponsors.filter((s) => s.tier === "other");
