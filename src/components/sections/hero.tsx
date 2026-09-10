export function Hero() {
  return (
    <section className="hero-texture hero-crest-watermark relative overflow-hidden py-16 sm:py-24 lg:py-28">
      <div className="relative z-10 mx-auto grid max-w-[1180px] grid-cols-1 items-end gap-11 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">
            Metro Atlanta &middot; Est. 2013
          </span>
          <h1 className="font-display mt-3 text-[3rem] leading-[0.92] font-extrabold text-balance uppercase sm:text-[4.5rem] lg:text-[6.3rem]">
            The 2026&ndash;27
            <br />
            Season Begins
            <br />
            <span className="text-clay">October 24.</span>
          </h1>
          <p className="text-chalk-dim mt-6 max-w-[46ch] text-lg">
            Thirteen years of weekend cricket on Atlanta&rsquo;s ballfields continues. F15, hard tennis ball,
            one trophy. Team registration opens August&nbsp;31.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#register"
              className="font-data border-clay bg-clay text-chalk hover:border-clay-bright hover:bg-clay-bright inline-flex items-center gap-2 border px-6 py-3.5 text-xs tracking-[0.08em] uppercase transition-colors"
            >
              Register Your Team
            </a>
            <a
              href="#format"
              className="font-data border-line text-chalk hover:border-chalk-dim hover:bg-dugout-2 inline-flex items-center gap-2 border bg-transparent px-6 py-3.5 text-xs tracking-[0.08em] uppercase transition-colors"
            >
              See the Format
            </a>
          </div>
        </div>

        <div className="border-line bg-dugout relative border">
          <div className="border-chalk/[0.06] absolute inset-1.5 border" />
          <div className="border-line flex items-center justify-between border-b px-4 py-3.5">
            <span className="font-data text-chalk-dim flex items-center gap-2 text-[0.68rem] tracking-[0.14em] uppercase">
              <span className="bg-gold h-[7px] w-[7px] rounded-full shadow-[0_0_8px_rgb(245_207_98/0.7)]" />
              Season Card
            </span>
            <span className="font-data text-chalk-dim text-[0.68rem] tracking-[0.14em] uppercase">
              2026&ndash;27
            </span>
          </div>
          <dl className="grid grid-cols-2">
            {[
              ["F15", "Format"],
              ["13th", "Season"],
            ].map(([value, label], i) => (
              <div key={label} className={`p-[1.15rem] ${i % 2 === 0 ? "border-line border-r" : ""}`}>
                <dd className="font-data text-chalk text-3xl leading-none font-semibold">{value}</dd>
                <dt className="font-data text-chalk-faint mt-1.5 text-[0.66rem] tracking-[0.1em] uppercase">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
