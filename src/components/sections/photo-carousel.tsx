"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import ClassNames from "embla-carousel-class-names";
import type { EmblaCarouselType } from "embla-carousel";
import type { PublicPhoto } from "@/lib/services/photos";

/** How long each photo stays before autoplay advances, ms. */
const AUTOPLAY_MS = 3500;
/** Embla slide animation length (its unit is roughly frames; lower is snappier). */
const SLIDE_DURATION = 20;
/**
 * Embla can only loop when there are enough slides to fill the viewport on both
 * sides of the active one; with fewer it silently stops looping, and the last→first
 * move becomes a rewind. Below this many slides, the list is repeated to reach it.
 */
const MIN_LOOP_SLIDES = 4;

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
      className="border-line bg-pitch/70 text-chalk hover:border-clay hover:text-clay-bright flex h-12 w-12 items-center justify-center border backdrop-blur transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--clay) disabled:opacity-40"
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

export function PhotoCarousel({ photos }: { photos: PublicPhoto[] }) {
  const count = photos.length;
  const multiple = count > 1;
  const slides = useMemo(() => {
    const copies = multiple ? Math.ceil(MIN_LOOP_SLIDES / count) : 1;
    return Array.from({ length: copies }, (_, copy) => photos.map((photo) => ({ photo, copy }))).flat();
  }, [photos, count, multiple]);

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
      ClassNames(),
      ...(multiple
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
    [multiple],
  );

  const [viewportRef, api] = useEmblaCarousel(
    { loop: multiple, align: "center", skipSnaps: false, duration: SLIDE_DURATION, watchDrag: multiple },
    plugins,
  );

  const selectedSlide = useEmblaValue(api, ["select", "reInit"], () => api?.selectedScrollSnap() ?? 0, 0);
  const selected = selectedSlide % count;

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

  const current = photos[selected];

  return (
    <section
      id="photos"
      aria-roledescription="carousel"
      aria-label="Match photos"
      className="relative overflow-hidden py-14 sm:py-20"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") api?.scrollPrev();
        if (event.key === "ArrowRight") api?.scrollNext();
      }}
    >
      <div className="photo-stage pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1180px] px-5 sm:px-8">
        <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">This week</span>
        <h2 className="font-display mt-2 text-4xl leading-[0.95] font-extrabold uppercase sm:text-6xl">
          From the <span className="text-clay">boundary</span>
        </h2>
      </div>

      <div className="relative mt-8 sm:mt-10">
        <div
          ref={viewportRef}
          onPointerEnter={(event) => event.pointerType === "mouse" && setHovering(true)}
          onPointerLeave={() => setHovering(false)}
          className="photo-viewport overflow-hidden"
        >
          <div className="flex touch-pan-y">
            {slides.map(({ photo, copy }, slideIndex) => {
              const index = slideIndex % count;
              return (
                <div
                  key={`${photo.id}-${copy}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${count}`}
                  aria-hidden={slideIndex === selectedSlide ? undefined : true}
                  className="photo-slide min-w-0 flex-[0_0_88%] px-2 sm:flex-[0_0_72%] sm:px-4 lg:flex-[0_0_62%]"
                >
                  <figure className="photo-slide-inner border-line bg-pitch-deep relative aspect-[4/3] overflow-hidden border sm:aspect-[16/10]">
                    {/* Blurred copy of the photo fills the frame so portrait shots
                      aren't letterboxed against a flat colour. */}
                    <Image
                      src={photo.url}
                      alt=""
                      fill
                      sizes="48px"
                      quality={30}
                      className="scale-125 object-cover opacity-60 blur-2xl"
                      aria-hidden="true"
                    />
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? "CIL Winter League match photo"}
                      fill
                      sizes="(min-width: 1024px) 730px, (min-width: 640px) 72vw, 88vw"
                      priority={slideIndex === 0}
                      quality={78}
                      draggable={false}
                      className="object-contain"
                    />
                    {photo.caption ? (
                      <figcaption className="from-pitch-deep/95 via-pitch-deep/60 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-4 pt-14 pb-4 sm:px-6 sm:pb-5">
                        <p className="font-display max-w-[40ch] text-xl leading-tight font-bold text-balance sm:text-2xl">
                          {photo.caption}
                        </p>
                      </figcaption>
                    ) : null}
                  </figure>
                </div>
              );
            })}
          </div>
        </div>

        {multiple ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 left-0 hidden items-center justify-between px-4 sm:flex lg:px-[calc(50%-640px)]">
            <span className="pointer-events-auto">
              <Arrow direction="prev" onClick={() => api?.scrollPrev()} disabled={!api} />
            </span>
            <span className="pointer-events-auto">
              <Arrow direction="next" onClick={() => api?.scrollNext()} disabled={!api} />
            </span>
          </div>
        ) : null}
      </div>

      {multiple ? (
        <div className="relative mx-auto mt-6 flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 sm:px-8">
          <div
            className="flex w-full flex-wrap items-center gap-0 sm:w-auto sm:gap-1"
            role="tablist"
            aria-label="Choose photo"
          >
            {photos.map((photo, index) => (
              <button
                key={photo.id}
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
              {String(selected + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
            </span>
            {hasAutoplay ? (
              <button
                type="button"
                onClick={() => setWantsAutoplay((value) => !value)}
                aria-pressed={wantsAutoplay}
                aria-label={wantsAutoplay ? "Pause slideshow" : "Play slideshow"}
                className="font-data border-line text-chalk-dim hover:border-clay hover:text-chalk border px-3 py-2 text-[0.68rem] tracking-[0.1em] uppercase transition-colors"
              >
                {wantsAutoplay ? "Pause" : "Play"}
              </button>
            ) : null}
            <div className="order-first mr-auto flex gap-2 sm:hidden">
              <Arrow direction="prev" onClick={() => api?.scrollPrev()} disabled={!api} />
              <Arrow direction="next" onClick={() => api?.scrollNext()} disabled={!api} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Announce the slide change to screen readers, but only while the
          carousel isn't auto-advancing (polite spam otherwise). */}
      <p className="sr-only" aria-live={api && running ? "off" : "polite"}>
        {current?.caption ?? `Photo ${selected + 1} of ${photos.length}`}
      </p>
    </section>
  );
}
