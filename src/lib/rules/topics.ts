/** One-tap searches shown under the search box. `query` is what actually gets searched. */
export const POPULAR_TOPICS = [
  { label: "Late start", query: "late start" },
  { label: "Free hit", query: "free hit" },
  { label: "No-ball", query: "no-ball" },
  // The rule book calls it the "return crease (side line)".
  { label: "Side crease", query: "return crease" },
  // The rule book calls them penalties ($25 / $50, points deducted); "|" means either word.
  { label: "Fines", query: "penalt|fine" },
  // "categor" finds the field category table and cards; plain "cat" would also pull in "catch" rules.
  { label: "Category", query: "categor" },
] as const;
