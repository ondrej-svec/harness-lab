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
const WHEEL_THRESHOLD = 60; // accumulated deltaY before navigation
const WHEEL_GESTURE_QUIET_MS = 200; // wheel quiet period that ends a gesture
const NAVIGATE_COOLDOWN_MS = 250; // ignore further keyboard/swipe triggers right after a nav

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

  const navigate = useCallback(
    (delta: number) => {
      const slidesNow = slidesRef.current;
      const currentIndex = activeIndexRef.current;
      const nextIndex = currentIndex + delta;

      if (Date.now() < cooldownUntilRef.current) {
        return;
      }

      // Edge fall-through: gesturing past the first or last slide
      // jumps to the neighboring agenda item's first scene AND
      // flips the live marker so participants follow.
      if (nextIndex < 0) {
        const target = previousAgendaIdRef.current;
        if (!target) return;
        cooldownUntilRef.current = Date.now() + NAVIGATE_COOLDOWN_MS;
        crossAgenda(target);
        return;
      }
      if (nextIndex >= slidesNow.length) {
        const target = nextAgendaIdRef.current;
        if (!target) return;
        cooldownUntilRef.current = Date.now() + NAVIGATE_COOLDOWN_MS;
        crossAgenda(target);
        return;
      }

      cooldownUntilRef.current = Date.now() + NAVIGATE_COOLDOWN_MS;
      setActiveIndex(nextIndex);
    },
    [crossAgenda],
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
  // Three intertwined concerns this handler resolves:
  //
  // 1. Mac trackpads emit a continuous stream of wheel events for a
  //    single physical scroll gesture (including a long inertia tail).
  //    A naive "navigate when the accumulator crosses a threshold"
  //    fires twice per gesture because the inertia tail re-crosses
  //    the threshold. Fix: gesture-based debouncing. A "gesture" is
  //    a continuous run of wheel events with <200ms gaps. At most ONE
  //    navigation per gesture.
  //
  // 2. The slide content can be taller than the viewport. We don't
  //    want to hijack scrolling INSIDE a tall slide — the user should
  //    be able to read the body before advancing. Fix: only navigate
  //    when the user is at the slide's scroll boundary AND continues
  //    in the same direction (the iOS Safari "rubber band" pattern).
  //
  // 3. Inner scrollable elements like inline-edit textareas should
  //    keep their own scroll behavior without ever triggering scene
  //    navigation. Fix: walk up from the wheel target; if we hit an
  //    inner scrollable ancestor BEFORE the slide container, drop
  //    the event and let the browser handle the inner scroll.
  useEffect(() => {
    function handleWheel(event: WheelEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Walk up the DOM tree from the wheel target. If we find the
      // slide container (data-presenter-slide), check its boundary.
      // If we find an inner scrollable ancestor first, leave it alone.
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
          // Inner scrollable (textarea, details body, etc.) — let
          // the browser scroll it without us hijacking.
          return;
        }
        node = node.parentElement;
      }

      // If the slide container itself can scroll, only navigate when
      // the user is pushing past its boundary in the same direction
      // as the wheel delta.
      if (slideContainer && slideContainer.scrollHeight > slideContainer.clientHeight) {
        const scrollTop = slideContainer.scrollTop;
        const maxScroll = slideContainer.scrollHeight - slideContainer.clientHeight;
        const atTop = scrollTop <= 1;
        const atBottom = scrollTop >= maxScroll - 1;
        if (event.deltaY > 0 && !atBottom) {
          // Scrolling down but the slide still has room — let the
          // browser scroll the slide and reset our gesture state so
          // the moment we DO hit the bottom is treated as a fresh
          // gesture.
          wheelAccumRef.current = 0;
          wheelGestureFiredRef.current = false;
          return;
        }
        if (event.deltaY < 0 && !atTop) {
          wheelAccumRef.current = 0;
          wheelGestureFiredRef.current = false;
          return;
        }
      }

      const now = Date.now();
      const elapsedSinceLastWheel = now - wheelLastEventTimeRef.current;
      wheelLastEventTimeRef.current = now;

      if (elapsedSinceLastWheel > WHEEL_GESTURE_QUIET_MS) {
        // New physical gesture starts. Reset accumulator + fired flag
        // so this gesture can navigate exactly once.
        wheelAccumRef.current = 0;
        wheelGestureFiredRef.current = false;
      }

      if (wheelGestureFiredRef.current) {
        // Same gesture, already fired — drop tail events (including
        // any trackpad inertia decay) until the gesture ends.
        return;
      }

      wheelAccumRef.current += event.deltaY;
      if (wheelAccumRef.current > WHEEL_THRESHOLD) {
        wheelGestureFiredRef.current = true;
        wheelAccumRef.current = 0;
        navigate(1);
      } else if (wheelAccumRef.current < -WHEEL_THRESHOLD) {
        wheelGestureFiredRef.current = true;
        wheelAccumRef.current = 0;
        navigate(-1);
      }
    }
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [navigate]);

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
