type Side = { name: string } | null;

/** "Sharks v Titans"; a side not decided yet shows its placeholder ("TBD (A3)"). */
export function matchLabel(
  teamOne: Side,
  teamTwo: Side,
  teamOneSource: string | null = null,
  teamTwoSource: string | null = null,
): string {
  const side = (team: Side, source: string | null) => team?.name ?? (source ? `TBD (${source})` : "TBD");
  return `${side(teamOne, teamOneSource)} v ${side(teamTwo, teamTwoSource)}`;
}
