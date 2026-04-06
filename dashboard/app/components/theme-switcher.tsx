"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const options = [
  { value: "system", label: "auto" },
  { value: "light", label: "☀" },
  { value: "dark", label: "☾" },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Avoid hydration mismatch — render placeholder with same dimensions
    return <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]" aria-hidden>auto</div>;
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`transition hover:text-[var(--text-primary)] ${
            theme === opt.value ? "text-[var(--text-primary)]" : ""
          }`}
          aria-label={`Theme: ${opt.value}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
