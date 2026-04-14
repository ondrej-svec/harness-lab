"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
const NAVIGATE_COOLDOWN_MS = 250; // ignore further triggers right after a nav

export type PresenterSlide = {
  id: string;
  content: ReactNode;
};

export function PresenterShell({
  slides,
  railItems,
  initialSceneId,
}: {
  slides: readonly PresenterSlide[];
  railItems: readonly SceneRailItem[];
  initialSceneId: string | null;
}) {
  const reduceMotion = useReducedMotion();

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
  const cooldownUntilRef = useRef(0);
  const wheelAccumRef = useRef(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    slidesRef.current = slides;
    railItemsRef.current = railItems;
  }, [slides, railItems]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const navigate = useCallback((delta: number) => {
    const slidesNow = slidesRef.current;
    const currentIndex = activeIndexRef.current;
    const nextIndex = currentIndex + delta;
    if (nextIndex < 0 || nextIndex >= slidesNow.length) {
      // Off the edge — no-op.
      return;
    }
    if (Date.now() < cooldownUntilRef.current) {
      return;
    }
    cooldownUntilRef.current = Date.now() + NAVIGATE_COOLDOWN_MS;
    setActiveIndex(nextIndex);
  }, []);

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

  // Trackpad two-finger scroll → next/previous scene. We ignore wheel
  // events that target a vertically-scrollable child so inline editing
  // surfaces still scroll naturally.
  useEffect(() => {
    function handleWheel(event: WheelEvent) {
      const target = event.target as HTMLElement | null;
      if (target) {
        let node: HTMLElement | null = target;
        while (node && node !== document.body) {
          const style = window.getComputedStyle(node);
          if (
            (style.overflowY === "auto" || style.overflowY === "scroll") &&
            node.scrollHeight > node.clientHeight
          ) {
            return;
          }
          node = node.parentElement;
        }
      }

      if (Date.now() < cooldownUntilRef.current) {
        return;
      }
      wheelAccumRef.current += event.deltaY;
      if (wheelAccumRef.current > WHEEL_THRESHOLD) {
        wheelAccumRef.current = 0;
        navigate(1);
      } else if (wheelAccumRef.current < -WHEEL_THRESHOLD) {
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
    </div>
  );
}
