"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
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
// URL sync is a side effect: after the local index changes, an effect
// calls `router.replace` so the address bar matches the visible scene.
// We do not call `router.push` because (a) we don't want a history
// entry per scene, and (b) `replace` doesn't trigger Next 16's
// transition pending state, so there's no flicker.
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
const WHEEL_COOLDOWN_MS = 450; // ignore wheel events after a navigation

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
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  // Resolve the initial index from the supplied scene id. Falls back
  // to the first slide if the id is missing (defensive — server should
  // always pass a valid id when slides.length > 0).
  const initialIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.id === initialSceneId),
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Refs so handlers see the freshest values without re-creating the
  // listeners on every render. Stale closures over `activeIndex` were
  // the root cause of the "first arrow press does nothing" bug — the
  // listener captured an old `activeIndex` and the React render that
  // followed re-mounted the listener but the press had already fired
  // against the old closure.
  const activeIndexRef = useRef(activeIndex);
  const slidesRef = useRef(slides);
  const cooldownUntilRef = useRef(0);
  const wheelAccumRef = useRef(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  // After the local index changes, sync the URL via a transition-free
  // replace. window.history.replaceState would also work and avoid the
  // Next router entirely, but using router.replace keeps Next aware
  // of the current scene id for any future server-driven feature
  // (deep links, copied URLs, refresh).
  useEffect(() => {
    const slide = slides[activeIndex];
    if (!slide) return;
    const railItem = railItems[activeIndex];
    if (!railItem) return;
    // Skip the sync on the very first render — the URL already matches.
    if (slide.id === initialSceneId) return;
    router.replace(railItem.href, { scroll: false });
    // We deliberately exclude `router` and the rest from deps; this
    // effect should fire only when the active index changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const navigate = useCallback((delta: number) => {
    const slidesNow = slidesRef.current;
    const currentIndex = activeIndexRef.current;
    const nextIndex = currentIndex + delta;
    if (nextIndex < 0 || nextIndex >= slidesNow.length) {
      // Off the edge — flash a subtle bounce by re-asserting state.
      // setActiveIndex with the same value is a no-op so this just
      // documents the boundary. A future polish could add a haptic /
      // visual nudge here.
      return;
    }
    if (Date.now() < cooldownUntilRef.current) {
      return;
    }
    cooldownUntilRef.current = Date.now() + WHEEL_COOLDOWN_MS;
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
            cooldownUntilRef.current = Date.now() + WHEEL_COOLDOWN_MS;
            setActiveIndex(targetIndex);
          }
        }}
      />
    </div>
  );
}
