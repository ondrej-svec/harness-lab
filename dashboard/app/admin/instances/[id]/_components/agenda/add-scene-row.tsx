"use client";

// Inline-append affordance for a new presenter scene. Ghost "+ add scene"
// button → inline form with label + sceneType → submit calls
// addPresenterSceneAction with briefing defaults. Enter submits, Escape
// cancels.

import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { addPresenterSceneAction } from "../../_actions/scenes";

const SCENE_TYPE_OPTIONS = [
  "briefing",
  "demo",
  "participant-view",
  "checkpoint",
  "reflection",
  "transition",
  "custom",
] as const;

export function AddSceneRow({
  lang,
  instanceId,
  agendaItemId,
  addLabel,
}: {
  lang: string;
  instanceId: string;
  agendaItemId: string;
  addLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const labelRef = useRef<HTMLInputElement>(null);
  const sceneTypeRef = useRef<HTMLSelectElement>(null);

  function collapse() {
    setOpen(false);
  }

  function submit() {
    const label = labelRef.current?.value.trim() ?? "";
    const sceneType = sceneTypeRef.current?.value ?? "briefing";
    if (!label) {
      collapse();
      return;
    }
    const formData = new FormData();
    formData.set("lang", lang);
    formData.set("section", "agenda");
    formData.set("instanceId", instanceId);
    formData.set("agendaItemId", agendaItemId);
    formData.set("label", label);
    formData.set("sceneType", sceneType);
    formData.set("title", "");
    formData.set("body", "");
    startTransition(async () => {
      try {
        await addPresenterSceneAction(formData);
      } finally {
        collapse();
      }
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      collapse();
    } else if (event.key === "Enter" && event.currentTarget.tagName !== "SELECT") {
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
          queueMicrotask(() => labelRef.current?.focus());
        }}
        className="w-full rounded-[20px] border border-dashed border-[var(--border)] bg-transparent px-4 py-3 text-sm leading-6 text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
      >
        + {addLabel}
      </button>
    );
  }

  return (
    <div className="rounded-[20px] border border-[var(--border-strong)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={labelRef}
          type="text"
          placeholder={addLabel}
          aria-label={addLabel}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            queueMicrotask(() => {
              const active = document.activeElement;
              if (active !== labelRef.current && active !== sceneTypeRef.current) {
                submit();
              }
            });
          }}
          className="flex-1 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-[var(--text-primary)] focus-visible:border-[var(--text-primary)] focus-visible:outline-none"
        />
        <select
          ref={sceneTypeRef}
          defaultValue="briefing"
          aria-label="scene type"
          onKeyDown={handleKeyDown}
          className="rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-[var(--text-primary)] focus-visible:border-[var(--text-primary)] focus-visible:outline-none"
        >
          {SCENE_TYPE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        {isPending ? (
          <span aria-hidden className="text-xs text-[var(--text-muted)]">…</span>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">Enter saves · Esc cancels</p>
    </div>
  );
}
