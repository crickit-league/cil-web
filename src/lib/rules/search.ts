import type { RuleItem, RuleSection } from "./winter-2026-27";
import { RULE_BOOK } from "./winter-2026-27";

// Words that are often followed by a number without forming a name ("rule 8.10").
const NOT_LABELS = new Set(["rule", "rules", "section", "over", "overs", "page"]);

/**
 * Splits a search box value into lowercase terms; every term must match. A word
 * followed by a number is one term ("cat 3", "field 6"), so it finds that name
 * and not every row that has "cat" somewhere and a 3 somewhere else.
 */
export function searchTerms(query: string): string[] {
  // Punctuation is ignored, so "no ball" and "no-ball" are the same search. Kept: digits and
  // "." / "$" (rule numbers, prices) and "|" (alternatives); apostrophes are dropped, not split on.
  const words = query
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9.$|\s]+/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[.|]+|[.|]+$/g, ""))
    .filter(Boolean);
  const terms: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const next = words[i + 1];
    if (/^[a-z]+$/.test(words[i]) && !NOT_LABELS.has(words[i]) && next !== undefined && /^\d+$/.test(next)) {
      terms.push(`${words[i]} ${next}`);
      i++;
    } else {
      terms.push(words[i]);
    }
  }
  return terms;
}

const escapeRegExp = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Apostrophes are dropped from the query, so each letter may be followed by one in the
// text: "captains" finds "captain’s".
const withApostrophes = (term: string) => Array.from(term, (ch) => escapeRegExp(ch)).join("['’]?");

/**
 * A term matches where a word starts, not in the middle of one ("cat" finds
 * "CAT 3" and "category", not "allocated"). A term ending in a digit also can't
 * run into more digits, so "8.1" doesn't find rule 8.10. "a|b" matches either
 * word, which the Popular buttons use ("penalt|fine").
 */
export function termPattern(term: string, flags = "i"): RegExp {
  const alternatives = term
    .split("|")
    .filter(Boolean)
    .map((alt) => withApostrophes(alt) + (/\d$/.test(alt) ? "(?![0-9])" : ""));
  return new RegExp(`(^|[^a-z0-9])(${alternatives.join("|")})`, flags);
}

const matchesAll = (haystack: string, terms: string[]) =>
  terms.every((term) => termPattern(term).test(haystack));

/** Splits text into plain and matching parts, for highlighting search terms. */
export function splitByTerms(text: string, terms: string[]): { text: string; hit: boolean }[] {
  if (terms.length === 0) return [{ text, hit: false }];
  const ranges: [number, number][] = [];
  for (const term of terms) {
    const pattern = termPattern(term, "gi");
    for (let m = pattern.exec(text); m; m = pattern.exec(text)) {
      const start = m.index + m[1].length;
      ranges.push([start, start + m[2].length]);
      // Continue right after the match: the leading boundary character may be shared.
      pattern.lastIndex = start + m[2].length;
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const parts: { text: string; hit: boolean }[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (end <= cursor) continue;
    const from = Math.max(start, cursor);
    if (from > cursor) parts.push({ text: text.slice(cursor, from), hit: false });
    parts.push({ text: text.slice(from, end), hit: true });
    cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });
  return parts;
}

const itemText = (item: RuleItem): string => {
  switch (item.kind) {
    case "rule":
      return [item.num, item.text, ...(item.bullets ?? [])].join(" ");
    case "table":
      return [item.caption ?? "", ...item.head, ...item.rows.flat()].join(" ");
    case "cards":
      return item.cards
        .flatMap((c) => [c.title, c.subtitle, ...c.lines.flatMap((l) => [l.label, l.value]), ...c.notes])
        .join(" ");
    case "figures":
      return item.figures.map((f) => f.caption).join(" ");
    default:
      return item.text;
  }
};

/**
 * Whether content matches the search: it must contain at least one term itself,
 * and every term must appear in it or in its context (the section title and
 * sub-heading it sits under). So "late start" finds the rules and tables under
 * "Late Starts, Forfeits and Walkovers" that mention "start", although none
 * of them says "late", while a title word alone ("umpiring") doesn't pull in
 * every rule of the section.
 */
function matchesInContext(own: string, context: string, terms: string[]): boolean {
  return terms.some((term) => termPattern(term).test(own)) && matchesAll(`${own} ${context}`, terms);
}

/**
 * Just the content that matches the search (see matchesInContext), grouped by
 * the section it sits in: matching rules, notes, figures and field cards. A
 * table keeps only its matching rows, unless its caption or header matches.
 * Sub-headings are never shown in results. No terms returns everything.
 */
export function filterRuleBook(sections: RuleSection[], terms: string[]): RuleSection[] {
  if (terms.length === 0) return sections;

  const result: RuleSection[] = [];
  for (const section of sections) {
    const items: RuleItem[] = [];
    let heading = "";
    for (const item of section.items) {
      if (item.kind === "heading") {
        heading = item.text;
        continue;
      }
      const context = `${section.title} ${heading}`;

      if (item.kind === "table") {
        const frame = [item.caption ?? "", ...item.head].join(" ");
        if (matchesInContext(frame, context, terms)) {
          items.push(item);
          continue;
        }
        const rows = item.rows.filter((row) => matchesInContext(row.join(" "), `${context} ${frame}`, terms));
        if (rows.length > 0) items.push({ ...item, rows });
      } else if (matchesInContext(itemText(item), context, terms)) {
        items.push(item);
      }
    }
    if (items.length > 0) result.push({ ...section, items });
  }
  return result;
}

export function countMatches(sections: RuleSection[]): number {
  return sections.reduce(
    (total, section) =>
      total +
      section.items.reduce((n, item) => {
        if (item.kind === "rule") return n + 1;
        if (item.kind === "table") return n + item.rows.length;
        return n;
      }, 0),
    0,
  );
}

/** The section that holds a given rule number, e.g. "8.10". */
export function sectionOfRule(num: string, sections: RuleSection[] = RULE_BOOK): RuleSection | undefined {
  return sections.find((s) => s.items.some((i) => i.kind === "rule" && i.num === num));
}
