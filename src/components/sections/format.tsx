const FACTS = [
  {
    tag: "Ball",
    body: "Hard tennis (red/yellow). CIL supplies the balls for every scheduled match — no need to bring your own.",
  },
  {
    tag: "Ground",
    body: "Baseball fields across Metro Atlanta. Boundary scoring is set per field category, from a tight 2D-and-out to a full 4-over-the-fence.",
  },
  {
    tag: "Overs",
    body: "15 a side, 9 players plus a super-sub. No LBWs, no last-man batting, max four overs per bowler.",
  },
  {
    tag: "Schedule",
    body: "Saturdays and Sundays. Matches can move by mutual agreement between captains — CIL keeps the ground booked either way.",
  },
];

const TIMELINE = [
  { when: "Aug 31", what: "Registration Opens", now: true },
  { when: "Sep 30", what: "Registration Closes" },
  { when: "Early Oct", what: "Teams Approved & Pools Set" },
  { when: "Oct 24", what: "League Stage Begins" },
  { when: "TBD", what: "Playoffs & Final" },
];

export function Format() {
  return (
    <section id="format" className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-11 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-10 flex max-w-[62ch] flex-col gap-2">
            <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">The Format</span>
            <h2 className="font-display text-[2rem] font-extrabold text-balance uppercase sm:text-[2.75rem]">
              Cricket, adapted for the diamond.
            </h2>
          </div>
          <div className="flex flex-col gap-6">
            {FACTS.map((fact, i) => (
              <div
                key={fact.tag}
                className={`grid grid-cols-[92px_1fr] gap-4 ${i < FACTS.length - 1 ? "border-line border-b pb-6" : ""}`}
              >
                <span className="font-data text-clay-bright pt-0.5 text-[0.68rem] tracking-[0.08em] uppercase">
                  {fact.tag}
                </span>
                <p className="text-chalk-dim">{fact.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-10 flex flex-col gap-2">
            <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">Key Dates</span>
            <h2 className="font-display text-xl font-extrabold uppercase">Tentative Schedule</h2>
          </div>
          <ol className="border-line border-l">
            {TIMELINE.map((item) => (
              <li key={item.when} className="relative py-0 pb-6 pl-6 last:pb-0">
                <span
                  className={`bg-pitch absolute top-[0.35rem] -left-[5px] h-[9px] w-[9px] border-[1.5px] ${
                    item.now
                      ? "border-gold bg-gold shadow-[0_0_0_4px_rgb(245_207_98/0.18)]"
                      : "border-chalk-faint"
                  }`}
                />
                <span
                  className={`font-data block text-[0.72rem] tracking-[0.08em] uppercase ${item.now ? "text-gold" : "text-chalk-faint"}`}
                >
                  {item.when}
                </span>
                <span className="font-display mt-0.5 block text-xl font-bold uppercase">{item.what}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
