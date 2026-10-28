// Winter 2026–27 Rules and Regulations, transcribed from CIL_WL_2026-27_Rules.pdf
// (public/documents/). The PDF stays the official copy; this is the same text in a
// searchable shape. When the committee issues a new version, update both together.

export type RuleFigure = { src: string; alt: string; caption: string };

export type RuleCard = {
  title: string;
  subtitle: string;
  /** Label/value pairs, e.g. "Direct hit" / "4D". */
  lines: { label: string; value: string }[];
  /** Setup and play notes, each tied to the rule it comes from. */
  notes: string[];
};

export type RuleItem =
  | { kind: "heading"; text: string }
  | { kind: "rule"; num: string; text: string; bullets?: string[] }
  | { kind: "table"; caption?: string; head: string[]; rows: string[][] }
  | { kind: "note"; text: string }
  | { kind: "figures"; figures: RuleFigure[] }
  | { kind: "cards"; cards: RuleCard[] };

export type RuleCategoryId = "league" | "match-day" | "playing" | "playoffs" | "umpiring";

export const RULE_CATEGORIES: { id: RuleCategoryId; label: string }[] = [
  { id: "league", label: "League & Eligibility" },
  { id: "match-day", label: "Match Day" },
  { id: "playing", label: "Playing Rules" },
  { id: "playoffs", label: "Playoffs" },
  { id: "umpiring", label: "Umpiring" },
];

export type RuleSection = {
  id: string;
  number: number;
  title: string;
  category: RuleCategoryId;
  /** One-line takeaway shown on the collapsed card. */
  quick: string;
  items: RuleItem[];
};

export const RULE_BOOK_TITLE = "Winter 2026–27 Rules and Regulations";
export const RULE_BOOK_PDF = {
  href: "/documents/CIL_WL_2026-27_Rules.pdf",
  fileName: "CIL_WL_2026-27_Rules.pdf",
};
export const RULE_BOOK_EMAIL = "cilcommittee@gmail.com";

const rule = (num: string, text: string, bullets?: string[]): RuleItem => ({
  kind: "rule",
  num,
  text,
  bullets,
});
const heading = (text: string): RuleItem => ({ kind: "heading", text });

