"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { EmblaCarouselType } from "embla-carousel";
import { SectionTitle } from "@/components/section-title";
import type { PublicPhoto } from "@/lib/services/photos";

/** How long each photo stays before autoplay advances, ms. */
const AUTOPLAY_MS = 3500;
/** Embla slide animation length (its unit is roughly frames; lower is snappier). */
const SLIDE_DURATION = 20;

// Subscribes React to an Embla event set, so selected-slide / play-state are
// read through useSyncExternalStore rather than mirrored into state by effects.
function useEmblaValue<T>(api: EmblaCarouselType | undefined, events: string[], read: () => T, fallback: T) {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!api) return () => {};
      events.forEach((name) => api.on(name as Parameters<typeof api.on>[0], notify));
      return () => events.forEach((name) => api.off(name as Parameters<typeof api.off>[0], notify));
    },
    // `events` is a constant literal at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api],
  );
  return useSyncExternalStore(
    subscribe,
    () => (api ? read() : fallback),
    () => fallback,
  );
}

function Arrow({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous photo" : "Next photo"}
      className="border-line bg-pitch/70 text-chalk hover:border-clay hover:text-clay-bright flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--clay) disabled:opacity-40"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={direction === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Tailwind's `sm` breakpoint: three cards on screen from here up, one below.
const WIDE_QUERY = "(min-width: 640px)";
const subscribeWide = (notify: () => void) => {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const useIsWide = () =>
  useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  );

export function PhotoCarousel({
  photos,
  roomBelow = false,
}: {
  photos: PublicPhoto[];
  /** Extra space under the controls for content that overlaps the carousel's bottom edge (the home page's score strip). */
  roomBelow?: boolean;
}) {
  const count = photos.length;
  const multiple = count > 1;
  // Man of the Match photos are portrait, so each slide is a tall card. Wide screens show
  // three (previous, current, next) lined up with the page; a phone shows the current one
  // with its neighbours peeking. Every card shares one frame so the height never jumps.
  // Embla loops by moving the same cards round, never by drawing a photo twice, but it
  // needs a few more cards than are on screen to do that. With fewer, wide screens get a
  // still row; a phone (one card on screen) still slides through them, and autoplay rewinds
  // from the last photo to the first instead of looping.
  const canLoop = count >= 4;
  const isWide = useIsWide();
  const slideshow = canLoop || (!isWide && multiple);
  const slides = photos;

  // The Autoplay plugin is only a timer here: it never starts itself (playOnInit
  // off) and can't restart itself. stopOnInteraction MUST stay true: with it off
  // the plugin registers a pointerUp handler that calls play() after every drag,
  // restarting the timer behind our state's back (paused + swipe = running, with
  // the label still saying Play). With it on, a drag only stops the timer. Whether it runs is decided in
  // one place, the effect below, from two pieces of React state:
  //   wantsAutoplay — the viewer's intent, shown by the Play/Pause button.
  //   hovering      — a mouse is over the slides (temporary pause, not intent).
  // The plugin's own play/stop events fire before its internal flag flips, so
  // reading isPlaying() from them left the button label stale; and its
  // stopOnInteraction/stopOnMouseEnter can't tell a hover pause from an explicit one.
  const plugins = useMemo(
    () => [
      ...(slideshow
        ? [
            Autoplay({
              delay: AUTOPLAY_MS,
              playOnInit: false,
              stopOnInteraction: true,
              stopOnMouseEnter: false,
              stopOnFocusIn: false,
            }),
          ]
        : []),
    ],
    [slideshow],
  );

  const [viewportRef, api] = useEmblaCarousel(
    {
      loop: canLoop,
      align: slideshow ? "center" : "start",
      containScroll: canLoop ? false : "trimSnaps",
      skipSnaps: false,
      duration: SLIDE_DURATION,
      watchDrag: multiple,
    },
    plugins,
  );

  const selectedSlide = useEmblaValue(api, ["select", "reInit"], () => api?.selectedScrollSnap() ?? 0, 0);
  const selected = selectedSlide;
  // Several cards share a screen, so there are fewer stops than photos.
  const snapCount = useEmblaValue(api, ["reInit"], () => api?.scrollSnapList().length ?? count, count);
  const canPrev = useEmblaValue(api, ["select", "reInit"], () => api?.canScrollPrev() ?? false, false);
  const canNext = useEmblaValue(api, ["select", "reInit"], () => api?.canScrollNext() ?? false, false);

  // Starts paused for people who've asked the OS for reduced motion; they can
  // still press Play, since that's an explicit choice.
  const [wantsAutoplay, setWantsAutoplay] = useState(() => !prefersReducedMotion());
  const [hovering, setHovering] = useState(false);
  const hasAutoplay = Boolean(api?.plugins().autoplay);
  const running = wantsAutoplay && !hovering;

  // Time-left indicator, driven by the plugin's own timer so it can't drift (declared before the effect that starts the timer, so the first arming isn't missed): each
  // time it (re)arms, `timeUntilNext()` is the time this photo has left; when it
  // stops (paused, hovered, dragged) the bar resets.
  const [timer, setTimer] = useState<{ id: number; ms: number } | null>(null);
  useEffect(() => {
    if (!api) return;
    const armed = () => {
      const ms = api.plugins().autoplay?.timeUntilNext();
      if (ms != null) setTimer((prev) => ({ id: (prev?.id ?? 0) + 1, ms }));
    };
    const cleared = () => setTimer(null);
    // The plugin's custom events aren't in Embla's event-name union.
    const events = api as unknown as {
      on(event: string, cb: () => void): void;
      off(event: string, cb: () => void): void;
    };
    events.on("autoplay:timerset", armed);
    events.on("autoplay:timerstopped", cleared);
    return () => {
      events.off("autoplay:timerset", armed);
      events.off("autoplay:timerstopped", cleared);
    };
  }, [api]);

  useEffect(() => {
    const autoplay = api?.plugins().autoplay;
    if (!autoplay) return;
    const sync = () => (running ? autoplay.play() : autoplay.stop());
    sync();
    // Embla re-initialises plugins on resize (e.g. a phone's URL bar collapsing),
    // which leaves Autoplay stopped; re-assert our state afterwards.
    api?.on("reInit", sync);
    return () => {
      api?.off("reInit", sync);
      autoplay.stop();
    };
  }, [api, running]);

  // Grabbing the slides (touch or mouse) switches autoplay off until Play is pressed.
  useEffect(() => {
    if (!api) return;
    const stop = () => setWantsAutoplay(false);
    api.on("pointerDown", stop);
    return () => {
      api.off("pointerDown", stop);
    };
  }, [api]);

  const current = photos[Math.min(selected, photos.length - 1)];

  return (
    <section
      id="photos"
      aria-roledescription="carousel"
      aria-label="Match photos"
      className={`relative overflow-hidden pt-5 sm:pt-6 ${roomBelow ? "pb-24 sm:pb-28" : "pb-5 sm:pb-6"}`}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") api?.scrollPrev();
        if (event.key === "ArrowRight") api?.scrollNext();
      }}
    >
      <div className="photo-stage pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1180px] px-5 sm:px-8">
        <SectionTitle
          eyebrow="Man of the match"
          title={
            <>
              Players of the <span className="text-clay">week</span>
            </>
          }
        />
      </div>

      <div className="relative mx-auto mt-5 max-w-[1180px] sm:mt-6 sm:px-8">
        <div
          ref={viewportRef}
          onPointerEnter={(event) => event.pointerType === "mouse" && setHovering(true)}
          onPointerLeave={() => setHovering(false)}
          className={`photo-viewport overflow-hidden ${multiple ? "cursor-grab active:cursor-grabbing" : ""}`}
        >
          <div className="flex touch-pan-y sm:justify-center">
            {slides.map((photo, slideIndex) => {
              const index = slideIndex;
              return (
                <div
                  key={photo.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${count}`}
                  aria-hidden={slideIndex === selectedSlide ? undefined : true}
                  className="photo-slide min-w-0 flex-[0_0_58%] px-1.5 sm:flex-[0_0_33.3333%] sm:px-2.5"
                >
                  <Link
                    href={`/mom/${photo.id}`}
                    draggable={false}
                    tabIndex={slideIndex === selectedSlide ? 0 : -1}
                    aria-label={`${photo.title ?? photo.caption ?? "Match photo"}: view details`}
                    className="focus-visible:outline-clay block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <div
                      className={`transition duration-300 motion-reduce:transition-none ${
                        slideshow && slideIndex !== selectedSlide ? "scale-[0.94] opacity-60" : ""
                      }`}
                    >
                      <figure className="border-line bg-pitch-deep relative aspect-[3/4] overflow-hidden rounded-xl border sm:aspect-[4/5]">
                        <Image
                          src={photo.url}
                          alt={photo.title ?? photo.caption ?? "CIL Winter League match photo"}
                          fill
                          sizes="(min-width: 1180px) 372px, (min-width: 640px) 31vw, 58vw"
                          priority={false}
                          quality={78}
                          draggable={false}
                          className="object-cover object-top"
                        />
                      </figure>
                      {/* The title sits under the picture, not over it, so it stays easy to read. */}
                      {(photo.title ?? photo.caption) ? (
                        <p className="font-display text-chalk mt-2 line-clamp-2 text-base leading-tight font-bold sm:text-lg">
                          {photo.title ?? photo.caption}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {canLoop ? (
          // Arrows sit over the outer cards' edges.
          <div className="pointer-events-none absolute inset-y-0 right-0 left-0 hidden items-center justify-between px-1 sm:flex lg:px-2">
            <span className="pointer-events-auto">
              <Arrow direction="prev" onClick={() => api?.scrollPrev()} disabled={!canPrev} />
            </span>
            <span className="pointer-events-auto">
              <Arrow direction="next" onClick={() => api?.scrollNext()} disabled={!canNext} />
            </span>
          </div>
        ) : null}
      </div>

      {canLoop ? (
        <div className="relative mx-auto mt-4 hidden max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 sm:flex sm:px-8">
          <div
            className="flex w-full flex-wrap items-center gap-0 sm:w-auto sm:gap-1"
            role="tablist"
            aria-label="Choose photo"
          >
            {Array.from({ length: snapCount }, (_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === selected}
                aria-label={`Show photo ${index + 1}`}
                onClick={() => api?.scrollTo(index)}
                className="group flex h-8 items-center px-1 focus-visible:outline-2 focus-visible:outline-(--clay)"
              >
                <span
                  className={`relative block h-[3px] overflow-hidden transition-all duration-300 motion-reduce:transition-none ${
                    index === selected
                      ? `w-12 ${timer ? "bg-clay/30" : "bg-clay"}`
                      : "bg-line group-hover:bg-chalk-dim w-5"
                  }`}
                >
                  {index === selected && timer ? (
                    <span
                      key={timer.id}
                      className="photo-dash-fill bg-clay absolute inset-0"
                      style={{ "--photo-dash-ms": `${timer.ms}ms` } as React.CSSProperties}
                    />
                  ) : null}
                </span>
              </button>
            ))}
          </div>

          <div className="flex w-full items-center justify-end gap-4 sm:w-auto">
            <span className="font-data text-chalk-dim text-xs tracking-[0.1em]" aria-hidden="true">
              {String(selected + 1).padStart(2, "0")} / {String(snapCount).padStart(2, "0")}
            </span>
            {hasAutoplay ? (
              <button
                type="button"
                onClick={() => setWantsAutoplay((value) => !value)}
                aria-pressed={wantsAutoplay}
                aria-label={wantsAutoplay ? "Pause slideshow" : "Play slideshow"}
                className="font-data border-line text-chalk-dim hover:border-clay hover:text-chalk rounded-full border px-3.5 py-2 text-[0.68rem] tracking-[0.1em] uppercase transition-colors"
              >
                {wantsAutoplay ? "Pause" : "Play"}
              </button>
            ) : null}
            <div className="order-first mr-auto flex gap-2 sm:hidden">
              <Arrow direction="prev" onClick={() => api?.scrollPrev()} disabled={!canPrev} />
              <Arrow direction="next" onClick={() => api?.scrollNext()} disabled={!canNext} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Announce the slide change to screen readers, but only while the
          carousel isn't auto-advancing (polite spam otherwise). */}
      <p className="sr-only" aria-live={api && running ? "off" : "polite"}>
        {current?.title ?? current?.caption ?? `Photo ${selected + 1} of ${photos.length}`}
      </p>
    </section>
  );
}
