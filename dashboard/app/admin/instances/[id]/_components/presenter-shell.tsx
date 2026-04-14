"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SceneRail, type SceneRailItem } from "./scene-rail";

// Vertical swipe + animated scene shell. Wraps the presenter body in a
// Motion drag-y container: swipe up advances to the next scene, swipe
// down goes back. Tap/click the right-edge rail dots to jump directly.
// Trackpad two-finger scroll is mapped to the same gesture via a wheel
// listener with a debounce so a single scroll event doesn't fire
// multiple scene changes.
//
// AnimatePresence keys on the activeSceneId prop (server-rendered, so
// it updates atomically with the route change) rather than on the URL
// search params (which lag by one render in Next 16's App Router).
//
// Two chromes use this shell: the full-page `/presenter` route (hard
// load) and the intercepting overlay rendered on soft nav. Both pass
// the same rail items + prev/next hrefs so the behavior is uniform.

const SWIPE_THRESHOLD = 80; // px — feel-tuned for iPadOS
const SWIPE_VELOCITY = 500; // px/sec — quick flick bypasses threshold
const WHEEL_THRESHOLD = 40; // px — accumulated wheel deltaY before we navigate
const WHEEL_COOLDOWN_MS = 600; // ignore further wheel events after a navigation

export function PresenterShell({
  railItems,
  activeSceneId,
  previousHref,
  nextHref,
  children,
}: {
  railItems: readonly SceneRailItem[];
  activeSceneId: string | null;
  previousHref: string | null;
  nextHref: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  // Direction of the next scene transition. +1 means "advancing" (new
  // content slides in from below); -1 means "going back". State (not a
  // ref) so AnimatePresence picks it up on the very render that the
  // route change lands on.
  const [direction, setDirection] = useState(1);

  // Refs let the keyboard / swipe / wheel handlers see the freshest
  // hrefs + router without re-creating listeners on every prop change.
  // (Re-creating listeners is what was making the first arrow press
  // appear to "do nothing" — by the time the rebound listener fired,
  // the previous one had already been torn down.)
  const nextHrefRef = useRef(nextHref);
  const previousHrefRef = useRef(previousHref);
  const cooldownUntilRef = useRef(0);
  const wheelAccumRef = useRef(0);

  useEffect(() => {
    nextHrefRef.current = nextHref;
    previousHrefRef.current = previousHref;
    // Clear the wheel cooldown when the scene changes so the next
    // gesture lands without delay.
    cooldownUntilRef.current = 0;
    wheelAccumRef.current = 0;
  }, [nextHref, previousHref, activeSceneId]);

  function navigateForward() {
    const target = nextHrefRef.current;
    if (!target) return;
    if (Date.now() < cooldownUntilRef.current) return;
    setDirection(1);
    cooldownUntilRef.current = Date.now() + WHEEL_COOLDOWN_MS;
    router.push(target);
  }

  function navigateBackward() {
    const target = previousHrefRef.current;
    if (!target) return;
    if (Date.now() < cooldownUntilRef.current) return;
    setDirection(-1);
    cooldownUntilRef.current = Date.now() + WHEEL_COOLDOWN_MS;
    router.push(target);
  }

  // Keyboard parity: arrow up/down, PgUp/PgDn, left/right are aliases.
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
      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        navigateForward();
        return;
      }
      if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        navigateBackward();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trackpad two-finger scroll → next/previous scene. We accumulate the
  // wheel deltaY and only navigate once the accumulator crosses the
  // threshold; the cooldown then suppresses the rest of the gesture.
  useEffect(() => {
    function handleWheel(event: WheelEvent) {
      // Don't hijack scrolling inside scrollable children (block
      // editor textareas, source-ref details, etc.). If the event
      // target lives inside an element that can scroll vertically,
      // let the browser handle it.
      const target = event.target as HTMLElement | null;
      if (target) {
        let node: HTMLElement | null = target;
        while (node && node !== document.body) {
          const style = window.getComputedStyle(node);
          if ((style.overflowY === "auto" || style.overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
            return;
          }
          node = node.parentElement;
        }
      }

      if (Date.now() < cooldownUntilRef.current) {
        return;
      }
      // Reset the accumulator if the user paused (>500ms since last wheel)
      // by tracking the last event time. The accumulator decays naturally
      // because we zero it on every navigation.
      wheelAccumRef.current += event.deltaY;
      if (wheelAccumRef.current > WHEEL_THRESHOLD) {
        wheelAccumRef.current = 0;
        navigateForward();
      } else if (wheelAccumRef.current < -WHEEL_THRESHOLD) {
        wheelAccumRef.current = 0;
        navigateBackward();
      }
    }
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={(_event, info) => {
          const offsetY = info.offset.y;
          const velocityY = info.velocity.y;
          // Swipe UP (negative offset) → advance to next scene.
          if (offsetY < -SWIPE_THRESHOLD || velocityY < -SWIPE_VELOCITY) {
            navigateForward();
            return;
          }
          // Swipe DOWN (positive offset) → go back.
          if (offsetY > SWIPE_THRESHOLD || velocityY > SWIPE_VELOCITY) {
            navigateBackward();
            return;
          }
        }}
        style={{ touchAction: "pan-x", overscrollBehaviorY: "contain" }}
        className="h-full w-full"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeSceneId ?? "empty"}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ opacity: 0, y: dir >= 0 ? 40 : -40 }),
              center: { opacity: 1, y: 0 },
              exit: (dir: number) => ({ opacity: 0, y: dir >= 0 ? -40 : 40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 260, damping: 32, mass: 0.9 }}
            className="h-full w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <SceneRail items={railItems} activeSceneId={activeSceneId} />
    </div>
  );
}
