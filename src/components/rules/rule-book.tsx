"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { countMatches, filterRuleBook, searchTerms, sectionOfRule } from "@/lib/rules/search";
import { RULE_BOOK, RULE_BOOK_EMAIL, RULE_CATEGORIES, type RuleCategoryId } from "@/lib/rules/winter-2026-27";
import { POPULAR_TOPICS } from "@/lib/rules/topics";
import { Highlight, RuleBlock } from "./rule-blocks";

const ruleCount = (items: { kind: string }[]) => items.filter((i) => i.kind === "rule").length;

export function RuleBook() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RuleCategoryId | "all">("all");
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const terms = useMemo(() => searchTerms(query), [query]);
  const searching = terms.length > 0;
  const searched = useMemo(() => filterRuleBook(RULE_BOOK, terms), [terms]);
  const sections = useMemo(
    () => (category === "all" ? searched : searched.filter((s) => s.category === category)),
    [searched, category],
  );
  const matches = useMemo(() => countMatches(sections), [sections]);
  const categoryCounts = useMemo(() => {
    const counts = new Map<RuleCategoryId | "all", number>([["all", countMatches(searched)]]);
    for (const c of RULE_CATEGORIES) {
      counts.set(c.id, countMatches(searched.filter((s) => s.category === c.id)));
    }
    return counts;
  }, [searched]);

  // "/" jumps to the search box, as long as the user isn't already typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setZoom(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A new search always covers every category; a chip left selected from before
  // would silently hide matches. Pick a chip after searching to narrow it down.
  const updateQuery = (value: string) => {
    setQuery(value);
    if (value.trim()) setCategory("all");
  };

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
  };

  // Used by Quick Answers: clear any filter that would hide the rule, open its
  // card, then scroll to it and flash it once it has rendered.
  const openRule = useCallback((num: string, sectionId?: string) => {
    const id = sectionId ?? sectionOfRule(num)?.id;
    if (!id) return;
    setQuery("");
    setCategory("all");
    setOpen((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      const el = document.getElementById(num ? `rule-${num}` : id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-clay");
      window.setTimeout(() => el.classList.remove("ring-2", "ring-clay"), 1400);
    }, 80);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="text-chalk-faint pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={searchRef}
            id="rule-search"
            type="search"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder="Search rules, e.g. free hit, forfeit, super over, 8.10"
            aria-label="Search the rules"
            autoComplete="off"
            spellCheck={false}
            className="border-line bg-dugout text-chalk placeholder:text-chalk-faint focus:border-clay w-full border py-3 pr-10 pl-10 text-base outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
              aria-label="Clear search"
              className="bg-dugout-2 text-chalk-dim hover:text-chalk absolute top-1/2 right-2.5 size-6 -translate-y-1/2 rounded-full text-xs"
            >
              ✕
            </button>
          ) : null}
        </div>

        <div className="hidden gap-2 pb-1 sm:flex sm:flex-wrap">
          {([{ id: "all", label: "All" }, ...RULE_CATEGORIES] as const).map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c.id)}
                className={`font-data shrink-0 border px-3.5 py-2 text-[0.8rem] tracking-[0.04em] whitespace-nowrap transition-colors ${
                  active
                    ? "bg-clay border-clay text-on-accent"
                    : "border-line text-chalk-dim hover:border-clay hover:text-chalk"
                }`}
              >
                {c.label} <span className="opacity-60">{categoryCounts.get(c.id)}</span>
              </button>
            );
          })}
        </div>

        {!searching ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase">
              Popular
            </span>
            {POPULAR_TOPICS.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => updateQuery(t.query)}
                className="border-line text-chalk hover:border-clay hover:bg-dugout rounded-full border px-3.5 py-1.5 text-sm transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}

        {searching ? (
          <p role="status" aria-live="polite" className="text-chalk-dim text-xs">
            {matches === 0
              ? "No matches."
              : `${matches} ${matches === 1 ? "match" : "matches"} in ${sections.length} ${sections.length === 1 ? "section" : "sections"}`}
          </p>
        ) : null}
      </div>

      {sections.length === 0 ? (
        <div className="border-line bg-dugout flex flex-col items-start gap-2 border p-6 sm:p-8">
          <p className="font-display text-xl font-extrabold uppercase">No rules match that</p>
          <p className="text-chalk-dim max-w-[60ch] text-sm">
            Try fewer or different words, or a rule number such as 8.10. For anything the rules don&apos;t
            cover, email{" "}
            <a href={`mailto:${RULE_BOOK_EMAIL}`} className="text-chalk underline">
              {RULE_BOOK_EMAIL}
            </a>
            .
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="border-line hover:border-clay font-data mt-2 border px-3 py-1.5 text-xs tracking-[0.08em] uppercase"
          >
            Reset filters
          </button>
        </div>
      ) : searching ? (
        <ul className="flex flex-col gap-3" aria-label="Search results">
          {sections.flatMap((section) =>
            section.items.map((item, i) => (
              <li
                key={`${section.id}-${i}`}
                className="border-line bg-dugout border-l-clay flex flex-col gap-2.5 border border-l-4 px-4 py-3"
              >
                <button
                  type="button"
                  onClick={() => openRule(item.kind === "rule" ? item.num : "", section.id)}
                  className="font-data text-chalk-dim hover:text-clay-bright self-start text-[0.68rem] tracking-[0.1em] uppercase"
                >
                  {section.number}. {section.title}
                  {item.kind === "table" && item.caption ? ` · ${item.caption}` : ""} →
                </button>
                <RuleBlock item={item} terms={terms} onZoom={setZoom} />
              </li>
            )),
          )}
        </ul>
      ) : (
        <div className="flex flex-col gap-3">
          {sections.map((section) => {
            const isOpen = searching || open.has(section.id);
            const original = RULE_BOOK.find((s) => s.id === section.id);
            const total = original ? ruleCount(original.items) : 0;
            return (
              <section
                key={section.id}
                id={section.id}
                className="border-line bg-dugout border-l-clay scroll-mt-28 border border-l-4"
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => toggle(section.id)}
                    aria-expanded={isOpen}
                    aria-controls={`${section.id}-body`}
                    className="focus-visible:outline-clay flex w-full items-start gap-3 px-4 py-3.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2"
                  >
                    <span className="font-display text-clay-bright w-7 shrink-0 text-2xl leading-none font-extrabold">
                      {section.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-display block text-lg leading-tight font-extrabold uppercase sm:text-xl">
                        <Highlight text={section.title} terms={terms} />
                      </span>
                      <span className="text-chalk-dim mt-1 block text-sm">{section.quick}</span>
                      <span className="font-data text-chalk-faint mt-1.5 block text-[0.65rem] tracking-[0.1em] uppercase">
                        {total} {total === 1 ? "rule" : "rules"}
                      </span>
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className={`text-chalk-faint mt-1 size-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </h3>
                {isOpen ? (
                  <div
                    id={`${section.id}-body`}
                    className="border-line flex flex-col gap-4 border-t px-4 py-5"
                  >
                    {section.items.map((item, i) => (
                      <RuleBlock key={i} item={item} terms={terms} onZoom={setZoom} />
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      <div className="text-chalk-dim flex max-w-[80ch] flex-col gap-1.5 text-xs">
        <p>
          Questions about the rules:{" "}
          <a href={`mailto:${RULE_BOOK_EMAIL}`} className="text-chalk underline">
            {RULE_BOOK_EMAIL}
          </a>
        </p>
      </div>

      {zoom ? (
        <div
          role="dialog"
          aria-label="Diagram enlarged"
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[70] flex cursor-zoom-out items-start justify-center overflow-auto bg-black/90 p-4"
        >
          <button
            type="button"
            onClick={() => setZoom(null)}
            aria-label="Close"
            className="fixed top-3 right-3.5 size-10 rounded-full bg-white/15 text-xl hover:bg-white/30"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom.src} alt={zoom.alt} className="h-auto w-full max-w-[1000px] rounded-md bg-white" />
        </div>
      ) : null}
    </div>
  );
}
