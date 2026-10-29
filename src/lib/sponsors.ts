// Sponsors are hard-coded: they change rarely and don't need an admin UI.
// Logos live in public/img/sponsors/.

export type SponsorTier = "title" | "other";

export interface SponsorDetails {
  /** One line under the name. */
  tagline: string;
  /** What they are, in a sentence or two. */
  about: string;
  address: string;
  /** Digits for the tel: link and the number as it's shown. */
  phone: { tel: string; display: string };
  instagram: string;
}

export interface SponsorEntry {
  name: string;
  logo: string;
  /** The sponsor's own website: where their logo links to. */
  href: string;
  /** Only filled in for a sponsor that has its own page (/sponsors). */
  details?: SponsorDetails;
  tier: SponsorTier;
  logoWidth: number;
  logoHeight: number;
}

export const sponsors: readonly SponsorEntry[] = [
  {
    name: "Come2Chutneys",
    logo: "/img/sponsors/come2chutneys.jpeg",
    href: "https://come2chutneys.com/",
    details: {
      tagline: "Tradition on the plate. Chutney in every color.",
      about:
        "Come to Chutneys (C2C) is a 100% vegetarian South Indian restaurant in Cumming, Georgia: dosas, idlies, chaat and filter coffee, served with coconut, tomato and peanut chutneys. They also cater pujas, birthdays, office lunches and weddings.",
      address: "5920 Parkway North Blvd., Suite 103, Cumming, GA",
      phone: { tel: "+14702397888", display: "(470) 239-7888" },
      instagram: "https://www.instagram.com/come2chutneys",
    },
    tier: "title",
    logoWidth: 1263,
    logoHeight: 597,
  },
];

export const titleSponsor = sponsors.find((s) => s.tier === "title");
export const otherSponsors = sponsors.filter((s) => s.tier === "other");
