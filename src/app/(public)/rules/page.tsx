import type { Metadata } from "next";
import { RuleBook } from "@/components/rules/rule-book";
import { RULE_BOOK_PDF } from "@/lib/rules/winter-2026-27";

export const metadata: Metadata = {
  title: "Rules",
  description: "Search the CIL Winter 2026–27 rule book, or download it as a PDF.",
};

export default function RulesPage() {
  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h1 className="font-display text-[2.5rem] leading-none font-extrabold uppercase sm:text-[3.5rem]">
            Rules
          </h1>
          <a
            href={RULE_BOOK_PDF.href}
            download={RULE_BOOK_PDF.fileName}
            className="bg-clay text-on-accent hover:bg-clay-bright font-data inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 text-xs tracking-[0.1em] uppercase transition-colors"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M10 3v10m0 0-4-4m4 4 4-4M4 17h12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download PDF
          </a>
        </div>
        <RuleBook />
      </div>
    </section>
  );
}
