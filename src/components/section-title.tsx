/** Section heading in the site's style: a small caps label over a big display title, led by a slanted bar. */
export function SectionTitle({
  eyebrow,
  title,
  id,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  id?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="flex items-stretch gap-3">
      <span aria-hidden="true" className="bg-clay w-1.5 shrink-0 -skew-x-[18deg]" />
      <div>
        {eyebrow ? (
          <span className="font-data text-clay-bright block text-xs tracking-[0.18em] uppercase">
            {eyebrow}
          </span>
        ) : null}
        <Tag
          id={id}
          className="font-display text-4xl leading-[0.95] font-extrabold tracking-wide uppercase sm:text-5xl"
        >
          {title}
        </Tag>
      </div>
    </div>
  );
}
