"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { SceneRail, type SceneRailItem } from "./scene-rail";

// Module-level mutable cell. The direction of the *next* scene
// transition. Swipe/keyboard handlers set this before calling
// router.push, so the AnimatePresence variant sees the intended
// direction on the very first render of the new scene. Ref-in-a-ref
// would also work, but a module-level variable is simpler and
// lifetime matches the client bundle.
let pendingDirection = 1;

// Vertical swipe + animated scene shell. Wraps the presenter body in a
// Motion drag-y container: swipe up advances to the next scene, swipe
// down goes back. Tap/click the right-edge rail dots to jump directly.
// The scene content itself is keyed by the current scene id so Motion's
// AnimatePresence can cross-slide on change.
//
// Two chromes use this shell: the full-page `/presenter` route (hard
// load) and the intercepting overlay rendered on soft nav. Both pass the
// same rail items + prev/next hrefs so the behavior is uniform.

const SWIPE_THRESHOLD = 80; // px — feel-tuned for iPadOS
const SWIPE_VELOCITY = 500; // px/sec — quick flick bypasses threshold

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Snapshot the pending direction once per render. Swipe/keyboard
  // handlers mutated the module-level `pendingDirection` just before
  // router.push(); we read it here and pass it through AnimatePresence.
  const direction = pendingDirection;
  const lastSceneRef = useRef(activeSceneId);

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
      if ((event.key === "ArrowDown" || event.key === "PageDown" || event.key === "ArrowRight") && nextHref) {
        event.preventDefault();
        pendingDirection = 1;
        router.push(nextHref);
        return;
      }
      if ((event.key === "ArrowUp" || event.key === "PageUp" || event.key === "ArrowLeft") && previousHref) {
        event.preventDefault();
        pendingDirection = -1;
        router.push(previousHref);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router, nextHref, previousHref]);

  // After a navigation lands, update the last-scene marker so the next
  // swipe/keyboard/rail action has a stable reference point.
  useEffect(() => {
    lastSceneRef.current = activeSceneId;
  }, [activeSceneId]);

  const sceneKey = `${pathname}?${searchParams?.toString() ?? ""}`;

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
          if ((offsetY < -SWIPE_THRESHOLD || velocityY < -SWIPE_VELOCITY) && nextHref) {
            pendingDirection = 1;
            router.push(nextHref);
            return;
          }
          // Swipe DOWN (positive offset) → go back.
          if ((offsetY > SWIPE_THRESHOLD || velocityY > SWIPE_VELOCITY) && previousHref) {
            pendingDirection = -1;
            router.push(previousHref);
            return;
          }
        }}
        style={{ touchAction: "pan-x", overscrollBehaviorY: "contain" }}
        className="h-full w-full"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={sceneKey}
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
