"use client";

import { useRouter } from "next/navigation";
import { motion, useAnimationControls } from "motion/react";
import { useEffect, type ReactNode } from "react";

// Motion-driven swipe wrapper. Wraps the presenter's scene content in a
// drag-x container; past a threshold in either direction it navigates to
// the previous or next scene via soft navigation (which triggers the
// wrapping <ViewTransition> directional slide for free).
//
// overscroll-behavior-x: contain guards against iPadOS edge-swipe-back
// hijacking the horizontal drag.

const SWIPE_THRESHOLD = 72; // px — feel-tuned, refine in Phase 6
const SWIPE_VELOCITY = 500; // px/sec — quick flick bypasses threshold

export function SceneSwiper({
  previousHref,
  nextHref,
  children,
}: {
  previousHref: string | null;
  nextHref: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const controls = useAnimationControls();

  useEffect(() => {
    controls.set({ x: 0 });
  }, [controls, previousHref, nextHref]);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      animate={controls}
      onDragEnd={(_event, info) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if ((offset < -SWIPE_THRESHOLD || velocity < -SWIPE_VELOCITY) && nextHref) {
          router.push(nextHref);
          return;
        }
        if ((offset > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY) && previousHref) {
          router.push(previousHref);
          return;
        }
        // No navigation — spring back to zero.
        controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 40 } });
      }}
      style={{ overscrollBehaviorX: "contain", touchAction: "pan-y" }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}
