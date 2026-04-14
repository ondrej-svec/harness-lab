"use client";

// Transparent wrapper that adds j/k and ↑/↓ keyboard navigation to a
// scene rail. Listens only when focus is inside the wrapper's subtree,
// so it never competes with inputs elsewhere on the page. Uses
// router.push to the next/prev scene's pre-built href; the actual rail
// tiles stay server-rendered AdminRouteLinks, so right-click open in
// new tab and hard-load both keep working.

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

type RailItem = {
  id: string;
  href: string;
};

export function SceneRailKeyboardNav({
  items,
  activeSceneId,
  children,
}: {
  items: readonly RailItem[];
  activeSceneId: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (!container) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as Node | null;
      if (!target || !container.contains(target)) return;

      const targetElement = target as HTMLElement;
      if (targetElement.closest("input, textarea, select, [contenteditable='true']")) return;

      const key = event.key;
      const isNext = key === "j" || key === "ArrowDown" || key === "ArrowRight";
      const isPrev = key === "k" || key === "ArrowUp" || key === "ArrowLeft";
      if (!isNext && !isPrev) return;
      if (items.length === 0) return;

      const currentIndex = items.findIndex((item) => item.id === activeSceneId);
      const fallbackIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = isNext
        ? Math.min(items.length - 1, fallbackIndex + 1)
        : Math.max(0, fallbackIndex - 1);
      if (nextIndex === currentIndex) return;

      event.preventDefault();
      router.push(items[nextIndex].href);
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [items, activeSceneId, router]);

  return (
    <div ref={containerRef} data-scene-rail-keyboard className="min-w-0">
      {children}
    </div>
  );
}
