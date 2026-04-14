"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Right-edge vertical scene rail. One dot per scene in the current agenda
// item's presenter surface. Auto-hides after 2s of idleness on touch
// devices (`(pointer: coarse)`); stays visible on mouse/pointer:fine.
// Keyboard-focusable for desktop parity.
//
// When wired into PresenterShell the rail receives an `onNavigate`
// callback so dot clicks update local carousel state directly instead
// of triggering a full router round trip. The href stays correct for
// right-click "open in new tab" and for hard-load fallback.

export type SceneRailItem = {
  id: string;
  label: string;
  href: string;
};

const AUTO_HIDE_MS = 2000;

function isCoarsePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function SceneRail({
  items,
  activeSceneId,
  onNavigate,
}: {
  items: readonly SceneRailItem[];
  activeSceneId: string | null;
  onNavigate?: (sceneId: string) => void;
}) {
  const [visible, setVisible] = useState(true);
  const coarseRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    coarseRef.current = isCoarsePointer();
    if (!coarseRef.current) {
      // On pointer:fine (mouse/desktop), rail stays visible —
      // `useState(true)` above is already the desired value.
      return;
    }

    function scheduleHide() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    }

    function showAndHide() {
      setVisible(true);
      scheduleHide();
    }

    scheduleHide();
    window.addEventListener("touchstart", showAndHide, { passive: true });
    window.addEventListener("pointermove", showAndHide);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("touchstart", showAndHide);
      window.removeEventListener("pointermove", showAndHide);
    };
  }, []);

  return (
    <nav
      aria-label="scene navigation"
      style={{ viewTransitionName: "scene-rail" }}
      className="pointer-events-none fixed right-4 top-1/2 z-40 -translate-y-1/2"
    >
      <AnimatePresence>
        {visible ? (
          <motion.ul
            key="rail"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="pointer-events-auto flex flex-col gap-3 rounded-full border border-[var(--border)] bg-[var(--card-top)] px-3 py-4 shadow-[0_18px_40px_rgba(28,25,23,0.10)]"
          >
            {items.map((item) => {
              const isActive = item.id === activeSceneId;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={isActive ? "true" : undefined}
                    onClick={(event) => {
                      // Let modifier-clicks open in a new tab; otherwise
                      // delegate to the local carousel state so the swap
                      // is instant.
                      if (
                        onNavigate &&
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey &&
                        event.button === 0
                      ) {
                        event.preventDefault();
                        onNavigate(item.id);
                      }
                    }}
                    className={`block h-3 w-3 rounded-full border transition ${
                      isActive
                        ? "border-[var(--text-primary)] bg-[var(--text-primary)]"
                        : "border-[var(--border-strong)] bg-transparent hover:border-[var(--text-secondary)] focus-visible:border-[var(--text-primary)]"
                    }`}
                  />
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}
