"use client";

import { useEffect } from "react";

/**
 * Single IntersectionObserver that reveals every .landing-fade-up element
 * by toggling .landing-fade-up-visible. Running on mount means content is
 * briefly hidden on slow hydration, but the CSS transition keeps it smooth
 * and reduced-motion users get the override in globals.css.
 */
export function ScrollRevealer() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(".landing-fade-up");
    if (targets.length === 0) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      targets.forEach((el) => el.classList.add("landing-fade-up-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("landing-fade-up-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -40px 0px" },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
