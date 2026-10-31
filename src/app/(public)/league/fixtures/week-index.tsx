"use client";

import { useEffect, useRef, useState } from "react";

export type WeekIndexEntry = { id: string; label: string };

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A vertical index down the right edge, like the iPhone Contacts A-Z strip: tap a week, or drag along the
 * strip, and the page scrolls to that week's matches. The week in view is highlighted.
 */
export function WeekIndex({ entries }: { entries: WeekIndexEntry[] }) {
  const [active, setActive] = useState<string | null>(null);
  const dragging = useRef(false);
  const lastJump = useRef<string | null>(null);

  // Highlight the week whose heading is nearest the top third of the screen.
  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (changes) => {
        for (const c of changes) {
          if (c.isIntersecting) visible.add(c.target.id);
          else visible.delete(c.target.id);
        }
        const first = entries.find((e) => visible.has(e.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    for (const e of entries) {
      const el = document.getElementById(e.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [entries]);

  const jump = (id: string, smooth: boolean) => {
    if (lastJump.current === id) return;
    lastJump.current = id;
    setActive(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
      block: "start",
    });
  };

  const entryAt = (x: number, y: number) =>
    document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-week]")?.dataset.week ?? null;

  if (entries.length < 2) return null;

  return (
    // The column reserves the strip's width in the page layout (on phones it also takes over the page's right gutter,
    // so the strip sits flush with the screen edge). The strip itself is fixed to the screen,
    // 80% of its height and centered vertically, so it stays in view wherever the page is scrolled.
    <div className="-mr-5 w-7 shrink-0 sm:mr-0 sm:w-9">
      <nav
        aria-label="Jump to week"
        // touch-none: dragging along the strip must not scroll the page itself.
        className="font-data border-line fixed top-1/2 flex h-[80dvh] w-7 -translate-y-1/2 touch-none flex-col border-l select-none sm:w-9"
        onPointerDown={(e) => {
          dragging.current = true;
          lastJump.current = null;
          e.currentTarget.setPointerCapture(e.pointerId);
          const id = entryAt(e.clientX, e.clientY);
          if (id) jump(id, true);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const id = entryAt(e.clientX, e.clientY);
          if (id) jump(id, false);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        {entries.map((e, i) => {
          // "Oct 26" shows as a bold day, with the month above it only where the month changes.
          const [month, day] = e.label.split(" ");
          const showMonth = day !== undefined && month !== entries[i - 1]?.label.split(" ")[0];
          return (
            <a
              key={e.id}
              href={`#${e.id}`}
              data-week={e.id}
              aria-label={e.label}
              aria-current={active === e.id ? "true" : undefined}
              // The pointer handlers do the scrolling; the href is for keyboards and screen readers.
              onClick={(ev) => ev.preventDefault()}
              onKeyDown={(ev) => {
                if (ev.key === "Enter") jump(e.id, true);
              }}
              className={`-ml-px flex min-h-0 flex-1 flex-col items-center justify-center border-l-2 leading-none uppercase transition-colors ${
                active === e.id
                  ? "border-clay text-clay font-bold"
                  : "text-chalk-faint hover:text-chalk border-transparent"
              }`}
            >
              {showMonth ? (
                <span className="mb-0.5 text-[0.44rem] tracking-wide sm:text-[0.55rem]">{month}</span>
              ) : null}
              <span className="text-[0.6rem] sm:text-xs">{day ?? e.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
