"use client";

// Click-to-edit primitive. Click the value → becomes an input/textarea →
// blur saves via the supplied server action → click-out or Enter commits,
// Escape cancels. useOptimistic + startTransition per React 19 docs;
// the reducer pattern is used so concurrent edits don't show stale values.
// Errors automatically roll back the optimistic state (React's built-in
// behavior when the Action throws).
//
// See docs/plans/2026-04-13-one-canvas-research-notes.md §7 for the
// grounding research on useOptimistic patterns.

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type FocusEvent,
} from "react";

export type InlineFieldAction = (formData: FormData) => Promise<void> | Promise<unknown> | void;

export type InlineFieldOption = { value: string; label?: string };

export type InlineFieldProps = {
  value: string;
  fieldName: string;
  action: InlineFieldAction;
  mode?: "text" | "textarea" | "select";
  /** Options for select mode. Required when mode === "select". */
  options?: readonly InlineFieldOption[];
  /** Extra hidden form fields to submit alongside the edited value. */
  hiddenFields?: Record<string, string>;
  /** Accessible label for assistive tech. */
  label: string;
  placeholder?: string;
  className?: string;
  /** Additional class for edit mode (usually larger padding). */
  editClassName?: string;
};

export function InlineField({
  value,
  fieldName,
  action,
  mode = "text",
  options,
  hiddenFields,
  label,
  placeholder,
  className,
  editClassName,
}: InlineFieldProps) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticValue, setOptimisticValue] = useOptimistic(
    value,
    (_currentState: string, next: string) => next,
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!editing) return;
    const el =
      mode === "textarea"
        ? textareaRef.current
        : mode === "select"
          ? selectRef.current
          : inputRef.current;
    if (el) {
      el.focus();
      if ("select" in el && typeof el.select === "function") {
        (el as HTMLInputElement | HTMLTextAreaElement).select();
      }
    }
  }, [editing, mode]);

  function cancel() {
    setEditing(false);
    setError(null);
  }

  function save(next: string) {
    if (next === value) {
      setEditing(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      setOptimisticValue(next);
      try {
        const formData = new FormData();
        formData.set(fieldName, next);
        if (hiddenFields) {
          for (const [k, v] of Object.entries(hiddenFields)) {
            formData.set(k, v);
          }
        }
        await action(formData);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "chyba ukládání");
        // React rolls back the optimistic value automatically.
      }
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    } else if (event.key === "Enter" && mode === "text") {
      event.preventDefault();
      save((event.currentTarget as HTMLInputElement).value);
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    save(event.currentTarget.value);
  }

  if (!editing) {
    const showPlaceholder = !optimisticValue;
    // IMPORTANT: no aria-label and no title on the display button. Both
    // shadow the button's text content in Chromium's accessible-name
    // computation (title wins over text content in practice, even though
    // the ARIA spec says text content should win). We want the button's
    // accessible name to BE its visible value so surrounding headings
    // (e.g. the agenda detail h2) keep their existing accessible names.
    // Interactivity is conveyed via the <button> role + hover/focus
    // styles. Visually-hidden edit affordance could be added later but
    // is deliberately minimal to avoid re-shadowing the heading.
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        data-inline-field="display"
        className={`inline-flex items-center gap-2 rounded-[10px] px-1 text-left transition hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)] focus-visible:outline-none ${className ?? ""}`}
      >
        <span className={showPlaceholder ? "text-[var(--text-muted)]" : undefined}>
          {showPlaceholder ? placeholder ?? label : optimisticValue}
        </span>
        {isPending ? (
          <span aria-hidden className="text-xs text-[var(--text-muted)]">…</span>
        ) : null}
        {error ? (
          <span role="alert" className="text-xs text-[var(--border-strong)]">
            {error}
          </span>
        ) : null}
      </button>
    );
  }

  const inputClassName = `block w-full rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-[var(--text-primary)] focus-visible:border-[var(--text-primary)] focus-visible:outline-none ${className ?? ""} ${editClassName ?? ""}`;

  if (mode === "select") {
    return (
      <select
        ref={selectRef}
        defaultValue={optimisticValue}
        aria-label={label}
        data-inline-field="edit"
        onBlur={handleBlur}
        onChange={(event) => save(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        className={inputClassName}
      >
        {(options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label ?? option.value}
          </option>
        ))}
      </select>
    );
  }

  if (mode === "textarea") {
    return (
      <textarea
        ref={textareaRef}
        defaultValue={optimisticValue}
        aria-label={label}
        data-inline-field="edit"
        rows={3}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClassName}
      />
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={optimisticValue}
      aria-label={label}
      data-inline-field="edit"
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={inputClassName}
    />
  );
}
