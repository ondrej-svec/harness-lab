"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

// Fullscreen overlay shell that wraps the intercepted presenter content.
// Listens for Escape (dismiss), provides a backdrop click to dismiss,
// and navigates back to the admin root. Scene-to-scene navigation is
// owned by <PresenterShell>, which is rendered as a child here — this
// shell is just the dismiss chrome + view-transition morph backdrop.
export function SceneMorphOverlay({
  closeHref,
  children,
}: {
  closeHref: string;
  /** @deprecated kept for call-site parity; PresenterShell handles scene nav now */
  previousHref?: string | null;
  /** @deprecated kept for call-site parity; PresenterShell handles scene nav now */
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
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router, closeHref]);

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
