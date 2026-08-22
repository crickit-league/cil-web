export function Sponsors() {
  return (
    <section className="bg-pitch-deep py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="mb-10 flex max-w-[62ch] flex-col gap-2">
          <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">Sponsors</span>
          <h2 className="font-display text-[2rem] font-extrabold text-balance uppercase sm:text-[2.75rem]">
            Backing the 2026&ndash;27 season.
          </h2>
        </div>

        <div className="border-line flex flex-col items-center gap-4 border-[1.5px] border-dashed px-6 py-11 text-center">
          <span className="font-data text-chalk-faint text-xs tracking-[0.18em] uppercase">
            Open for the 2026&ndash;27 season
          </span>
          <p className="text-chalk-dim max-w-[46ch]">
            This season&rsquo;s sponsors will appear here. Interested in backing 500+ players across fifteen
            teams? Reach out to the committee below.
          </p>
          <a
            href="#contact"
            className="font-data border-line text-chalk hover:border-chalk-dim hover:bg-dugout-2 inline-flex items-center gap-2 border bg-transparent px-6 py-3.5 text-xs tracking-[0.08em] uppercase transition-colors"
          >
            Become a Sponsor
          </a>
        </div>
      </div>
    </section>
  );
}
