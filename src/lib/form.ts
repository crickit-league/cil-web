import type { MatchStatus, ResultType } from "@/generated/prisma";

// A team's form guide ("W L W W N"): its most recent league results, oldest
// first. Built from the imported match results, because CricClubs' points
// table export has no form column. Pure, so it's tested on its own.

/** W win, L loss, T tie, N no result (abandoned or washed out). */
export type FormResult = "W" | "L" | "T" | "N";

export const FORM_LENGTH = 5;

type FormMatch = {
  startsAt: Date | null;
  status: MatchStatus;
  resultType: ResultType | null;
  teamOneId: string | null;
  teamTwoId: string | null;
  winnerId: string | null;
};

/** One played match from one team's side, or null if it says nothing about form (unplayed, not theirs). */
function resultFor(m: FormMatch, teamId: string): FormResult | null {
  if (m.teamOneId !== teamId && m.teamTwoId !== teamId) return null;
  if (m.status === "ABANDONED" || m.resultType === "NO_RESULT") return "N";
  if (m.status !== "COMPLETED") return null;
  if (m.winnerId) return m.winnerId === teamId ? "W" : "L";
  // A super-over tie has a winner (above); a plain tie doesn't.
  return m.resultType === "TIE" ? "T" : null;
}

/** Each team's last `length` results, oldest first, keyed by team entry id. Undated matches are skipped. */
export function formByTeam(matches: FormMatch[], teamIds: string[], length = FORM_LENGTH) {
  const played = matches
    .filter((m): m is FormMatch & { startsAt: Date } => m.startsAt !== null)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const form = new Map<string, FormResult[]>();
  for (const teamId of teamIds) {
    const results = played.flatMap((m) => {
      const r = resultFor(m, teamId);
      return r ? [r] : [];
    });
    form.set(teamId, results.slice(-length));
  }
  return form;
}
