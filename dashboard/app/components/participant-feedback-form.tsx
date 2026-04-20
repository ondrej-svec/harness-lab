"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ParticipantFeedbackKind } from "@/lib/runtime-contracts";
import { InlineSpinner } from "./inline-spinner";

type Status = { tone: "idle" | "success" | "error"; message: string };

export function ParticipantFeedbackForm({
  labels,
}: {
  labels: {
    title: string;
    body: string;
    kindLabel: string;
    blockerLabel: string;
    questionLabel: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitLabel: string;
    missingMessage: string;
    successMessage: string;
    genericError: string;
  };
}) {
  const router = useRouter();
  const [kind, setKind] = useState<ParticipantFeedbackKind>("question");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" });
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) {
      setStatus({ tone: "error", message: labels.missingMessage });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/participant/feedback", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            kind,
            message: message.trim(),
          }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setStatus({ tone: "error", message: payload?.error ?? labels.genericError });
          return;
        }

        setMessage("");
        setStatus({ tone: "success", message: labels.successMessage });
        router.refresh();
      } catch {
        setStatus({ tone: "error", message: labels.genericError });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{labels.title}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{labels.body}</p>

      <label className="mt-4 grid gap-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{labels.kindLabel}</span>
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as ParticipantFeedbackKind)}
          disabled={isPending}
          className="w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] focus:border-[var(--border-strong)] focus:outline-none"
        >
          <option value="question">{labels.questionLabel}</option>
          <option value="blocker">{labels.blockerLabel}</option>
        </select>
      </label>

      <label className="mt-4 grid gap-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{labels.messageLabel}</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder={labels.messagePlaceholder}
          disabled={isPending}
          className="w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] focus:border-[var(--border-strong)] focus:outline-none"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          aria-busy={isPending}
          disabled={isPending}
          className={`inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--text-primary)] hover:bg-[var(--surface)] disabled:opacity-60 ${isPending ? "cursor-wait" : ""}`}
        >
          <InlineSpinner active={isPending} />
          <span>{labels.submitLabel}</span>
        </button>
      </div>

      {status.tone !== "idle" ? (
        <p
          className={`mt-3 text-sm leading-6 ${
            status.tone === "success" ? "text-[var(--text-secondary)]" : "text-[var(--danger-text,#c53030)]"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
