"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ParticipantPollDefinition } from "@/lib/workshop-data";
import { InlineSpinner } from "./inline-spinner";

type Status = { tone: "idle" | "success" | "error"; message: string };

export function ParticipantPollForm({
  poll,
  labels,
}: {
  poll: ParticipantPollDefinition;
  labels: {
    title: string;
    body: string;
    submitLabel: string;
    missingOption: string;
    successMessage: string;
    genericError: string;
  };
}) {
  const router = useRouter();
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" });
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOptionId) {
      setStatus({ tone: "error", message: labels.missingOption });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/participant/poll", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            pollId: poll.id,
            optionId: selectedOptionId,
          }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setStatus({ tone: "error", message: payload?.error ?? labels.genericError });
          return;
        }

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
      <h3 className="mt-3 text-lg font-medium text-[var(--text-primary)]">{poll.prompt}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{labels.body}</p>

      <fieldset className="mt-4 grid gap-2">
        {poll.options.map((option) => (
          <label
            key={option.id}
            className="flex items-start gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--text-primary)]"
          >
            <input
              type="radio"
              name={`poll-${poll.id}`}
              value={option.id}
              checked={selectedOptionId === option.id}
              onChange={(event) => setSelectedOptionId(event.target.value)}
              disabled={isPending}
              className="mt-1"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>

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
