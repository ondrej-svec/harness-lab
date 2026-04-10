"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function AgentPopover({
  label,
  title,
  body,
  prompt,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  title: string;
  body: string;
  prompt: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!mounted) {
    return (
      <span className="rounded-full px-3 py-1.5 text-sm lowercase text-[var(--text-secondary)]">
        {label}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full px-3 py-1.5 text-sm lowercase transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
        aria-expanded={open}
      >
        <span className="mr-1.5 inline-block text-xs" aria-hidden>{"</>"}</span>
        {label}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] rounded-[20px] border border-[var(--border)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-medium lowercase text-[var(--text-primary)]">{title}</p>
          <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{body}</p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3 text-xs leading-5 text-[var(--text-secondary)]">
            {prompt}
          </pre>
          <button
            onClick={handleCopy}
            className="mt-3 w-full rounded-full border border-[var(--border)] px-4 py-2 text-xs font-medium lowercase transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            {copied ? copiedLabel : copyLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
