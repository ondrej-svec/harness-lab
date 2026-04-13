"use client";

// Inline-append affordance for new agenda items. Starts as a small ghost
// "+ add agenda item" button; on click it expands into a two-field form
// (title + time). Submitting calls the existing addAgendaItemAction which
// redirects back to the detail page for the newly-created item. Escape or
// blur-without-title collapses the row back to the ghost button.

import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { addAgendaItemAction } from "../../_actions/agenda";

export function AddAgendaItemRow({
  lang,
  instanceId,
  afterItemId,
  addLabel,
}: {
  lang: string;
  instanceId: string;
  afterItemId: string | null;
  addLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

  function collapse() {
    setOpen(false);
  }

  function submit() {
    const title = titleRef.current?.value.trim() ?? "";
    const time = timeRef.current?.value.trim() ?? "";
    if (!title || !time) {
      collapse();
      return;
    }
    const formData = new FormData();
    formData.set("lang", lang);
    formData.set("section", "agenda");
    formData.set("instanceId", instanceId);
    formData.set("title", title);
    formData.set("time", time);
    formData.set("goal", "");
    formData.set("roomSummary", "");
    if (afterItemId) formData.set("afterItemId", afterItemId);
    startTransition(async () => {
      try {
        await addAgendaItemAction(formData);
      } finally {
        // addAgendaItemAction redirects on success; if it throws (or the
        // redirect is intercepted in dev), just collapse the row.
        collapse();
      }
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      collapse();
    } else if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          // Focus is applied after the form renders; queueMicrotask keeps
          // the focus call after React's state flush.
          queueMicrotask(() => titleRef.current?.focus());
        }}
        className="w-full rounded-[22px] border border-dashed border-[var(--border)] bg-transparent px-4 py-4 text-sm leading-6 text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
      >
        + {addLabel}
      </button>
    );
  }

  return (
    <div className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={timeRef}
          type="text"
          placeholder="16:10"
          aria-label="time"
          onKeyDown={handleKeyDown}
          className="w-24 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-[var(--text-primary)] focus-visible:border-[var(--text-primary)] focus-visible:outline-none"
        />
        <input
          ref={titleRef}
          type="text"
          placeholder={addLabel}
          aria-label={addLabel}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Only submit if the user actually typed a title; otherwise
            // a focus shift (e.g. to the time field) should keep the row
            // open. We wait a microtask so focus has settled.
            queueMicrotask(() => {
              const active = document.activeElement;
              if (active !== timeRef.current && active !== titleRef.current) {
                submit();
              }
            });
          }}
          className="flex-1 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-[var(--text-primary)] focus-visible:border-[var(--text-primary)] focus-visible:outline-none"
        />
        {isPending ? (
          <span aria-hidden className="text-xs text-[var(--text-muted)]">…</span>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">Enter saves · Esc cancels</p>
    </div>
  );
}
