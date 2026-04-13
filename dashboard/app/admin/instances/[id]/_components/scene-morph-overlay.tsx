"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

// Fullscreen overlay shell that wraps the intercepted presenter content.
// Listens for Escape (dismiss), ← and → (scene navigation), provides a
// backdrop click to dismiss, and navigates back to the admin root. The
// View Transitions morph is orchestrated by the <ViewTransitionCard>
// wrapper around the hero element — this shell is chrome + keyboard.
//
// Keyboard parity is a plan Phase 6 acceptance criterion: desktop users
// must be able to drive a workshop without touching the mouse.
export function SceneMorphOverlay({
  closeHref,
  previousHref,
  nextHref,
  children,
}: {
  closeHref: string;
  previousHref?: string | null;
  nextHref?: string | null;
  children: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      // Ignore shortcuts while the user is typing in an input / textarea
      // so Escape etc. don't collide with inline editing.
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        router.push(closeHref);
        return;
      }
      if (event.key === "ArrowRight" && nextHref) {
        event.preventDefault();
        router.push(nextHref);
        return;
      }
      if (event.key === "ArrowLeft" && previousHref) {
        event.preventDefault();
        router.push(previousHref);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router, closeHref, previousHref, nextHref]);

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="zavřít projekci"
        onClick={() => router.push(closeHref)}
        className="absolute inset-0 h-full w-full cursor-default bg-[rgba(28,25,23,0.45)] backdrop-blur-[6px]"
      />
      <div className="relative z-10 flex w-full flex-col">{children}</div>
    </div>
  );
}
