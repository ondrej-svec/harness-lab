"use client";

import { useCallback, useMemo, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import type { ParticipantRecord, TeamMemberRecord } from "@/lib/runtime-contracts";
import type { UiLanguage } from "@/lib/ui-language";

type TeamSummary = { id: string; name: string; projectBriefId: string };

type PeopleWorkspaceProps = {
  lang: UiLanguage;
  instanceId: string;
  teams: readonly TeamSummary[];
  participants: readonly ParticipantRecord[];
  members: readonly TeamMemberRecord[];
};

/**
 * PeopleWorkspace — interactive pool + teams surface. Drag-and-drop runs
 * on native HTML5 events: chip `dragstart` writes the participantId onto
 * the dataTransfer; drop zones (pool + each team) call the admin API
 * endpoints on drop. Click-to-assign (the `+ assign` menu on each team)
 * remains as the keyboard-accessible fallback — screen readers get the
 * same effect as a drag via the assign menu.
 */
export function PeopleWorkspace({
  lang,
  instanceId,
  teams,
  participants,
  members,
}: PeopleWorkspaceProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const poolTitle = lang === "cs" ? "Pool" : "Pool";
  const unassignedLabel = lang === "cs" ? "nepřiřazení" : "unassigned";
  const dropHereLabel = lang === "cs" ? "sem pustit = přiřadit" : "drop to assign";
  const removeLabel = lang === "cs" ? "odebrat z týmu" : "remove from team";
  const deleteLabel = lang === "cs" ? "smazat" : "delete";
  const addFromPoolLabel = lang === "cs" ? "+ přidat z poolu" : "+ add from pool";

  const assignmentByParticipant = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) map.set(m.participantId, m.teamId);
    return map;
  }, [members]);

  const unassigned = useMemo(
    () => participants.filter((p) => !assignmentByParticipant.has(p.id) && p.archivedAt === null),
    [participants, assignmentByParticipant],
  );

  const assignmentsByTeam = useMemo(() => {
    const map = new Map<string, ParticipantRecord[]>();
    for (const team of teams) map.set(team.id, []);
    for (const p of participants) {
      const teamId = assignmentByParticipant.get(p.id);
      if (teamId && map.has(teamId)) map.get(teamId)!.push(p);
    }
    return map;
  }, [teams, participants, assignmentByParticipant]);

  const callApi = useCallback(
    async (path: string, method: "PUT" | "DELETE" | "PATCH", body: Record<string, unknown>) => {
      setError(null);
      try {
        const response = await fetch(path, {
          method,
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ instanceId, ...body }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          setError(payload.error ?? `${method} ${path} failed (${response.status})`);
          return false;
        }
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return false;
      }
    },
    [instanceId],
  );

  const assignToTeam = useCallback(
    async (participantId: string, teamId: string) => {
      const ok = await callApi("/api/admin/team-members", "PUT", { participantId, teamId });
      if (ok) startTransition(() => router.refresh());
    },
    [callApi, router],
  );

  const unassign = useCallback(
    async (participantId: string) => {
      const ok = await callApi("/api/admin/team-members", "DELETE", { participantId });
      if (ok) startTransition(() => router.refresh());
    },
    [callApi, router],
  );

  const removeParticipant = useCallback(
    async (participantId: string) => {
      const ok = await callApi(
        `/api/admin/participants/${encodeURIComponent(participantId)}`,
        "DELETE",
        {},
      );
      if (ok) startTransition(() => router.refresh());
    },
    [callApi, router],
  );

  const toggleConsent = useCallback(
    async (participant: ParticipantRecord) => {
      if (!participant.email) return;
      const ok = await callApi(
        `/api/admin/participants/${encodeURIComponent(participant.id)}`,
        "PATCH",
        { emailOptIn: !participant.emailOptIn },
      );
      if (ok) startTransition(() => router.refresh());
    },
    [callApi, router],
  );

  const handleDragStart = useCallback((event: DragEvent<HTMLElement>, participantId: string) => {
    event.dataTransfer.setData("text/participant-id", participantId);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLElement>, zone: string) => {
      if (!event.dataTransfer.types.includes("text/participant-id")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (dragOverTarget !== zone) setDragOverTarget(zone);
    },
    [dragOverTarget],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>, zone: "pool" | string) => {
      event.preventDefault();
      const participantId = event.dataTransfer.getData("text/participant-id");
      setDragOverTarget(null);
      if (!participantId) return;
      if (zone === "pool") {
        void unassign(participantId);
      } else {
        void assignToTeam(participantId, zone);
      }
    },
    [assignToTeam, unassign],
  );

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <div
          className="rounded-[16px] border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {/* Pool */}
      <section
        onDragOver={(e) => handleDragOver(e, "pool")}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, "pool")}
        className={`rounded-[22px] border p-4 transition ${
          dragOverTarget === "pool"
            ? "border-[var(--accent-surface)] bg-[color-mix(in_srgb,var(--accent-surface)_12%,var(--surface-soft))]"
            : "border-[var(--border)] bg-[var(--surface-soft)]"
        }`}
      >
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{poolTitle}</h3>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {unassigned.length} {unassignedLabel}
          </span>
        </div>
        {unassigned.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-[var(--border-strong)] px-4 py-3 text-center text-sm text-[var(--text-muted)]">
            {dropHereLabel}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {unassigned.map((participant) => (
              <li
                key={participant.id}
                draggable
                onDragStart={(e) => handleDragStart(e, participant.id)}
                className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)] [cursor:grab]"
              >
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="text-[var(--text-muted)]" aria-hidden>⋮⋮</span>
                  <span className="truncate font-medium">{participant.displayName}</span>
                  {participant.tag ? (
                    <span className="rounded-full bg-[var(--highlight-surface)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      {participant.tag}
                    </span>
                  ) : null}
                  {participant.email ? (
                    <span
                      className="font-mono text-[11px] text-[var(--text-muted)] truncate"
                      title={participant.email}
                    >
                      {participant.email}
                    </span>
                  ) : null}
                </span>
                <span className="flex items-center gap-2">
                  {participant.email ? (
                    <button
                      type="button"
                      onClick={() => toggleConsent(participant)}
                      disabled={pending}
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold transition ${
                        participant.emailOptIn
                          ? "border-[var(--accent-surface)] bg-[color-mix(in_srgb,var(--accent-surface)_14%,transparent)] text-[var(--accent-surface)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                      }`}
                      title={lang === "cs" ? "Souhlas s follow-upem" : "Follow-up consent"}
                    >
                      {participant.emailOptIn
                        ? lang === "cs"
                          ? "follow-up ok"
                          : "follow-up ok"
                        : lang === "cs"
                        ? "bez follow-upu"
                        : "no follow-up"}
                    </button>
                  ) : null}
                  <TeamPicker
                    teams={teams}
                    onPick={(teamId) => assignToTeam(participant.id, teamId)}
                    disabled={pending}
                    addFromPoolLabel={addFromPoolLabel}
                  />
                  <button
                    type="button"
                    onClick={() => removeParticipant(participant.id)}
                    disabled={pending}
                    aria-label={deleteLabel}
                    className="h-6 w-6 rounded-full text-[var(--text-muted)] transition hover:bg-[var(--danger-surface)] hover:text-[var(--danger)]"
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Teams */}
      <div className="flex flex-col gap-4">
        {teams.map((team) => {
          const teamMembers = assignmentsByTeam.get(team.id) ?? [];
          const isDragTarget = dragOverTarget === team.id;
          return (
            <section
              key={team.id}
              onDragOver={(e) => handleDragOver(e, team.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, team.id)}
              className={`rounded-[22px] border p-4 transition ${
                isDragTarget
                  ? "border-[var(--accent-surface)] bg-[color-mix(in_srgb,var(--accent-surface)_10%,var(--surface-panel))]"
                  : "border-[var(--border)] bg-[var(--surface-panel)]"
              }`}
            >
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{team.name}</h3>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">{team.id} · {team.projectBriefId}</span>
              </div>
              <div
                className={`flex flex-wrap gap-2 rounded-[16px] border border-dashed px-3 py-3 ${
                  isDragTarget
                    ? "border-[var(--accent-surface)] bg-[color-mix(in_srgb,var(--accent-surface)_8%,transparent)]"
                    : "border-transparent bg-[var(--surface-soft)]"
                }`}
              >
                {teamMembers.length === 0 ? (
                  <p className="text-[12px] text-[var(--text-muted)]">{dropHereLabel}</p>
                ) : (
                  teamMembers.map((m) => (
                    <span
                      key={m.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, m.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-1 text-sm text-[var(--text-primary)] [cursor:grab]"
                    >
                      <span className="text-[var(--text-muted)]" aria-hidden>⋮⋮</span>
                      {m.displayName}
                      <button
                        type="button"
                        onClick={() => unassign(m.id)}
                        disabled={pending}
                        aria-label={removeLabel}
                        className="h-5 w-5 rounded-full text-[var(--text-muted)] transition hover:bg-[var(--danger-surface)] hover:text-[var(--danger)]"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <TeamPickerFromPool
                  lang={lang}
                  pool={unassigned}
                  onPick={(participantId) => assignToTeam(participantId, team.id)}
                  disabled={pending}
                />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TeamPicker({
  teams,
  onPick,
  disabled,
  addFromPoolLabel,
}: {
  teams: readonly TeamSummary[];
  onPick: (teamId: string) => void;
  disabled: boolean;
  addFromPoolLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="rounded-full border border-[var(--border)] bg-transparent px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
      >
        {addFromPoolLabel.replace("+ ", "→ ")}
      </button>
      {open ? (
        <span className="absolute right-0 top-full z-10 mt-1 flex flex-col gap-1 rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface-panel)] p-1 shadow-[var(--shadow-soft)]">
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setOpen(false);
                onPick(t.id);
              }}
              className="whitespace-nowrap rounded-[8px] px-2 py-1 text-left text-[12px] text-[var(--text-primary)] transition hover:bg-[var(--highlight-surface)]"
            >
              {t.name}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}

function TeamPickerFromPool({
  lang,
  pool,
  onPick,
  disabled,
}: {
  lang: UiLanguage;
  pool: readonly ParticipantRecord[];
  onPick: (participantId: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (pool.length === 0) return null;
  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="rounded-full border border-[var(--border)] px-3 py-1 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
      >
        {lang === "cs" ? "+ přidat z poolu" : "+ add from pool"}
      </button>
      {open ? (
        <span className="absolute right-0 top-full z-10 mt-1 flex w-56 max-w-[90vw] flex-col gap-1 rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface-panel)] p-1 shadow-[var(--shadow-soft)]">
          {pool.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setOpen(false);
                onPick(p.id);
              }}
              className="flex items-center justify-between gap-2 rounded-[8px] px-2 py-1 text-left text-[12px] text-[var(--text-primary)] transition hover:bg-[var(--highlight-surface)]"
            >
              <span className="truncate">{p.displayName}</span>
              {p.tag ? (
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {p.tag}
                </span>
              ) : null}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}
