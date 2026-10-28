import { matchLabel } from "@/lib/match-label";
import { formatMatchDay } from "@/lib/time";
import type { MomEntry, PublicPhoto } from "@/lib/services/photos";
import type { ScheduleMatch } from "@/lib/services/schedule";

// TEMPORARY: made-up Man of the Match content so the home carousel and the
// /mom/[id] page can be reviewed without real photos. REMOVE BEFORE MERGING TO
// MAIN: delete this file and public/mock/, and drop the mockMomEnabled() branches
// in lib/services/photos.ts (listHomePhotos and getMomEntry). The team and player
// names are invented, and the linked fixture pages don't exist.
//
// It is ON by default, including in production builds. Set MOCK_MOM=0 to see real data.
export function mockMomEnabled(): boolean {
  return process.env.MOCK_MOM !== "0";
}

const DAY = 24 * 3_600_000;
const team = (name: string) => ({ id: `mock-team-${name}`, name });

type Seed = {
  n: number;
  daysAgo: number;
  one: string;
  two: string;
  scores: [number, number, number, number, number, number]; // one: runs, wkts, balls; two: runs, wkts, balls
  winner: 1 | 2;
  result: string;
  title: string;
  body: string;
  ground: string;
};

const SEEDS: Seed[] = [
  {
    n: 1,
    daysAgo: 3,
    one: "Roswell Royals",
    two: "Decatur Dynamos",
    scores: [142, 6, 90, 118, 9, 90],
    winner: 1,
    result: "won by 24 runs",
    title: "Man of the Match: R. Patel",
    body: "Patel hit 52 off 24 balls to lift the Royals from a slow start, then took 2 for 14 with the ball.\n\nHis fifty came in the last six overs of the innings, and the Dynamos never recovered from losing two wickets in his first over.",
    ground: "Larry Bell Park",
  },
  {
    n: 2,
    daysAgo: 4,
    one: "Duluth Dragons",
    two: "Marietta Mavericks",
    scores: [96, 10, 86, 97, 4, 70],
    winner: 2,
    result: "won by 6 wickets",
    title: "Man of the Match: S. Iyer",
    body: "Four wickets for 18 runs, including a hat-trick in the 12th over, bowled the Dragons out for 96.\n\nIyer then calmly saw the chase home with the Mavericks' fourth-wicket pair.",
    ground: "Harrison Field 6",
  },
  {
    n: 3,
    daysAgo: 10,
    one: "Alpharetta Aces",
    two: "Smyrna Spartans",
    scores: [117, 7, 90, 118, 5, 78],
    winner: 2,
    result: "won by 5 wickets",
    title: "Man of the Match: A. Khan",
    body: "An unbeaten 61 chased down 118 with two overs to spare.\n\nKhan found the gaps square of the wicket early, then cleared the rope twice in the 13th over to finish it.",
    ground: "Bell Memorial Park 3",
  },
  {
    n: 4,
    daysAgo: 11,
    one: "Kennesaw Knights",
    two: "Cumming Cobras",
    scores: [131, 5, 90, 107, 8, 90],
    winner: 1,
    result: "won by 24 runs",
    title: "Man of the Match: D. Reddy",
    body: "Three catches in the deep, then 28 not out off 11 balls at the death to push the Knights past 130.",
    ground: "Skip Wells 2",
  },
  {
    n: 5,
    daysAgo: 17,
    one: "Peachtree Panthers",
    two: "Georgia Gladiators",
    scores: [124, 8, 90, 125, 6, 87],
    winner: 2,
    result: "won by 4 wickets",
    title: "Man of the Match: K. Menon",
    body: "A last-over finish. Menon needed 9 off the final over and got there with a ramp and a scampered two off the fifth ball.",
    ground: "RAP 2",
  },
];

function fixture(seed: Seed, now: Date): ScheduleMatch {
  const one = team(seed.one);
  const two = team(seed.two);
  const winner = seed.winner === 1 ? one : two;
  const [r1, w1, b1, r2, w2, b2] = seed.scores;
  return {
    id: `mock-match-${seed.n}`,
    stage: "LEAGUE",
    startsAt: new Date(now.getTime() - seed.daysAgo * DAY),
    timeTbd: false,
    status: "COMPLETED",
    fixtureStatus: "COMPLETED",
    result: { kind: "win", winner, text: seed.result },
    scores: [
      { team: one, runs: r1, wickets: w1, legalBalls: b1 },
      { team: two, runs: r2, wickets: w2, legalBalls: b2 },
    ],
    resultText: null,
    teamOne: one,
    teamTwo: two,
    teamOneSource: null,
    teamTwoSource: null,
    umpiringTeam: null,
    ground: seed.ground,
    umpires: { one: null, two: null, hasPhones: false },
  };
}

export function mockMomEntries(now = new Date()): MomEntry[] {
  return SEEDS.map((seed) => {
    const match = fixture(seed, now);
    return {
      id: `mock-mom-${seed.n}`,
      url: `/mock/mom-${seed.n}.jpg`,
      width: 1200,
      height: 1600,
      caption: null,
      title: seed.title,
      body: seed.body,
      createdAt: new Date(now.getTime() - seed.daysAgo * DAY),
      match,
    };
  });
}

export function mockMomEntry(id: string): MomEntry | null {
  return mockMomEntries().find((e) => e.id === id) ?? null;
}

export function mockMomPhotos(): PublicPhoto[] {
  return mockMomEntries().map((e) => {
    const m = e.match!;
    return {
      id: e.id,
      url: e.url,
      caption: e.caption,
      title: e.title,
      body: e.body,
      width: e.width,
      height: e.height,
      match: {
        id: m.id,
        label: `${matchLabel(m.teamOne, m.teamTwo)} · ${formatMatchDay(m.startsAt!)}`,
        href: `/league/fixtures/${m.id}`,
      },
    };
  });
}
