"use client";

import { useMemo, useState } from "react";
import {
  filterParticipantCheckpointFeed,
  type ParticipantCheckpointFeedItem,
  type ParticipantCheckpointFeedScope,
} from "@/lib/public-page-view-model";

export function ParticipantCheckpointFeed({
  items,
  defaultScope,
  showMineFilter,
  labels,
}: {
  items: ParticipantCheckpointFeedItem[];
  defaultScope: ParticipantCheckpointFeedScope;
  showMineFilter: boolean;
  labels: {
    title: string;
    body: string;
    room: string;
    phase: string;
    team: string;
    mine: string;
    empty: string;
    emptyMine: string;
    changed: string;
    verified: string;
    nextStep: string;
    legacy: string;
  };
}) {
  const [scope, setScope] = useState<ParticipantCheckpointFeedScope>(defaultScope);
  const filteredItems = useMemo(() => filterParticipantCheckpointFeed(items, scope), [items, scope]);

  return (
    <div className="dashboard-motion-card rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5" id="checkpoint-feed">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{labels.title}</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{labels.body}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ScopeButton active={scope === "room"} label={labels.room} onClick={() => setScope("room")} />
          <ScopeButton active={scope === "phase"} label={labels.phase} onClick={() => setScope("phase")} />
          <ScopeButton active={scope === "team"} label={labels.team} onClick={() => setScope("team")} />
          {showMineFilter ? (
            <ScopeButton active={scope === "mine"} label={labels.mine} onClick={() => setScope("mine")} />
          ) : null}
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="mt-4 space-y-3">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                <span>{item.teamName}</span>
                <span>•</span>
                <span>{item.phaseTitle}</span>
                {item.writtenBy ? (
                  <>
                    <span>•</span>
                    <span>{item.writtenBy}</span>
                  </>
                ) : null}
                <span>•</span>
                <span>{item.writtenAtLabel}</span>
              </div>

              {item.changed || item.verified || item.nextStep ? (
                <dl className="mt-4 grid gap-3">
                  {item.changed ? <EvidenceRow label={labels.changed} value={item.changed} /> : null}
                  {item.verified ? <EvidenceRow label={labels.verified} value={item.verified} /> : null}
                  {item.nextStep ? <EvidenceRow label={labels.nextStep} value={item.nextStep} /> : null}
                </dl>
              ) : (
                <div className="mt-4 rounded-[16px] border border-dashed border-[var(--border)] px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{labels.legacy}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] whitespace-pre-line">{item.content}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
          {scope === "mine" ? labels.emptyMine : labels.empty}
        </p>
      )}
    </div>
  );
}

function ScopeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium lowercase transition ${
        active
          ? "border-[var(--border-strong)] bg-[var(--surface-panel)] text-[var(--text-primary)]"
          : "border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{value}</p>
    </div>
  );
}