export const RULE_BOOK: RuleSection[] = [
  {
    id: "entry-fee-trophies-awards",
    number: 1,
    title: "Entry Fee, Trophies and Awards",
    category: "league",
    quick: "$650 per team; trophies for the winners, runners-up and finalists, plus individual awards.",
    items: [
      rule("1.1", "The entry fee is $650 per team."),
      rule("1.2", "Trophies: Winners and Runners-up trophies, plus individual trophies for the finalists."),
      rule("1.3", "Individual prizes and recognition:", [
        "Best Batsman of the tournament",
        "Best Bowler of the tournament",
        "Best Wicket Keeper of the tournament",
        "Most Valuable Player",
        "Man of the Match (MOM) trophy for all matches",
      ]),
    ],
  },
  {
    id: "league-format-points",
    number: 2,
    title: "League Format and Points",
    category: "league",
    quick: "Hard tennis ball, 2 points for a win, 1 each for a tie or no result; top 6 per pool qualify.",
    items: [
      rule("2.1", "All matches are played with a “Hard Tennis” (Red / Yellow) cricket ball."),
      rule(
        "2.2",
        "CIL provides balls only for CIL scheduled matches. It is the captain’s responsibility to check whether the other team uses CIL provided balls.",
      ),
      rule(
        "2.3",
        "All matches are played on baseball fields. CIL reserves the ground(s) for all matches; play on the ground allocated to you. If the allocated ground is being used by teams outside CIL or by teams playing other sports, show the permit and call the CIL committee for help.",
      ),
      rule(
        "2.4",
        "Points: the winning team is awarded two points. In case of a “Tie” or a “No result”, one point is awarded to both teams.",
      ),
      rule(
        "2.5",
        "Each team plays a maximum of 11 matches during the league stage. The top six teams from each pool qualify for the playoffs.",
      ),
      rule(
        "2.6",
        "At the end of the league stage, playoff eligibility is determined by table position, regardless of the number of matches played by the teams.",
      ),
      rule(
        "2.7",
        "Tie-breakers. When teams finish with equal points, net run rate (NRR) is the deciding factor. If teams are also equal on NRR:",
        [
          "Two teams: the winner of the head-to-head match played between them is placed higher.",
          "More than two teams: the team that won the most matches played among those teams is placed higher. Example: three teams are tied. Team A beat Team B but lost to Team C; Team B lost to Team A but did not play Team C. Head-to-head records: Team A 1–1 (50% wins), Team B 0–1 (0%), Team C 1–0 (100%). Team C is ranked above Team A, and Team A above Team B.",
          "If still equal: the team with the higher number of wickets taken is placed higher.",
          "If teams still cannot be separated: a random draw is used to choose the winner between the contending teams.",
        ],
      ),
    ],
  },
  {
    id: "scheduling-rescheduling",
    number: 3,
    title: "Scheduling and Rescheduling",
    category: "league",
    quick: "Matches on Saturdays and Sundays; any change only by mutual agreement of the captains.",
    items: [
      rule(
        "3.1",
        "All matches and umpiring are scheduled only on Saturdays and Sundays. This is for planning purposes, so that teams can expect their schedule on a Saturday or Sunday.",
      ),
      rule(
        "3.2",
        "To keep the league flexible, any league match can be advanced and played on any day (including weekdays) based on the opponent’s availability.",
      ),
      rule(
        "3.3",
        "If the captains do not mutually agree on rescheduling a match (postpone/advance), the match must be played on the scheduled date and time, provided weather and ground conditions are suitable.",
      ),
      rule(
        "3.4",
        "CIL is not responsible for coordinating grounds or following up on matches where the captains/teams agreed to play outside the proposed CIL schedule. If teams decide to play outside the proposed schedule, communicate the decision to CIL at cilcommittee@gmail.com on Friday before 8 PM EST. In case of app issues, share the results and score sheets with CIL after the match.",
      ),
    ],
  },
  {
    id: "teams-rosters-eligibility",
    number: 4,
    title: "Teams, Rosters and Player Eligibility",
    category: "league",
    quick: "Roster of up to 20 by Friday; one team per player; 3 league matches to be playoff-eligible.",
    items: [
      rule(
        "4.1",
        "A team can have a maximum of 20 players on the roster. All players must be added to the roster by Friday of the week.",
      ),
      rule(
        "4.2",
        "One player can play for only one team in the tournament. If it comes to the organizer’s notice that a team has used a player who has played for another team in the tournament, the team will be penalized. The penalty depends on the result of that match:",
        [
          "If the team won with the ineligible player, the points are given to the opponent, with no change to run rate.",
          "If the team lost, 20 runs are deducted from their team scorecard, which impacts overall NRR.",
          "The penalty is entirely at the committee’s discretion.",
        ],
      ),
      rule(
        "4.3",
        "Playoff and Finals eligibility: a player must have played at least 3 matches (30% of the league matches played by the team) in the league stage to play in the Playoffs and Finals. A player is counted as part of the Playing X for a match only if he is available on the field for at least 8 overs.",
      ),
      rule(
        "4.4",
        "All players must upload their photo to their Cricclubs profile. The face must be clearly visible for identification.",
      ),
    ],
  },
  {
    id: "match-day-toss-start",
    number: 5,
    title: "Match Day: Setup, Toss and Start Time",
    category: "match-day",
    quick: "Eastern Time; the home team sets up and spins the coin; 6 players needed at the toss.",
    items: [
      rule(
        "5.1",
        "All CIL match times are Eastern Time. The start time is as notified in the schedule unless changed by the committee.",
      ),
      rule(
        "5.2",
        "The designated Home team is responsible for setting up the field before the start time, including distinctly marking the creases and boundaries.",
      ),
      rule(
        "5.3",
        "The Home team spins the coin at the toss and may occupy the dug out behind the wicket keeper.",
      ),
      rule(
        "5.4",
        "The visiting team is advised to be at the ground 15 minutes before the start time to give input on the field setup.",
      ),
      rule(
        "5.5",
        "The toss is conducted no later than 5 minutes before the start time if both teams are present on the ground. Immediately after the toss, the toss-winning captain must tell the opposing captain and the umpire his team’s decision.",
      ),
      rule("5.6", "Umpires/scorers must record the toss result on the score sheet."),
      rule(
        "5.7",
        "At the time of the toss, if one team is not ready to play (fewer than 6 players present and accounted for at the ground), the toss is awarded to the team that is ready.",
      ),
    ],
  },
  {
    id: "late-starts-forfeits-walkovers",
    number: 6,
    title: "Late Starts, Forfeits and Walkovers",
    category: "match-day",
    quick: "Start with 6 players; overs are lost for late starts; forfeit 30 minutes after the start time.",
    items: [
      heading("Teams not ready"),
      rule(
        "6.1",
        "A team can start with a minimum of 6 players on the field. A player must join the team before the completion of 6 overs, otherwise he cannot bat or bowl.",
      ),
      rule(
        "6.2",
        "After the toss, if a team is still not ready 15 minutes after the start time, the defaulting team loses one over for the first 10 minutes of delay and another over for the next 5 minutes. If the team is not ready 30 minutes after the start time (a five-over loss is the maximum penalty), the match and points are awarded to the opponent, provided the other team is ready to play.",
      ),
      rule(
        "6.3",
        "The umpires/neutral umpires/CIL make the final decision. The result is treated as a forfeit.",
      ),
      rule(
        "6.4",
        "If both teams are not ready 30 minutes after the start time, the overs are reduced to make up the time.",
      ),
      rule(
        "6.5",
        "If both teams are not ready 60 minutes after the start time, the match is counted as a loss for both teams and no points are awarded to either. This match cannot be rescheduled.",
      ),
      rule("6.6", "The maximum overs per innings cannot be modified once the game has started."),
      heading("Over-reduction guidelines"),
      { kind: "note", text: "Example: match start time 9:00 AM EST; toss time 8:45 AM EST." },
      rule(
        "6.7",
        "Scenario 1: one team (Team A) is not ready to start. Umpires can give a 5-minute grace period. After 5 minutes, if the team is still not ready, one over is reduced from their batting innings for each further 5 minutes:",
      ),
      {
        kind: "table",
        caption: "Scenario 1: one team not ready",
        head: ["Match start time", "Team A innings (overs)", "Team B innings (overs)"],
        rows: [
          ["9:05", "15", "15"],
          ["9:10", "14", "15"],
          ["9:15", "13", "15"],
          ["9:20", "12", "15"],
          ["9:25", "11", "15"],
          ["9:30", "10", "15"],
        ],
      },
      { kind: "note", text: "If Team A is still not ready, the game is awarded to Team B." },
      rule(
        "6.8",
        "Scenario 2: both teams are not ready to start. Umpires can give a 10-minute grace period. After 10 minutes, if both teams are still not ready, one over is reduced from both batting innings for every 10 minutes of delay:",
      ),
      {
        kind: "table",
        caption: "Scenario 2: both teams not ready",
        head: ["Match start time", "Team A innings (overs)", "Team B innings (overs)"],
        rows: [
          ["9:20", "14", "14"],
          ["9:30", "13", "13"],
          ["9:40", "12", "12"],
          ["9:50", "11", "11"],
          ["10:00", "10", "10"],
        ],
      },
      {
        kind: "note",
        text: "If both teams are still not ready to play, the game results in a points split.",
      },
      heading("Opponent not available (CIL scheduled matches)"),
      rule(
        "6.9",
        "If Team A is available on the scheduled date/time and Team B is not, Team A is considered the Winner. There is no change in NRR, but points are awarded.",
        [
          "Exception: the unavailable team is playing ACL playoff matches on the same day.",
          "To claim the points, the available team (at least 6 players) must be present at the ground and share a team picture with the opponents/CIL.",
          "This applies to CIL scheduled matches only. It does not apply to matches rescheduled by mutual agreement of the teams.",
        ],
      ),
      rule(
        "6.10",
        "If Team A and Team B are both unavailable on the reschedule dates communicated to the CIL Committee, the points are shared between the teams.",
      ),
    ],
  },
  {
    id: "match-rules-playing-conditions",
    number: 7,
    title: "Match Rules and Playing Conditions",
    category: "playing",
    quick: "10 a side, 15 overs, 4 per bowler; wooden bats, spring stumps, no LBW.",
    items: [
      heading("Equipment and attire"),
      rule("7.1", "Playing teams must bring bats, stumps, cones, etc. Spring stumps must be used."),
      rule(
        "7.2",
        "Bats must be made entirely of wood. Composite, aluminum or non-wooden bats are strictly prohibited. Teams may carry an approved bat gauge, and umpires can inspect bats and permit them for use in games. In the absence of a bat gauge, the umpire’s decision is final.",
      ),
      rule("7.3", "Each player must wear appropriate shoes. Spikes are not allowed."),
      rule(
        "7.4",
        "Players may use any regulation cricket equipment, including gloves (batting and keeping), pads (leg and elbow) and guards. Fielders wearing gloves (soft gloves) is not prohibited in this league.",
      ),
      heading("Teams, overs and batting"),
      rule(
        "7.5",
        "Each game is played between two teams of ten players each. All 10 can bat, while only 9 can field (a maximum of 9 fielders on the field at any point).",
      ),
      rule("7.6", "Each game has 15 overs per side. Each bowler can bowl a maximum of 4 overs."),
      rule("7.7", "Overs are bowled from only one end of the pitch, as determined."),
      rule(
        "7.8",
        "There are no LBWs. There is no requirement for the batter to offer a stroke, and leg byes are permitted as long as there is no deliberate padding by the batsman. For instance, if a batter attempts to evade a bouncer/beamer and the ball makes contact with any part of their body, it is a valid run.",
      ),
      rule("7.9", "No last man batting is allowed."),
      rule(
        "7.10",
        "At any point there must not be more than 4 players on either side of the pitch (off side or leg side).",
      ),
      rule("7.11", "The wicket keeper is allowed to bowl, and can do so at any time."),
      heading("Playing X"),
      rule(
        "7.12",
        "The Playing X for a match from both sides must be entered in the scorecard and shared with the umpires/opponent team before the toss.",
      ),
      heading("Substitutes, runners and retirements"),
      rule(
        "7.13",
        "A substitute fielder is permitted only for an injured player who cannot return to the game. A substitute cannot bowl, bat or keep wicket. A maximum of one substitute is allowed at any given time.",
      ),
      rule(
        "7.14",
        "If a fielder leaves the field for some overs during the match, he must spend a minimum of one over on the field before he can bowl. This is applicable for the 10th player in the dug out as well. That player must be in the field for one over before he can bowl.",
      ),
      rule("7.15", "An injured player is not allowed to have a runner when batting."),
      rule(
        "7.16",
        "Retiring – injury, illness or unavoidable situations. If a batsman is injured or falls ill while batting, or in unavoidable situations while playing, he may retire and resume his innings at the dismissal or retirement of another batsman. If he cannot return by the end of the innings, the batting side must close its innings after all other batsmen are dismissed (excluding the not-out batsman), and his innings is recorded as “Retired – Not Out”. His runs are still added to his total runs scored in that season.",
      ),
      rule(
        "7.17",
        "Retiring – any other reason. A batsman who retires for any reason other than those above may resume batting only with the umpires’ consent. If he does not resume, his innings is recorded as “Retired – Out” and his runs are added to his match count for calculations.",
      ),
    ],
  },
  {
    id: "wides-no-balls",
    number: 8,
    title: "Wides and No-balls",
    category: "playing",
    quick: "Wide at 36 in from the stump; return crease at 48 in; every no-ball is a Free Hit.",
    items: [
      heading("Wides"),
      rule(
        "8.1",
        "The wide mark is measured at 36 inches (3 feet) from the middle of the stump on either side. Using bat lengths to set wide marks is no longer effective.",
      ),
      rule(
        "8.2",
        "Leg side: a delivery that passes down the leg side of the wicket and behind the striker is wide. A delivery passing between the striker and the leg stump is not wide.",
      ),
      rule(
        "8.3",
        "Off side, normal batting stance: a delivery is a wide if the ball passes above or outside the wide guideline, irrespective of the batter’s movement after the ball is bowled.",
      ),
      rule(
        "8.4",
        "Off side, altered batting stance: if the batter significantly changes stance before the ball is bowled (e.g., takes guard outside off stump, or shuffles far toward the off side before the ball is released from the bowler’s hand), the umpire may adjust the off-side wide guideline proportionally up to the return crease.",
      ),
      rule(
        "8.5",
        "A delivery that passes over the head of the batter standing upright at the popping crease, without the batter making contact with the bat, is a wide. A warning should be given for the bouncer.",
      ),
      rule(
        "8.6",
        "Reverse sweep / switch hit: wide guidelines apply equally to both sides of the wicket and both sides are considered off sides. This replaces the standard leg-side wide rule, and applies even when the batter prepares for but then abandons a reverse sweep or switch hit.",
      ),
      heading("No-balls"),
      rule("8.7", "A ball is a no-ball if:", [
        "The bowler has overstepped the popping crease, i.e., some part of the bowler’s front foot, whether grounded or raised, is not behind the popping crease; or",
        "The front foot touches or lands on the other side of the imaginary line connecting the middle stumps at either end; or",
        "The back foot does not land within the return crease and/or touches the return crease. Only the back foot is considered for a return-crease (side line) no-ball; or",
        "The ball is a full toss above the waist height of the batsman in a normal stance; or",
        "The ball is over the shoulder of the batsman after one bounce, with a warning provided by the umpires in the same over. (There is one warning for a ball bowled over the shoulder, and a Free Hit is awarded for the second bounce by the bowler.)",
      ]),
      rule(
        "8.8",
        "The bowling side return crease is 48 inches (4 feet) from the outside stump of the bowling wicket.",
      ),
      rule("8.9", "A no-ball call always overrides a wide."),
      rule(
        "8.10",
        "Free Hit: all no-balls result in a Free Hit for the batting team. On a Free Hit delivery, the batsman can be dismissed only by Run Out, Handling the Ball, Hitting the Ball Twice, or Obstructing the Field. The fielding team cannot change positions for a Free Hit unless the batsmen switch ends or a new batsman comes to bat.",
      ),
      rule("8.11", "If only one designated umpire is available, the neutral umpire’s call is final."),
      heading("Runs and dismissals on wides and no-balls"),
      rule(
        "8.12",
        "Wides and no-balls each count as 1 extra run, and an extra ball must be bowled in the over. Any runs (byes, leg byes, etc.) scored off wides or no-balls are credited as well. The ball is still in play after a no-ball or a wide.",
      ),
      rule(
        "8.13",
        "A batsman can be out on a wide ball for Hit Wicket, Obstructing the Field or stumped, and can be run out off a wide or a no-ball.",
      ),
      heading("Diagrams"),
      {
        kind: "figures",
        figures: [
          {
            src: "/documents/wide-guideline.png",
            alt: "Pitch diagram showing the wide guideline 36 inches either side of the middle stump and the return crease 48 inches from the outside stump",
            caption: "Wide guideline (36 in) and return crease (48 in)",
          },
          {
            src: "/documents/front-foot.png",
            alt: "Front foot diagram: no-ball and legitimate delivery zones around the popping crease and return crease",
            caption: "Front foot: no-ball and legitimate delivery zones",
          },
          {
            src: "/documents/back-foot.png",
            alt: "Back foot diagram: no-ball and legitimate delivery zones around the popping crease and return crease",
            caption: "Back foot: no-ball and legitimate delivery zones",
          },
        ],
      },
    ],
  },
  {
    id: "additional-playing-rules",
    number: 9,
    title: "Additional Playing Rules",
    category: "playing",
    quick: "Dead ball, penalty runs for hitting an object, run-outs after the stumps are down, Mankading.",
    items: [
      rule(
        "9.1",
        "Dead ball. A delivery that bounces more than once, or rolls along the ground, before the popping crease on the batting side is a dead ball. If the bowler accidentally drops or releases the ball before delivery, or for any reason it does not leave their hand, the umpire must call a dead ball. Any dismissal or scoring rule is invalid on a dead ball, no runs are counted, and an extra ball must be bowled.",
      ),
      rule(
        "9.2",
        "Penalty runs for hitting an object. If the ball hits any object (not already in the park) within the play area, penalty runs are awarded: 2 runs if the object is behind the square (stumps) area, and 4 runs if it is in front of the square (stumps). No other runs taken by the batsmen are considered and dismissals are not counted. This does not apply to objects present in the park at the start of the match (e.g., mounds in the baseball/softball park).",
      ),
      rule(
        "9.3",
        "Run-out after the stumps are knocked down (e.g., an overthrow situation where batsmen look for an extra run and another run-out is possible): the fielders must fix at least one stump back upright in a normal position and knock the stumps down again, or carry one of the stumps together with the ball in hand. If spring stumps are used, the entire stump pack must be brought upright before the run-out is made, or the entire stumps must be carried by hand with the ball in hand. This also applies when the complete base has moved but the wicket has not fallen.",
        [
          "If the ball hits the side spring (not the actual stumps) and deviates outside, the umpires take a call considering the ball’s travel angle. If the ball would have hit the stumps but for the spring, the batsman can be given out. If the ball is traveling outside the stumps, he is not out. If the ball turns and hits the stump after the impact with the spring, it is out.",
        ],
      ),
      rule(
        "9.4",
        "Run out of a non-striker by the bowler (“Mankading”). If the non-striker is out of his/her ground at any time before the ball comes into play until the instant the bowler would normally have been expected to release the ball, the non-striker is liable to be run out. The umpire can give a team warning for the first instance. Whether the attempt is successful or not, the ball does not count as one in the over. If the bowler succeeds, it is a run out; if the bowler fails, the umpire calls and signals Dead ball as soon as possible.",
      ),
      rule(
        "9.5",
        "The bowler must notify the umpire whether they intend to bowl right-handed or left-handed, and whether over or round the wicket. Changing the mode of delivery without notifying the umpire is unfair play and results in a No-ball.",
      ),
      rule("9.6", "Underarm bowling is not permitted."),
    ],
  },
  {
    id: "ground-field-rules",
    number: 10,
    title: "Ground and Field Rules",
    category: "playing",
    quick: "Boundary scoring by fence distance, field categories, pitch cleaning and conduct.",
    items: [
      heading("Boundaries"),
      rule(
        "10.1",
        "Field categories and scoring rules can be decided mutually by the playing teams, based on the ground where the match is played. Off-side fence/boundary requirements:",
      ),
      {
        kind: "table",
        caption: "Field categories and off-side fence / boundary requirements",
        head: [
          "Category · Off-side fence / boundary",
          "Direct hit",
          "Over the fence",
          "Pitching, then over the fence",
          "Rolling under fence / dug out area / stuck in fence",
          "Fields",
        ],
        rows: [
          [
            "CAT 1 · More than 140 ft",
            "6 (rolling boundary)",
            "6",
            "6",
            "6",
            "Harrison Field 6, Harrison Field 7, Larry Bell Park, RAP 2",
          ],
          [
            "CAT 2 · 110 ft to 140 ft",
            "4D",
            "4D",
            "4D",
            "2D",
            "Bell Memorial Park 3, RAP 3, ERP 4, Skip Wells 2, Nickajack Park 2",
          ],
          ["CAT 3 · 90 ft to 110 ft", "2D", "4D", "2D", "2D", "ERP 1, Nickajack Park 3"],
          ["CAT 4 · Less than 90 ft", "2D", "2D", "2D", "2D", "Skip Wells 3"],
        ],
      },
      {
        kind: "note",
        text: "Wherever the decided runs are 1D, then over the fence, pitching and going over the fence, and rolling under the fence/dug out area/stuck in the fence are all 1D.",
      },
      rule(
        "10.2",
        "Leaning on or touching the fence while catching. A fielder may take a catch while leaning on or touching the fence, which would otherwise have been a direct hit/going over for 1D, 2D or 4D. This catch is valid. For a regular boundary, if the fielder touches the fence, it is not a valid catch.",
      ),
      rule(
        "10.3",
        "Ball stuck in the fence. The batsman is awarded the runs declared for a direct hit to the fence or the ball going over the fence, in the area where the ball is stuck. Where runs are declared for both “Direct Hit to the Fence” and “Ball going over the Fence”, the runs for “Direct Hit to the Fence” are used.",
      ),
      heading("Field setup by category"),
      {
        kind: "cards",
        cards: [
          {
            title: "CAT 1",
            subtitle: "Off-side fence more than 140 ft",
            lines: [
              { label: "Direct hit", value: "6 (rolling boundary)" },
              { label: "Over the fence", value: "6" },
              { label: "Pitching, then over the fence", value: "6" },
              { label: "Rolling under fence / dug out area / stuck in fence", value: "6" },
              { label: "Fields", value: "Harrison Field 6, Harrison Field 7, Larry Bell Park, RAP 2" },
            ],
            notes: [
              "Home team sets up the field and marks the creases and boundaries before the start time (5.2).",
              "Both captains agree the category for the ground being played on (10.1).",
              "This is a regular boundary: a fielder touching the fence does not take a valid catch (10.2).",
              "A ball stuck in the fence scores the runs declared for a direct hit to the fence (10.3).",
            ],
          },
          {
            title: "CAT 2",
            subtitle: "Off-side fence 110 ft to 140 ft",
            lines: [
              { label: "Direct hit", value: "4D" },
              { label: "Over the fence", value: "4D" },
              { label: "Pitching, then over the fence", value: "4D" },
              { label: "Rolling under fence / dug out area / stuck in fence", value: "2D" },
              {
                label: "Fields",
                value: "Bell Memorial Park 3, RAP 3, ERP 4, Skip Wells 2, Nickajack Park 2",
              },
            ],
            notes: [
              "Home team sets up the field and marks the creases and boundaries before the start time (5.2).",
              "Both captains agree the category for the ground being played on (10.1).",
              "A catch taken while leaning on or touching the fence is valid (10.2).",
              "A ball stuck in the fence scores the runs declared for a direct hit to the fence (10.3).",
            ],
          },
          {
            title: "CAT 3",
            subtitle: "Off-side fence 90 ft to 110 ft",
            lines: [
              { label: "Direct hit", value: "2D" },
              { label: "Over the fence", value: "4D" },
              { label: "Pitching, then over the fence", value: "2D" },
              { label: "Rolling under fence / dug out area / stuck in fence", value: "2D" },
              { label: "Fields", value: "ERP 1, Nickajack Park 3" },
            ],
            notes: [
              "Home team sets up the field and marks the creases and boundaries before the start time (5.2).",
              "Both captains agree the category for the ground being played on (10.1).",
              "A catch taken while leaning on or touching the fence is valid (10.2).",
              "A ball stuck in the fence scores the runs declared for a direct hit to the fence (10.3).",
            ],
          },
          {
            title: "CAT 4",
            subtitle: "Off-side fence less than 90 ft",
            lines: [
              { label: "Direct hit", value: "2D" },
              { label: "Over the fence", value: "2D" },
              { label: "Pitching, then over the fence", value: "2D" },
              { label: "Rolling under fence / dug out area / stuck in fence", value: "2D" },
              { label: "Fields", value: "Skip Wells 3" },
            ],
            notes: [
              "Home team sets up the field and marks the creases and boundaries before the start time (5.2).",
              "Both captains agree the category for the ground being played on (10.1).",
              "A catch taken while leaning on or touching the fence is valid (10.2).",
              "A ball stuck in the fence scores the runs declared for a direct hit to the fence (10.3).",
            ],
          },
        ],
      },
      heading("Pitch, ground care and conduct"),
      rule(
        "10.4",
        "Both teams can clean the pitch once each, at the start of their batting innings, with a broom, a bat or any cleaning method that will not harm the pitch. Both captains and the umpires must agree on the cleaning method.",
      ),
      rule(
        "10.5",
        "Each team must pick up its trash after the match and leave the ground in the condition it was in before the match. CIL will take disciplinary action if a team fails to do so.",
      ),
      rule(
        "10.6",
        "Smoking or consumption of alcohol is prohibited on the field and on the premises, including the parking lots and the area surrounding the fields, and all park rules apply while playing. CIL is not responsible for actions taken by park management / county officials / other officers in such cases.",
      ),
    ],
  },
  {
    id: "playoffs",
    number: 11,
    title: "Playoffs",
    category: "playoffs",
    quick: "Top 2 per pool go straight to the quarter-finals; 3rd to 6th play the pre-quarter-finals.",
    items: [
      heading("Format"),
      rule(
        "11.1",
        "The top six teams from each pool qualify for the playoffs. The top two teams from each group go directly to the Quarter-Finals; teams 3–6 from each pool play the Pre-Quarter-Finals.",
      ),
      {
        kind: "table",
        caption: "Playoff bracket",
        head: ["Round", "Match", "Fixture"],
        rows: [
          ["Pre-Quarter-Finals", "PQ1", "A3 vs A6"],
          ["Pre-Quarter-Finals", "PQ2", "A4 vs A5"],
          ["Pre-Quarter-Finals", "PQ3", "B3 vs B6"],
          ["Pre-Quarter-Finals", "PQ4", "B4 vs B5"],
          ["Quarter-Finals", "Q1", "A1 vs Winner of PQ4"],
          ["Quarter-Finals", "Q2", "A2 vs Winner of PQ3"],
          ["Quarter-Finals", "Q3", "B1 vs Winner of PQ2"],
          ["Quarter-Finals", "Q4", "B2 vs Winner of PQ1"],
          ["Semi-Finals", "S1", "Winner of Q1 vs Winner of Q4"],
          ["Semi-Finals", "S2", "Winner of Q2 vs Winner of Q3"],
          ["Final", "Final", "Winner of S1 vs Winner of S2"],
        ],
      },
      heading("Playoff rules"),
      rule(
        "11.2",
        "If one team is not available to play on a scheduled day during the playoffs/finals, the team that is available is announced as the Winner of that match. This also applies to any walk-over in the middle of the game.",
      ),
      rule(
        "11.3",
        "Playoffs/Finals are played on reserve days if a match is abandoned due to bad weather. CIL will announce the reserve days later.",
      ),
      rule(
        "11.4",
        "If playoff matches are not completed in the reserve days for any reason, the team with the higher position in the league-stage points table is declared the Winner. In the case of the Finals, the cup is shared between the finalists if no match is played.",
      ),
      rule("11.5", "Super Over rules (below) apply to playoff and Final matches."),
    ],
  },
  {
    id: "super-over",
    number: 12,
    title: "Super Over",
    category: "playoffs",
    quick: "Playoffs and Final only; 3 batsmen and a bowler named; repeated until there is a result.",
    items: [
      rule(
        "12.1",
        "The Super Over is used only for playoff / Final matches. It does not apply to round-robin matches.",
      ),
      rule(
        "12.2",
        "In a tied match (both teams have an identical number of runs at the end of the allotted overs), the winner is decided by a Super Over.",
      ),
      rule(
        "12.3",
        "No new toss is needed. The team that batted second in the main match bats first in the Super Over.",
      ),
      rule(
        "12.4",
        "Before the toss, both teams must name three batsmen and a bowler for the Super Over. The nominated bowler can be one of the three batters.",
      ),
      rule(
        "12.5",
        "The same ball used in the match/innings is used in the Super Over. The umpires decide which ball (from either innings) to use.",
      ),
      rule(
        "12.6",
        "No last man batting is allowed. If two batsmen are out, the team is considered all out for the Super Over.",
      ),
      rule(
        "12.7",
        "Super Over runs do not count toward Net Run Rate. Runs scored and wickets taken in a Super Over are not considered for individual player statistics.",
      ),
      rule(
        "12.8",
        "If the Super Over is tied, another Super Over is played (the above rules apply), and subsequent Super Overs are played until there is a result. The team that batted second in the previous Super Over bats first in the next one.",
      ),
      rule("12.9", "Bowlers cannot bowl successive overs for their respective teams."),
      rule(
        "12.10",
        "A batter who is dismissed or retired out in a Super Over is ineligible to bat again in the next Super Over. If the batter retires hurt, he can bat again in a subsequent Super Over.",
      ),
      rule("12.11", "If for any reason the overs cannot continue, the match result is declared a tie."),
    ],
  },
  {
    id: "rain-unavoidable-circumstances",
    number: 13,
    title: "Rain and Unavoidable Circumstances",
    category: "match-day",
    quick: "Match called off and points shared; a rescheduled match is a re-match with a re-toss.",
    items: [
      rule(
        "13.1",
        "If there is a rain intervention or other unavoidable circumstance during the match and the situation is not ideal to continue, that match is called off. The umpires decide whether to wait until the rain stops, continue the match, or decide based on the pitch.",
      ),
      rule(
        "13.2",
        "In this case, points are shared equally by both teams (unless the captains mutually agree to reschedule the match).",
      ),
      rule("13.3", "A match rescheduled because of the above will be a re-match with a re-toss."),
      {
        kind: "note",
        text: "Most important point we request everyone to follow: if the weather turns out to be reasonable on the day (even when there was overnight rain), please go and visit the ground before deciding to call off the match.",
      },
    ],
  },
  {
    id: "scorecards-score-tracking",
    number: 14,
    title: "Scorecards and Score Tracking",
    category: "match-day",
    quick: "Scores go into Cricclubs during the match or before the following Monday.",
    items: [
      rule(
        "14.1",
        "Make sure scores are tracked correctly. Using the Cricclubs app to complete scoring is encouraged.",
      ),
      rule(
        "14.2",
        "It is the captain’s responsibility to share the scorecard with CIL. Each team must enter its score in Cricclubs either during the match or before the following Monday.",
      ),
      rule(
        "14.3",
        "Each team is responsible for verifying the whole scorecard, including the opponent’s. The scorecards entered by the teams are used as entered for all calculations.",
      ),
      rule(
        "14.4",
        "Umpires must make sure the score sheet is completed and submitted in Cricclubs at the end of the match. If a paper score sheet is used, umpires must sign the completed scorecard and ensure both captains also sign it.",
      ),
      rule(
        "14.5",
        "If a game is played under protest, this must be mentioned in the report. Any other issues (e.g., delays, misconduct, umpire incompetence, smoking) must also appear on the score sheet or be emailed to the committee.",
      ),
    ],
  },
  {
    id: "umpiring",
    number: 15,
    title: "Umpiring",
    category: "umpiring",
    quick: "Neutral umpires; details to CIL by Thursday; $25 to $50 penalties; conduct and bowling action.",
    items: [
      heading("Assignment and responsibilities"),
      rule(
        "15.1",
        "CIL assigns neutral umpires for all matches played according to the schedule. Umpiring is mandatory for CIL scheduled games.",
      ),
      rule(
        "15.2",
        "The captain of the umpiring team must share the umpire details with the CIL Committee on or before Thursday for the following weekend’s matches, and must ensure the umpires are on the ground at least 15 minutes before the scheduled start time.",
      ),
      rule(
        "15.3",
        "CIL expects support from non-playing teams to officiate the playoff matches. The committee will take care of umpires for the Semi-finals and Finals.",
      ),
      rule(
        "15.4",
        "If a team is unavailable to carry out umpiring duties, the team responsible for umpiring can arrange umpires from a different team in their own group.",
      ),
      rule(
        "15.5",
        "For rescheduled matches, the playing teams can check with the scheduled umpires to see if they are available. If not, the playing teams umpire themselves: two players from the batting team umpire while their team is batting. If the fielding side has an additional player, one player each from the batting and fielding sides can umpire.",
      ),
      heading("Umpiring penalties"),
      {
        kind: "table",
        caption: "Umpiring penalties",
        head: ["Violation", "Penalty"],
        rows: [
          ["Failing to share umpire details on or before Thursday", "$25"],
          ["At least one umpire not present at the toss", "$25"],
          [
            "One umpire arrived for the toss, but the second umpire did not join before the match start time",
            "$25",
          ],
          ["Both umpires arrived late", "$50"],
          [
            "Failing to pay the penalty in the following week",
            "1 point deducted from the points table, and disciplinary action",
          ],
        ],
      },
      heading("Authority and conduct"),
      rule(
        "15.6",
        "The umpire’s decision is final. The neutral umpire(s) are the sole judge(s) of fair and unfair play.",
      ),
      rule(
        "15.7",
        "Once a batsman is declared out, the umpire can revoke the decision before the batsman leaves the field, or the fielding captain can recall the batsman.",
      ),
      rule(
        "15.8",
        "In a potential or real dispute over a hit for 4/6 runs and/or a catch at the boundary, fielders are advised to stay put and help the umpire decide by holding their ground. The benefit of the doubt always goes to the batsman.",
      ),
      rule(
        "15.9",
        "There is no place for any act of violence on the field of play. CIL reserves the right to decide the penalty against the team(s), player(s) and/or umpire(s).",
      ),
      rule(
        "15.10",
        "Dissent and misconduct. The neutral umpires are empowered to oversee the behavior of the teams. In case of dissent by any player (such as abusive language, fighting on the field, too many appeals, or vehemently disagreeing with an umpire’s decision), the umpires may call the captain of the team involved and warn the player. If the behavior continues after two warnings:",
        [
          "The player is sent out of the game and cannot be replaced by a substitute, nor can he bat if he has not done so already.",
          "If the player’s team is the batting team, the batsman has already finished batting and the umpire has reported the incident, the player is banned from playing the next game.",
          "If it is the batting team and it happens during a game, the team is penalized 1 over of play.",
        ],
      ),
      rule(
        "15.11",
        "No one is allowed on the field during play other than the batsmen, the fielding side and the officials. In case of an injury, substitution, or bringing in drinks or equipment, the umpire must be notified. For any argument/conflict/appeal, only the team captains are allowed inside the field to talk with the umpires.",
      ),
      rule("15.12", "Umpires can change position between overs (this is not a mandatory CIL rule)."),
      heading("Intervention"),
      rule(
        "15.13",
        "The umpire(s) may intervene at any time, and it is the captain’s responsibility to take action when required. Umpires must intervene for:",
        [
          "Deliberate wasting of time by either team.",
          "Damaging the pitch by either team.",
          "Dangerous or unfair bowling by either team. Batsmen can report to both umpires if the bowling action is not fair, and the umpires can review the action and make the final call on whether the bowler can continue bowling.",
          "Tampering with the ball by either team.",
          "Any other action the umpire(s) consider unfair.",
        ],
      ),
      heading("Illegal bowling action (throwing)"),
      rule(
        "15.14",
        "A ball is considered thrown when the bowler’s elbow cannot fully straighten after the arm reaches shoulder height in the delivery swing. Wrist movement (flexing, rotating) is allowed.",
      ),
      rule(
        "15.15",
        "The umpires assess the delivery. If the ball has been thrown, the umpire calls and signals No-ball and, when the ball is dead, informs the other umpire of the reason. Although the striker’s end umpire has the primary responsibility for assessing fairness, the bowler’s end umpire may also call and signal No-ball if he/she considers the ball thrown.",
      ),
      rule(
        "15.16",
        "First offence – caution. The bowler’s end umpire cautions the bowler, informs the captain of the fielding side of the reason, and informs the batsmen at the wicket of what has occurred. This caution applies throughout the innings.",
      ),
      rule(
        "15.17",
        "Second offence – final warning. If, after the caution, either umpire considers that a further delivery by the same bowler in that innings is thrown, the same procedure is repeated, telling the bowler that this is a final warning. This warning also applies throughout the innings.",
      ),
      rule(
        "15.18",
        "Third offence – suspension. If either umpire considers that a further delivery by the same bowler in that innings is thrown, he calls and signals No-ball and, when the ball is dead, informs the other umpire of the reason. The bowler’s end umpire then directs the captain of the fielding side to suspend the bowler immediately. The over is completed by another bowler who has neither bowled the previous over (or part of it) nor is allowed to bowl any part of the next over. The suspended bowler cannot bowl again in that innings.",
      ),
      heading("Time delays"),
      rule(
        "15.19",
        "For time delays (lost ball, injured player, etc.), it is the neutral umpire’s duty to note the time. It is good practice for both captains to also note it and remind the neutral umpire. In all cases the neutral umpire’s decision is final, and no requests to reconsider time-delay issues can be made.",
      ),
      rule(
        "15.20",
        "Umpires are solely responsible for ensuring that no side intentionally or unintentionally causes significant delay to the game. Before deciding whether a bowling side should be penalized for a slow over rate, umpires must take into account delays due to rain, bad light, a lost ball and injury on the field.",
      ),
      heading("Administration"),
      rule(
        "15.21",
        "Umpires must take a team picture of both teams before the 8-over break of the 1st innings. Both team captains and the umpires are responsible.",
      ),
      rule(
        "15.22",
        "Team captains may lodge a complaint with the CIL committee if they are not satisfied with the standard of umpiring (in case of neutral umpiring).",
      ),
      rule(
        "15.23",
        "All umpires are advised to keep a hard copy or soft copy of the CIL rules while umpiring.",
      ),
    ],
  },
  {
    id: "final-provision",
    number: 16,
    title: "Final Provision",
    category: "umpiring",
    quick: "CIL may create or change rules for cases not covered above.",
    items: [
      rule(
        "16.1",
        "CIL reserves the right to create or change rules for any exception cases not mentioned above. At any point, the CIL committee has the right to revise these rules and regulations.",
      ),
    ],
  },
];
