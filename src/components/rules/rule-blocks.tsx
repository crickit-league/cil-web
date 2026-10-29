import { Fragment } from "react";
import { splitByTerms } from "@/lib/rules/search";
import type { RuleItem } from "@/lib/rules/winter-2026-27";

// Wraps each occurrence of a search term in <mark>, using the same word-start
// matching as the search itself so what is highlighted is what matched.
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;
  return (
    <>
      {splitByTerms(text, terms).map((part, i) =>
        part.hit ? (
          <mark key={i} className="bg-gold/30 text-chalk rounded-sm px-0.5">
            {part.text}
          </mark>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}

function RuleTable({ item, terms }: { item: Extract<RuleItem, { kind: "table" }>; terms: string[] }) {
  // More than ~3 columns is a stacked-card list on phones, a table from sm up.
  const wide = item.head.length > 3;
  return (
    <>
      <div className={`border-line overflow-hidden border ${wide ? "hidden sm:block" : ""}`}>
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{item.caption}</caption>
          <thead className="bg-dugout-2 font-data text-chalk-dim text-[0.68rem] tracking-[0.08em] uppercase">
            <tr>
              {item.head.map((h) => (
                <th key={h} scope="col" className="px-3 py-2 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {item.rows.map((row, r) => (
              <tr key={r} className="border-line border-t">
                {row.map((cell, c) => (
                  <td key={c} className="px-3 py-2 align-top">
                    <Highlight text={cell} terms={terms} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {wide ? (
        <ul className="flex flex-col gap-3 sm:hidden">
          {item.rows.map((row, r) => (
            <li key={r} className="border-line bg-dugout flex flex-col gap-1.5 border p-4">
              <span className="font-display text-lg font-extrabold uppercase">
                <Highlight text={row[0]} terms={terms} />
              </span>
              {row.slice(1).map((cell, c) => (
                <span key={c} className="flex flex-col text-sm">
                  <span className="font-data text-chalk-dim text-[0.65rem] tracking-[0.08em] uppercase">
                    {item.head[c + 1]}
                  </span>
                  <Highlight text={cell} terms={terms} />
                </span>
              ))}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export function RuleBlock({
  item,
  terms,
  onZoom,
}: {
  item: RuleItem;
  terms: string[];
  onZoom: (figure: { src: string; alt: string }) => void;
}) {
  switch (item.kind) {
    case "heading":
      return (
        <h4 className="font-data text-clay-bright pt-3 text-xs tracking-[0.14em] uppercase">{item.text}</h4>
      );
    case "note":
      return (
        <p className="text-chalk-dim max-w-[72ch] text-sm italic">
          <Highlight text={item.text} terms={terms} />
        </p>
      );
    case "table":
      return (
        <div className="flex flex-col gap-3">
          <RuleTable item={item} terms={terms} />
        </div>
      );
    case "cards":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {item.cards.map((card) => (
            <article key={card.title} className="border-line bg-dugout-2 flex flex-col gap-3 border p-4">
              <header>
                <h5 className="font-display text-xl leading-none font-extrabold uppercase">
                  <Highlight text={card.title} terms={terms} />
                </h5>
                <p className="text-chalk-dim mt-1 text-sm">
                  <Highlight text={card.subtitle} terms={terms} />
                </p>
              </header>
              <dl className="flex flex-col gap-2 text-sm">
                {card.lines.map((l) => (
                  <div key={l.label} className="flex flex-col">
                    <dt className="font-data text-chalk-dim text-[0.65rem] tracking-[0.08em] uppercase">
                      {l.label}
                    </dt>
                    <dd>
                      <Highlight text={l.value} terms={terms} />
                    </dd>
                  </div>
                ))}
              </dl>
              <ul className="text-chalk-dim marker:text-clay list-disc space-y-1.5 pl-5 text-sm">
                {card.notes.map((n) => (
                  <li key={n}>
                    <Highlight text={n} terms={terms} />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      );
    case "figures":
      return (
        <div className="grid gap-4 sm:grid-cols-3">
          {item.figures.map((f) => (
            <figure key={f.src} className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => onZoom(f)}
                aria-label={`Enlarge: ${f.caption}`}
                className="border-line focus-visible:outline-clay block cursor-zoom-in overflow-hidden border bg-white focus-visible:outline-2"
              >
                {/* Static diagrams cropped from the PDF; next/image adds nothing for a few small PNGs. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.src} alt={f.alt} loading="lazy" className="h-auto w-full" />
              </button>
              <figcaption className="text-chalk-dim text-xs">
                <Highlight text={f.caption} terms={terms} />
              </figcaption>
            </figure>
          ))}
        </div>
      );
    case "rule":
      return (
        <div
          id={`rule-${item.num}`}
          className="grid scroll-mt-28 grid-cols-[3rem_1fr] gap-x-3 rounded-sm transition-shadow sm:grid-cols-[3.5rem_1fr]"
        >
          <span className="font-data text-chalk-dim pt-0.5 text-xs">
            <Highlight text={item.num} terms={terms} />
          </span>
          <div className="flex max-w-[72ch] flex-col gap-2">
            <p>
              <Highlight text={item.text} terms={terms} />
            </p>
            {item.bullets ? (
              <ul className="text-chalk-dim marker:text-clay list-disc space-y-1.5 pl-5 text-sm">
                {item.bullets.map((b) => (
                  <li key={b}>
                    <Highlight text={b} terms={terms} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      );
  }
}
