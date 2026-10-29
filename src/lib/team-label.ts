/** A team's display name, or its placeholder ("TBD (A3)") while the side isn't decided yet. */
export function teamLabel(team: { name: string } | null, source: string | null) {
  return team?.name ?? (source ? `TBD (${source})` : "TBD");
}
