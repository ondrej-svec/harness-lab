"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Status = { tone: "idle" | "success" | "error"; message: string };

export function ParticipantCheckInForm({
  initialTeamId,
  teamOptions = [],
  currentPhaseId,
  activeParticipantName,
  disabled = false,
  labels,
}: {
  initialTeamId?: string | null;
  teamOptions?: Array<{ id: string; label: string }>;
  currentPhaseId: string | null;
  activeParticipantName?: string | null;
  disabled?: boolean;
  labels: {
    title: string;
    body: string;
    changedLabel: string;
    changedPlaceholder: string;
    verifiedLabel: string;
    verifiedPlaceholder: string;
    nextStepLabel: string;
    nextStepPlaceholder: string;
    participantPrefix: string;
    teamLabel: string;
    submitLabel: string;
    successMessage: string;
    missingTeam: string;
    missingStructuredFields: string;
    missingPhase: string;
    genericError: string;
  };
}) {
  const router = useRouter();
  const [teamId, setTeamId] = useState(initialTeamId ?? teamOptions[0]?.id ?? "");
  const [changed, setChanged] = useState("");
  const [verified, setVerified] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" });
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const changedValue = changed.trim();
    const verifiedValue = verified.trim();
    const nextStepValue = nextStep.trim();
    if (!changedValue || !verifiedValue || !nextStepValue) {
      setStatus({ tone: "error", message: labels.missingStructuredFields });
      return;
    }
    if (!teamId) {
      setStatus({ tone: "error", message: labels.missingTeam });
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
            changed: changedValue,
            verified: verifiedValue,
            nextStep: nextStepValue,
          }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setStatus({ tone: "error", message: payload?.error ?? labels.genericError });
          return;
        }
        setChanged("");
        setVerified("");
        setNextStep("");
        setStatus({ tone: "success", message: labels.successMessage });
        router.refresh();
      } catch {
        setStatus({ tone: "error", message: labels.genericError });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-2">
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{labels.title}</p>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{labels.body}</p>
        {activeParticipantName ? (
          <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
            {labels.participantPrefix}: {activeParticipantName}
          </p>
        ) : null}
        {teamOptions.length > 1 || !initialTeamId ? (
          <label className="mt-3 grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{labels.teamLabel}</span>
            <select
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              className="w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] focus:border-[var(--border-strong)] focus:outline-none"
              disabled={isPending || disabled}
            >
              {teamOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="mt-4 grid gap-3">
          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{labels.changedLabel}</span>
            <textarea
              value={changed}
              onChange={(event) => setChanged(event.target.value)}
              rows={2}
              placeholder={labels.changedPlaceholder}
              className="w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] focus:border-[var(--border-strong)] focus:outline-none"
              disabled={isPending || disabled}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{labels.verifiedLabel}</span>
            <textarea
              value={verified}
              onChange={(event) => setVerified(event.target.value)}
              rows={2}
              placeholder={labels.verifiedPlaceholder}
              className="w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] focus:border-[var(--border-strong)] focus:outline-none"
              disabled={isPending || disabled}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{labels.nextStepLabel}</span>
            <textarea
              value={nextStep}
              onChange={(event) => setNextStep(event.target.value)}
              rows={2}
              placeholder={labels.nextStepPlaceholder}
              className="w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] focus:border-[var(--border-strong)] focus:outline-none"
              disabled={isPending || disabled}
            />
          </label>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--text-primary)] hover:bg-[var(--surface)] disabled:opacity-60"
          disabled={isPending || disabled}
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
