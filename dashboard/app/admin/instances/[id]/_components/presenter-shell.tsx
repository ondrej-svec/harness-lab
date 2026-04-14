"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { advancePresenterToAgendaItemAction } from "../_actions/agenda";
import { SceneRail, type SceneRailItem } from "./scene-rail";

// Local-state presenter carousel.
//
// The server pre-renders every scene in the active agenda item's
// surface and hands them to this component as `slides`. PresenterShell
// holds an `activeIndex` in local state. Swipe / arrow / wheel / rail
// handlers update the state directly — there is no router round trip
// per navigation, so transitions feel instant and the entry/exit
// animation runs at 60fps off the GPU.
//
// URL sync is intentionally OUT of React's lifecycle: we call
// `window.history.replaceState` directly after the local index
// changes. Using `router.replace` would force Next.js to re-run the
// server component for the new URL (the route is `force-dynamic`),
// which rebuilds the `slides` prop from scratch. With local
// `activeIndex` state preserved across that re-render, the index
// could end up pointing at a different slide if the rebuilt pack's
// contents differ — that was the cause of the "scene 1/5 but rail
// dot at the bottom" desync. `replaceState` updates the address bar
// without telling React or Next anything, so slides stays referentially
// stable and indices stay aligned.
//
// Animation strategy: every slide lives in the DOM at all times,
// stacked at `position: absolute`. The `slides` track translates by
// `-activeIndex * 100%` along the Y axis. Motion's spring layout is
// GPU-accelerated and animates the whole stack as one transform — no
// per-slide AnimatePresence orchestration, no `mode="wait"` delay.
// Reduced motion users get an instant snap.

const SWIPE_THRESHOLD = 80; // px — feel-tuned for iPadOS
const SWIPE_VELOCITY = 500; // px/sec — quick flick bypasses threshold
const WHEEL_THRESHOLD = 30; // accumulated deltaY before navigation
const WHEEL_GESTURE_QUIET_MS = 450; // wheel quiet period that ends a gesture (must outlast Mac trackpad inertia)
const WHEEL_REVERSAL_THRESHOLD = 30; // |deltaY| in opposite direction that counts as a new physical gesture
const WHEEL_RISING_EDGE_RATIO = 3; // |delta| must exceed min-since-fired by this factor to count as a new gesture
const WHEEL_RISING_EDGE_MIN = 20; // ignore rising edges below this magnitude (sub-pixel noise)
const NAVIGATE_COOLDOWN_MS = 220; // ignore further keyboard/swipe triggers right after a nav
const SCROLL_BOUNDARY_TOLERANCE = 4; // px — accommodates retina sub-pixel scrollTop

export type PresenterSlide = {
  id: string;
  content: ReactNode;
};

