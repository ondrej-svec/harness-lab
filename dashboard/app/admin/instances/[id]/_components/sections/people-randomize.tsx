"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UiLanguage } from "@/lib/ui-language";
import { InlineSpinner } from "@/app/components/inline-spinner";

type Strategy = "cross-level" | "random";

type PreviewAssignment = { participantId: string; teamId: string };
type PreviewResponse = {
  ok: true;
  preview: true;
  teamIds: string[];
  assignments: PreviewAssignment[];
  tagDistribution: Record<string, Record<string, number>>;
  commitToken: string;
};

/**
 * PeopleRandomize — compact control for the cross-level-mix randomizer.
 * Two-step safety flow: Preview returns a signed commitToken and the
 * proposed distribution; Commit sends the token back. See
 * docs/previews/2026-04-16-cli-surface.md for the matching CLI.
 */
export function PeopleRandomize({
  lang,
  instanceId,
  existingTeamCount,
  participantCount,
}: {
  lang: UiLanguage;
  instanceId: string;
  existingTeamCount: number;
  participantCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [teams, setTeams] = useState(Math.max(2, Math.min(existingTeamCount || 3, 12)));
  const [strategy, setStrategy] = useState<Strategy>("cross-level");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const labels = {
    title: lang === "cs" ? "Sestavit týmy" : "Form teams",
    description:
      lang === "cs"
        ? "Rozlosuje aktuální pool do N týmů se smíšenými pozicemi. Nejdřív náhled, pak commit."
        : "Distribute the current pool into N mixed-tag teams. Preview first, then commit.",
    teamsLabel: lang === "cs" ? "Týmy" : "Teams",
    strategyLabel: lang === "cs" ? "Strategie" : "Strategy",
    crossLevel: lang === "cs" ? "smíšené úrovně" : "cross-level",
    random: lang === "cs" ? "náhodně" : "random",
    previewBtn: lang === "cs" ? "Náhled" : "Preview",
    commitBtn: lang === "cs" ? "Commit" : "Commit",
    rerollBtn: lang === "cs" ? "Znovu" : "Re-roll",
    cancelBtn: lang === "cs" ? "Zrušit" : "Cancel",
    previewTitle: lang === "cs" ? "Návrh rozřazení" : "Proposed distribution",
    empty: lang === "cs" ? "Žádní účastníci v poolu." : "No participants in pool.",
  };

  const callRandomize = useCallback(
    async (body: Record<string, unknown>) => {
      setError(null);
      setLoading(true);
      try {
        const response = await fetch("/api/admin/team-formation/randomize", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ instanceId, ...body }),
        });
        const payload = await response.json();
        if (!response.ok || payload?.ok !== true) {
          setError(payload?.error ?? `request_failed_${response.status}`);
          return null;
        }
        return payload;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [instanceId],
  );

  const runPreview = useCallback(async () => {
    if (participantCount === 0) {
      setError("no_participants");
      return;
    }
    const data = await callRandomize({ teamCount: teams, strategy, preview: true });
    if (data?.preview) setPreview(data as PreviewResponse);
  }, [callRandomize, teams, strategy, participantCount]);

  const commit = useCallback(async () => {
    if (!preview) return;
    const data = await callRandomize({ commitToken: preview.commitToken });
    if (data?.committed) {
      setPreview(null);
      startTransition(() => router.refresh());
    }
  }, [callRandomize, preview, router]);

  return (
    <section className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {labels.title}
          </p>
          <p className="mt-1 max-w-[38ch] text-[13px] text-[var(--text-secondary)]">
            {labels.description}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {labels.teamsLabel}
            <input
              type="number"
              min={2}
              max={12}
              value={teams}
              onChange={(e) => setTeams(Math.max(2, Math.min(12, Number(e.target.value) || 2)))}
              className="w-20 rounded-[12px] border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2 text-center font-mono text-sm text-[var(--text-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {labels.strategyLabel}
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as Strategy)}
              className="rounded-[12px] border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              <option value="cross-level">{labels.crossLevel}</option>
              <option value="random">{labels.random}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={runPreview}
            disabled={loading || pending || participantCount === 0}
            aria-busy={loading || pending}
            className={`inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] transition hover:border-[var(--text-primary)] disabled:opacity-50 ${loading || pending ? "cursor-wait" : ""}`}
          >
            <InlineSpinner active={loading || pending} className="h-3.5 w-3.5 border-[1.5px]" />
            {labels.previewBtn}
          </button>
        </div>
      </div>

      {error ? (
        <p
          className="mt-3 rounded-[12px] border border-[var(--danger-border)] bg-[var(--danger-surface)] px-3 py-2 text-sm text-[var(--danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {preview ? (
        <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface-panel)] p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {labels.previewTitle}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {preview.teamIds.map((teamId) => {
              const counts = preview.tagDistribution[teamId] ?? {};
              const total = Object.values(counts).reduce((a, b) => a + b, 0);
              return (
                <div
                  key={teamId}
                  className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-soft)] p-3"
                >
                  <p className="font-mono text-[12px] text-[var(--text-secondary)]">
                    {teamId} <span className="text-[var(--text-muted)]">· {total}</span>
                  </p>
                  <ul className="mt-2 space-y-0.5 text-[12px] text-[var(--text-secondary)]">
                    {Object.entries(counts).map(([tag, count]) => (
                      <li key={tag} className="flex justify-between">
                        <span>{tag}</span>
                        <span className="font-mono tabular-nums text-[var(--text-primary)]">
                          {count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded-full px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--highlight-surface)] hover:text-[var(--text-primary)]"
            >
              {labels.cancelBtn}
            </button>
            <button
              type="button"
              onClick={runPreview}
              disabled={loading}
              aria-busy={loading}
              className={`inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] transition hover:border-[var(--text-primary)] disabled:opacity-50 ${loading ? "cursor-wait" : ""}`}
            >
              <InlineSpinner active={loading} className="h-3.5 w-3.5 border-[1.5px]" />
              {labels.rerollBtn}
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={loading || pending}
              aria-busy={loading || pending}
              className={`inline-flex items-center gap-2 rounded-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-5 py-2 text-[13px] font-semibold lowercase tracking-[0.01em] text-[color:var(--accent-text)] transition hover:opacity-95 disabled:opacity-50 ${loading || pending ? "cursor-wait" : ""}`}
            >
              <InlineSpinner active={loading || pending} className="h-3.5 w-3.5 border-[1.5px]" />
              {labels.commitBtn}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
