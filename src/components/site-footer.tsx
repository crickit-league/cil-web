import { CrestBadge } from "./crest-badge";

export function SiteFooter() {
  return (
    <footer className="border-line border-t py-10">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-5 px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <CrestBadge size={56} />
          <span className="flex flex-col gap-0.5">
            <span className="font-display text-lg leading-none font-extrabold tracking-wide uppercase">
              Crick-It
            </span>
            <span className="font-data text-chalk-dim text-[0.62rem] tracking-[0.16em] uppercase">
              Inter League
            </span>
          </span>
        </div>

        <div className="font-data text-chalk-faint flex flex-wrap gap-6 text-[0.7rem] tracking-[0.08em] uppercase">
          <span>Metro Atlanta, GA</span>
          <span>Est. 2013</span>
          <span>2026&ndash;27 Season</span>
        </div>
      </div>
    </footer>
  );
}