export function PresenterShell({
  slides,
  railItems,
  initialSceneId,
  instanceId,
  lang,
  previousAgendaItemId,
  nextAgendaItemId,
  previousAgendaLabel,
  nextAgendaLabel,
}: {
  slides: readonly PresenterSlide[];
  railItems: readonly SceneRailItem[];
  initialSceneId: string | null;
  instanceId: string;
  lang: "cs" | "en";
  /** Agenda item id of the previous phase. Cross-agenda nav
   *  fall-through fires when the user gestures backward off the
   *  first slide. Null when at the first agenda item. The action
   *  also flips the live marker so the participant surface follows. */
  previousAgendaItemId?: string | null;
  /** Agenda item id of the next phase. */
  nextAgendaItemId?: string | null;
  /** Optional human label for the boundary hint chip. */
  previousAgendaLabel?: string | null;
  nextAgendaLabel?: string | null;
}) {
  const reduceMotion = useReducedMotion();
  const [isCrossingAgenda, startCrossingAgenda] = useTransition();

  // Resolve the initial index from the supplied scene id. Falls back
  // to the first slide if the id is missing (defensive — server should
  // always pass a valid id when slides.length > 0).
  const resolvedInitialIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.id === initialSceneId),
  );
  const [activeIndex, setActiveIndex] = useState(resolvedInitialIndex);

  // Refs let handlers see the freshest values without re-creating
  // listeners on every render — the stale-closure trap that caused
  // the "first arrow press does nothing" bug.
  const activeIndexRef = useRef(activeIndex);
  const slidesRef = useRef(slides);
  const railItemsRef = useRef(railItems);
  const previousAgendaIdRef = useRef(previousAgendaItemId ?? null);
  const nextAgendaIdRef = useRef(nextAgendaItemId ?? null);
  const cooldownUntilRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const wheelLastEventTimeRef = useRef(0);
  const wheelGestureFiredRef = useRef(false);
  const wheelGestureDirectionRef = useRef(0); // sign of the navigation that fired (1, -1, or 0 if not fired)
  const wheelMinMagSinceFiredRef = useRef(Infinity); // smallest |deltaY| seen since last fire — inertia decays, so a later larger delta means new input

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    slidesRef.current = slides;
    railItemsRef.current = railItems;
    previousAgendaIdRef.current = previousAgendaItemId ?? null;
    nextAgendaIdRef.current = nextAgendaItemId ?? null;
  }, [slides, railItems, previousAgendaItemId, nextAgendaItemId]);

  // Defensive: if the parent re-renders with a different slides prop
  // (server re-render after a navigation that landed via Next.js router
  // somewhere else), realign activeIndex so the visible slide matches
  // what the parent considers current. This is belt-and-braces — the
  // window.history.replaceState path below should never trigger a
  // server re-render, so this almost never fires in practice.
  useEffect(() => {
    const currentId = slides[activeIndexRef.current]?.id;
    if (!currentId) {
      const fallback = Math.max(0, slides.findIndex((slide) => slide.id === initialSceneId));
      setActiveIndex(fallback);
    }
  }, [slides, initialSceneId]);

  // Sync the URL bar without telling React or Next anything. Using
  // window.history.replaceState skips the entire Next.js routing
  // pipeline — no server re-render, no slides prop churn, no Suspense
  // boundary flicker. Hard-load / share-link / refresh still work
  // because the URL is canonical at all times.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const railItem = railItems[activeIndex];
    if (!railItem) return;
    const here = window.location.pathname + window.location.search;
    if (here !== railItem.href) {
      window.history.replaceState(null, "", railItem.href);
    }
    // Reset the entering slide's scroll position so re-entering a tall
    // slide always starts from the top. Each slide section carries the
    // data-presenter-slide marker.
    const slideSections = document.querySelectorAll<HTMLElement>('[data-presenter-slide="true"]');
    const target = slideSections[activeIndex];
    if (target) {
      target.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const crossAgenda = useCallback(
    (targetAgendaId: string) => {
      // Submit the action via a transition so React keeps the current
      // UI mounted while the server processes the side effect (set
      // current agenda + redirect). The transition's pending state
      // shows the loading overlay below.
      startCrossingAgenda(async () => {
        const formData = new FormData();
        formData.set("instanceId", instanceId);
        formData.set("agendaId", targetAgendaId);
        formData.set("lang", lang);
        await advancePresenterToAgendaItemAction(formData);
      });
    },
    [instanceId, lang],
  );

  // Inner navigation primitive — no cooldown, no gesture state.
  // Wheel handler calls this directly because it manages its own
  // gesture-debouncing. Keyboard / rail / swipe go through the
  // `navigate()` wrapper below which adds a short cooldown.
  const performNavigation = useCallback(
    (delta: number) => {
      const slidesNow = slidesRef.current;
      const currentIndex = activeIndexRef.current;
      const nextIndex = currentIndex + delta;

      // Edge fall-through: gesturing past the first or last slide
      // jumps to the neighboring agenda item's first scene AND
      // flips the live marker so participants follow.
      if (nextIndex < 0) {
        const target = previousAgendaIdRef.current;
        if (!target) return;
        crossAgenda(target);
        return;
      }
      if (nextIndex >= slidesNow.length) {
        const target = nextAgendaIdRef.current;
        if (!target) return;
        crossAgenda(target);
        return;
      }

      setActiveIndex(nextIndex);
    },
    [crossAgenda],
  );

  const navigate = useCallback(
    (delta: number) => {
      if (Date.now() < cooldownUntilRef.current) {
        return;
      }
      cooldownUntilRef.current = Date.now() + NAVIGATE_COOLDOWN_MS;
      performNavigation(delta);
    },
    [performNavigation],
  );

  // Keyboard parity: down/right/space/PgDn = next, up/left/PgUp = prev.
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === "ArrowRight" ||
        event.key === " "
      ) {
        event.preventDefault();
        navigate(1);
        return;
      }
      if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate]);

  // Trackpad two-finger scroll → next/previous scene.
  //
  // The hard rule: ONE physical gesture must fire EXACTLY ONE
  // navigation. Mac trackpad inertia routinely lasts 300-600ms and
  // emits a continuous stream of decaying wheel events. Any "force
  // unlock" timer shorter than that tail lets an inertia event
  // re-trigger navigation.
  //
  // But a pure quiet-window approach blocks the other direction: if
  // the user keeps scrolling into a new physical gesture before the
  // inertia tail of the previous one has finished, the quiet window
  // never triggers and the handler stays locked.
  //
  // Solution: three independent unlock conditions.
  //
  //   (a) Quiet window — 450ms of no wheel events means the inertia
  //       tail has fully decayed. Clean gesture-over signal.
  //
  //   (b) Direction reversal — a strong event (≥30px) in the
  //       opposite direction from the fired nav. Inertia never
  //       reverses sign, so a reversal is always a new physical
  //       gesture. Enables fast bounce-back.
  //
  //   (c) Rising edge — a |deltaY| ≥ 3× the smallest |deltaY| seen
  //       since firing (and ≥ 20px in absolute terms). Inertia decays
  //       monotonically, so a rising magnitude after a decay is a new
  //       physical gesture. Enables rapid same-direction scrolling
  //       without a 450ms pause.
  //
  // Three concerns this handler also resolves:
  //
  //   1. Inner scrollable children (textareas, details bodies) keep
  //      their own scroll behavior. Walk up the DOM; bail on any
  //      scrollable ancestor before the slide container.
  //
  //   2. Tall slides scroll within first, only navigate at the
  //      boundary (iOS Safari / scroll-deck pattern).
  //
  //   3. Wheel calls performNavigation directly so it never collides
  //      with the keyboard/swipe/rail cooldown.
  useEffect(() => {
    function handleWheel(event: WheelEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // 1. Walk up; bail to inner scrollable, otherwise find the slide.
      let node: HTMLElement | null = target;
      let slideContainer: HTMLElement | null = null;
      while (node && node !== document.body) {
        if (node.dataset?.presenterSlide === "true") {
          slideContainer = node;
          break;
        }
        const style = window.getComputedStyle(node);
        if (
          (style.overflowY === "auto" || style.overflowY === "scroll") &&
          node.scrollHeight > node.clientHeight
        ) {
          return;
        }
        node = node.parentElement;
      }

      // 2. Boundary check on tall slides. Mid-slide → let the
      //    browser scroll, but ALSO update wheelLastEventTime so the
      //    quiet-period clock starts ticking from the moment the
      //    user actually stops scrolling.
      if (slideContainer && slideContainer.scrollHeight > slideContainer.clientHeight + SCROLL_BOUNDARY_TOLERANCE) {
        const scrollTop = slideContainer.scrollTop;
        const maxScroll = slideContainer.scrollHeight - slideContainer.clientHeight;
        const atTop = scrollTop <= SCROLL_BOUNDARY_TOLERANCE;
        const atBottom = scrollTop >= maxScroll - SCROLL_BOUNDARY_TOLERANCE;
        if (event.deltaY > 0 && !atBottom) {
          wheelAccumRef.current = 0;
          wheelGestureFiredRef.current = false;
          wheelGestureDirectionRef.current = 0;
          wheelLastEventTimeRef.current = Date.now();
          return;
        }
        if (event.deltaY < 0 && !atTop) {
          wheelAccumRef.current = 0;
          wheelGestureFiredRef.current = false;
          wheelGestureDirectionRef.current = 0;
          wheelLastEventTimeRef.current = Date.now();
          return;
        }
      }

      // 3. Gesture-debouncing logic.
      const now = Date.now();
      const elapsedSinceLastWheel = now - wheelLastEventTimeRef.current;
      wheelLastEventTimeRef.current = now;

      const mag = Math.abs(event.deltaY);

      // Quiet-period detection: if wheel has been silent for 450ms,
      // the previous gesture (and its inertia tail) has ended.
      if (elapsedSinceLastWheel > WHEEL_GESTURE_QUIET_MS) {
        wheelAccumRef.current = 0;
        wheelGestureFiredRef.current = false;
        wheelGestureDirectionRef.current = 0;
        wheelMinMagSinceFiredRef.current = Infinity;
      }

      if (wheelGestureFiredRef.current) {
        // Same-gesture lock. Three ways out:
        //
        // A) Quiet window — already handled above.
        // B) Direction reversal — user pushed hard in the opposite
        //    direction. Inertia never reverses sign.
        // C) Rising edge — current |deltaY| is ≥ 3× the smallest
        //    magnitude seen since the fire AND ≥ 20px absolute.
        //    Inertia decays monotonically, so a rising magnitude
        //    after a decay is new physical input.
        const firedDir = wheelGestureDirectionRef.current;
        const isOppositeReversal =
          (firedDir > 0 && event.deltaY <= -WHEEL_REVERSAL_THRESHOLD) ||
          (firedDir < 0 && event.deltaY >= WHEEL_REVERSAL_THRESHOLD);

        const minSoFar = wheelMinMagSinceFiredRef.current;
        const isRisingEdge =
          mag >= WHEEL_RISING_EDGE_MIN &&
          minSoFar < Infinity &&
          mag >= minSoFar * WHEEL_RISING_EDGE_RATIO;

        if (!isOppositeReversal && !isRisingEdge) {
          // Update the running minimum so a later event can be
          // compared against a lower floor. Inertia always decays,
          // so the minimum walks down over time.
          if (mag < minSoFar) {
            wheelMinMagSinceFiredRef.current = mag;
          }
          return;
        }

        // Re-arm for a new navigation.
        wheelGestureFiredRef.current = false;
        wheelGestureDirectionRef.current = 0;
        wheelMinMagSinceFiredRef.current = Infinity;
        wheelAccumRef.current = 0;
      }

      wheelAccumRef.current += event.deltaY;
      if (wheelAccumRef.current > WHEEL_THRESHOLD) {
        wheelGestureFiredRef.current = true;
        wheelGestureDirectionRef.current = 1;
        wheelMinMagSinceFiredRef.current = mag;
        wheelAccumRef.current = 0;
        performNavigation(1);
      } else if (wheelAccumRef.current < -WHEEL_THRESHOLD) {
        wheelGestureFiredRef.current = true;
        wheelGestureDirectionRef.current = -1;
        wheelMinMagSinceFiredRef.current = mag;
        wheelAccumRef.current = 0;
        performNavigation(-1);
      }
    }
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [performNavigation]);

  const offsetExpression = `calc(-${activeIndex} * 100%)`;
  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 320, damping: 36, mass: 0.85 };

  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      role="region"
      aria-label="presenter scene navigator"
      aria-roledescription="carousel"
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragEnd={(_event, info) => {
          if (info.offset.y < -SWIPE_THRESHOLD || info.velocity.y < -SWIPE_VELOCITY) {
            navigate(1);
            return;
          }
          if (info.offset.y > SWIPE_THRESHOLD || info.velocity.y > SWIPE_VELOCITY) {
            navigate(-1);
            return;
          }
        }}
        style={{ touchAction: "pan-x" }}
        className="absolute inset-0"
      >
        {/* Sliding track. Every slide lives in the DOM stacked
            absolutely so the only animation cost is the parent
            transform. */}
        <motion.div
          animate={{ y: offsetExpression }}
          transition={transition}
          className="absolute inset-0"
        >
          {slides.map((slide, index) => (
            <section
              key={slide.id}
              data-presenter-slide="true"
              aria-hidden={index !== activeIndex}
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${slides.length}`}
              style={{ top: `${index * 100}%` }}
              className="absolute inset-x-0 h-screen w-full overflow-y-auto"
            >
              <div className="mx-auto flex min-h-screen max-w-[100rem] flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
                {slide.content}
              </div>
            </section>
          ))}
        </motion.div>
      </motion.div>

      {/* Subtle progress indicator in the bottom-left corner. Covers
          the missing "where am I" cue for keyboard / trackpad users
          who never look at the rail. */}
      {slides.length > 1 ? (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-6 z-30 select-none rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] shadow-[0_8px_18px_rgba(28,25,23,0.08)] backdrop-blur"
        >
          {activeIndex + 1} / {slides.length}
        </div>
      ) : null}

      {/* Cross-agenda boundary hint. Only renders when the user is on
          the first slide (and a previous agenda item exists) or the
          last slide (and a next agenda item exists). One more swipe /
          arrow press past the edge advances to that agenda item. */}
      {activeIndex === 0 && previousAgendaLabel ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-30 select-none rounded-full border border-dashed border-[var(--border)] bg-[var(--surface-panel)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] shadow-[0_8px_18px_rgba(28,25,23,0.08)] backdrop-blur">
          ↑ {previousAgendaLabel}
        </div>
      ) : null}
      {activeIndex === slides.length - 1 && nextAgendaLabel ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-30 select-none rounded-full border border-dashed border-[var(--border)] bg-[var(--surface-panel)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] shadow-[0_8px_18px_rgba(28,25,23,0.08)] backdrop-blur">
          ↓ {nextAgendaLabel}
        </div>
      ) : null}

      <SceneRail
        items={railItems}
        activeSceneId={slides[activeIndex]?.id ?? null}
        onNavigate={(targetId) => {
          const targetIndex = slidesRef.current.findIndex((slide) => slide.id === targetId);
          if (targetIndex >= 0 && targetIndex !== activeIndexRef.current) {
            cooldownUntilRef.current = Date.now() + NAVIGATE_COOLDOWN_MS;
            setActiveIndex(targetIndex);
          }
        }}
      />

      {/* Phase-change loading overlay. Renders during the transition
          fired by crossAgenda(): we're switching agenda items, so the
          server has to re-derive the entire scene pack. The overlay
          gives the facilitator a clear "phase changing" cue instead
          of a frozen UI. */}
      {isCrossingAgenda ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-[color:color-mix(in_oklab,var(--surface-admin)_72%,transparent)] backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-5 py-2 text-sm text-[var(--text-primary)] shadow-[0_18px_36px_rgba(28,25,23,0.12)]">
            <span
              aria-hidden
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--text-primary)]"
            />
            <span>{lang === "en" ? "Changing phase…" : "Měním fázi…"}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
