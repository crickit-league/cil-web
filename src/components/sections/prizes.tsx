const PRIZES = [
  { rank: "Team", name: "Champions" },
  { rank: "Team", name: "Runners-Up" },
  { rank: "Match", name: "Playoff MOM" },
  { rank: "Individual", name: "Best Batsman" },
  { rank: "Individual", name: "Best Bowler" },
  { rank: "Individual", name: "Most Valuable Player" },
];

export function Prizes() {
  return (
    <section id="prizes" className="scroll-mt-20 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="mb-10 flex max-w-[62ch] flex-col gap-2">
          <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">
            What&rsquo;s on the Line
          </span>
          <h2 className="font-display text-[2rem] font-extrabold text-balance uppercase sm:text-[2.75rem]">
            Trophies &amp; recognition.
          </h2>
        </div>

        <div className="border-line bg-line grid grid-cols-2 gap-px border sm:grid-cols-3">
          {PRIZES.map((prize) => (
            <div key={prize.name} className="bg-pitch flex flex-col gap-2 p-6">
              <span className="font-data text-gold text-[0.66rem] tracking-[0.1em] uppercase">
                {prize.rank}
              </span>
              <span className="font-display text-xl font-bold uppercase">{prize.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
