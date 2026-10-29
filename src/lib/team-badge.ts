/** Hues that read well as a team colour on both the dark and light themes. */
const TEAM_HUES = [350, 14, 32, 48, 110, 152, 174, 196, 216, 240, 268, 292, 322] as const;

/** "Atlanta Strikers" → "AS"; one word → its first three letters; a placeholder like "TBD (A3)" → "TBD". */
export function teamInitials(name: string): string {
  const words = name
    .replace(/\(.*?\)/g, " ")
    .replace(/['’]/g, "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** A stable hue for a team, so its badge is the same colour on every page and every visit. */
export function teamHue(name: string): number {
  let hash = 5381;
  for (const ch of name.trim().toLowerCase()) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;
  return TEAM_HUES[hash % TEAM_HUES.length];
}
