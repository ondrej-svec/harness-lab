"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

// Fullscreen overlay shell that wraps the intercepted presenter content.
// Listens for Escape, provides a backdrop click to dismiss, and navigates
// back to the admin root. The View Transitions morph is orchestrated by
// the <ViewTransitionCard> wrapper around the hero element — this shell
// is just chrome.
export function SceneMorphOverlay({
  closeHref,
  children,
}: {
  closeHref: string;
  children: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
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
