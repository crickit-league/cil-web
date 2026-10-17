"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { UmpireForm } from "@/components/umpires/umpire-form";

// Inline umpire entry on the Fixtures list: "Enter umpires →" expands that
// card with the umpire form, and only one card is open at a time. The form
// and its server action are the shared ones (components/umpires); the
// service still decides whether a save is allowed (entry locked, match
// played).

type Expansion = {
  openId: string | null;
  savedId: string | null;
  open: (matchId: string) => void;
  close: () => void;
  saved: (matchId: string) => void;
};

const ExpansionContext = createContext<Expansion | null>(null);

function useExpansion() {
  const ctx = useContext(ExpansionContext);
  if (!ctx) throw new Error("Umpire entry must sit inside <FixtureExpansionProvider>.");
  return ctx;
}

export function FixtureExpansionProvider({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const value: Expansion = {
    openId,
    savedId,
    open: (matchId) => {
      setSavedId(null);
      setOpenId(matchId);
    },
    close: () => setOpenId(null),
    saved: (matchId) => {
      setOpenId(null);
      setSavedId(matchId);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedId(null), 4000);
    },
  };
  return <ExpansionContext.Provider value={value}>{children}</ExpansionContext.Provider>;
}

/** The footer action: "Enter umpires →" / "Change umpires →", or a brief "Saved" after a save. */
export function UmpireEntryToggle({ matchId, nominated }: { matchId: string; nominated: boolean }) {
  const { openId, savedId, open, close } = useExpansion();
  const isOpen = openId === matchId;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`umpire-entry-${matchId}`}
        onClick={() => (isOpen ? close() : open(matchId))}
        className="font-data text-clay-bright py-1 text-[0.68rem] tracking-[0.08em] whitespace-nowrap uppercase underline-offset-2 hover:underline"
      >
        {isOpen ? "Close" : nominated ? "Change umpires →" : "Enter umpires →"}
      </button>
      {savedId === matchId ? (
        <span role="status" className="font-data text-gold text-[0.68rem] tracking-[0.08em] uppercase">
          ✓ Saved
        </span>
      ) : null}
    </div>
  );
}

const TRANSITION_MS = 300;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The expanding panel under the card's footer. Opens with a height
 * transition from @starting-style, closes by transitioning back to 0 and then
 * unmounting — so a reopened form always starts clean (saved numbers are
 * never pre-filled). Timers rather than transitionend drive the follow-up
 * steps, since transitionend doesn't fire when there's no transition
 * (reduced motion, a backgrounded tab).
 */
export function UmpireEntryPanel({
  matchId,
  umpireOneName,
  umpireTwoName,
}: {
  matchId: string;
  umpireOneName: string | null;
  umpireTwoName: string | null;
}) {
  const { openId, close, saved } = useExpansion();
  const isOpen = openId === matchId;
  const [mounted, setMounted] = useState(isOpen);
  // Mount as soon as the card opens (state adjusted during render, not in an effect).
  if (isOpen && !mounted) setMounted(true);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = prefersReducedMotion();
    if (isOpen) {
      // Once open, bring the card to the top so the phone keyboard doesn't cover the fields.
      const timer = setTimeout(
        () => {
          panelRef.current
            ?.closest("li")
            ?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
          panelRef.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
        },
        reduce ? 0 : TRANSITION_MS,
      );
      return () => clearTimeout(timer);
    }
    if (mounted) {
      const timer = setTimeout(() => setMounted(false), reduce ? 0 : TRANSITION_MS);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mounted]);

  if (!mounted) return null;

  return (
    <div
      id={`umpire-entry-${matchId}`}
      ref={panelRef}
      inert={!isOpen}
      className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
        isOpen ? "grid-rows-[1fr] starting:grid-rows-[0fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="border-line mt-4 border-t pt-4">
          <UmpireForm
            matchId={matchId}
            umpireOneName={umpireOneName}
            umpireTwoName={umpireTwoName}
            onSaved={() => saved(matchId)}
            onCancel={close}
          />
        </div>
      </div>
    </div>
  );
}
