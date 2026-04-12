"use client";

import { useState, useTransition } from "react";

type Status = { tone: "idle" | "success" | "error"; message: string };

export function ParticipantCheckInForm({
  teamId,
  currentPhaseId,
  labels,
}: {
  teamId: string;
  currentPhaseId: string | null;
  labels: {
    contentPlaceholder: string;
    authorPlaceholder: string;
    submitLabel: string;
    successMessage: string;
    missingContent: string;
    missingPhase: string;
    genericError: string;
  };
}) {
  const [content, setContent] = useState("");
  const [writtenBy, setWrittenBy] = useState("");
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" });
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setStatus({ tone: "error", message: labels.missingContent });
      return;
    }
    if (!currentPhaseId) {
      setStatus({ tone: "error", message: labels.missingPhase });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/participant/teams/${encodeURIComponent(teamId)}/check-in`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            phaseId: currentPhaseId,
            content: trimmed,
            writtenBy: writtenBy.trim() || null,
          }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setStatus({ tone: "error", message: payload?.error ?? labels.genericError });
          return;
        }
        setContent("");
        setWrittenBy("");
        setStatus({ tone: "success", message: labels.successMessage });
      } catch {
        setStatus({ tone: "error", message: labels.genericError });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-2">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={3}
        placeholder={labels.contentPlaceholder}
        className="w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] focus:border-[var(--border-strong)] focus:outline-none"
        disabled={isPending}
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={writtenBy}
          onChange={(event) => setWrittenBy(event.target.value)}
          type="text"
          placeholder={labels.authorPlaceholder}
          className="flex-1 min-w-[8rem] rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-strong)] focus:outline-none"
          disabled={isPending}
        />
        <button
          type="submit"
          className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--text-primary)] hover:bg-[var(--surface)] disabled:opacity-60"
          disabled={isPending}
        >
          {labels.submitLabel}
        </button>
      </div>
      {status.tone !== "idle" ? (
        <p
          className={`text-sm leading-6 ${
            status.tone === "success" ? "text-[var(--text-secondary)]" : "text-[var(--danger-text, #c53030)]"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
