/** Section heading in the site's style: a small caps label over a big display title, with a short accent rule under it. */
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
    <div>
      {eyebrow ? (
        <span className="font-data text-clay-bright block text-xs tracking-[0.18em] uppercase">
          {eyebrow}
        </span>
      ) : null}
      <Tag
        id={id}
        className="font-display mt-1.5 text-4xl leading-[0.95] font-extrabold tracking-wide uppercase sm:text-5xl"
      >
        {title}
      </Tag>
      <span aria-hidden="true" className="bg-clay mt-3 block h-1 w-12 rounded-full" />
    </div>
  );
}
