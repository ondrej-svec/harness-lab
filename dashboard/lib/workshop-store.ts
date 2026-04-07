import { randomUUID } from "node:crypto";
import { getAuditLogRepository } from "./audit-log-repository";
import {
  createWorkshopInstanceRecord,
  createWorkshopStateFromInstance,
  createWorkshopStateFromTemplate,
  type AgendaItem,
  type MonitoringSnapshot,
  type SprintUpdate,
  type Team,
  type WorkshopInstanceRecord,
  type WorkshopState,
} from "./workshop-data";
import { getCheckpointRepository } from "./checkpoint-repository";
import { getEventAccessRepository } from "./event-access-repository";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { getInstanceArchiveRepository } from "./instance-archive-repository";
import { getWorkshopInstanceRepository } from "./workshop-instance-repository";
import { getMonitoringSnapshotRepository } from "./monitoring-snapshot-repository";
import { getParticipantEventAccessRepository } from "./participant-event-access-repository";
import { getRedeemAttemptRepository } from "./redeem-attempt-repository";
import { emitRuntimeAlert } from "./runtime-alert";
import { getTeamRepository } from "./team-repository";
import { getWorkshopStateRepository } from "./workshop-state-repository";

async function getBaseWorkshopState(instanceId = getCurrentWorkshopInstanceId()) {
  return getWorkshopStateRepository().getState(instanceId);
}

const monitoringRetentionDays = 14;
const auditRetentionDays = 30;
const redeemAttemptRetentionDays = 7;
const archiveRetentionDays = 30;

function subtractDays(date: Date, days: number) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function normalizeAgenda(agenda: AgendaItem[], currentItemId?: string) {
  const sortedAgenda = [...agenda]
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map((item, index) => ({ ...item, order: index + 1 }));
  const fallbackCurrentId = currentItemId ?? sortedAgenda.find((item) => item.status === "current")?.id ?? sortedAgenda[0]?.id;
  const currentIndex = Math.max(sortedAgenda.findIndex((item) => item.id === fallbackCurrentId), 0);

  return sortedAgenda.map((item, index) => ({
    ...item,
    status: index < currentIndex ? ("done" as const) : index === currentIndex ? ("current" as const) : ("upcoming" as const),
  }));
}

function resolveCurrentPhaseLabel(agenda: AgendaItem[], currentPhaseLabel: string) {
  return agenda.find((item) => item.status === "current")?.title ?? currentPhaseLabel;
}

export async function getWorkshopState(instanceId = getCurrentWorkshopInstanceId()): Promise<WorkshopState> {
  const [state, teams, monitoring, sprintUpdates] = await Promise.all([
    getBaseWorkshopState(instanceId),
    getTeamRepository().listTeams(instanceId),
    getMonitoringSnapshotRepository().getSnapshots(instanceId),
    getCheckpointRepository().listCheckpoints(instanceId),
  ]);

  return {
    ...state,
    teams: teams.length > 0 ? teams : state.teams,
    monitoring: monitoring.length > 0 ? monitoring : state.monitoring,
    sprintUpdates: sprintUpdates.length > 0 ? sprintUpdates : state.sprintUpdates,
  };
}

export async function updateWorkshopState(
  updater: (state: WorkshopState) => WorkshopState,
  instanceId = getCurrentWorkshopInstanceId(),
): Promise<WorkshopState> {
  const current = await getBaseWorkshopState(instanceId);
  const next = updater(current);
  await getWorkshopStateRepository().saveState(instanceId, {
    ...next,
    monitoring: current.monitoring,
    sprintUpdates: current.sprintUpdates,
  });
  return getWorkshopState(instanceId);
}

export async function setCurrentAgendaItem(itemId: string, instanceId = getCurrentWorkshopInstanceId()) {
  return updateWorkshopState((state) => {
    const agenda = normalizeAgenda(state.agenda, itemId);
    return {
      ...state,
      agenda,
      workshopMeta: { ...state.workshopMeta, currentPhaseLabel: resolveCurrentPhaseLabel(agenda, state.workshopMeta.currentPhaseLabel) },
    };
  }, instanceId);
}

export async function updateAgendaItem(
  itemId: string,
  updates: Pick<AgendaItem, "title" | "time" | "description">,
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) => {
    const agenda = normalizeAgenda(
      state.agenda.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
      state.agenda.find((item) => item.status === "current")?.id,
    );
    return {
      ...state,
      agenda,
      workshopMeta: { ...state.workshopMeta, currentPhaseLabel: resolveCurrentPhaseLabel(agenda, state.workshopMeta.currentPhaseLabel) },
    };
  }, instanceId);
}

export async function addAgendaItem(
  input: Pick<AgendaItem, "title" | "time" | "description"> & { afterItemId?: string | null },
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) => {
    const afterIndex = input.afterItemId ? state.agenda.findIndex((item) => item.id === input.afterItemId) : state.agenda.length - 1;
    const insertAt = afterIndex >= 0 ? afterIndex + 1 : state.agenda.length;
    const agenda = [...state.agenda];
    agenda.splice(insertAt, 0, {
      id: `custom-${randomUUID()}`,
      title: input.title,
      time: input.time,
      description: input.description,
      order: insertAt + 1,
      sourceBlueprintPhaseId: null,
      kind: "custom",
      status: "upcoming",
    });
    const normalizedAgenda = normalizeAgenda(agenda, state.agenda.find((item) => item.status === "current")?.id);
    return {
      ...state,
      agenda: normalizedAgenda,
      workshopMeta: {
        ...state.workshopMeta,
        currentPhaseLabel: resolveCurrentPhaseLabel(normalizedAgenda, state.workshopMeta.currentPhaseLabel),
      },
    };
  }, instanceId);
}

export async function removeAgendaItem(itemId: string, instanceId = getCurrentWorkshopInstanceId()) {
  return updateWorkshopState((state) => {
    const remaining = state.agenda.filter((item) => item.id !== itemId);
    const normalizedAgenda = normalizeAgenda(
      remaining.length > 0 ? remaining : state.agenda.slice(0, 1),
      state.agenda.find((item) => item.id !== itemId && item.status === "current")?.id ?? remaining[0]?.id,
    );
    return {
      ...state,
      agenda: normalizedAgenda,
      workshopMeta: {
        ...state.workshopMeta,
        currentPhaseLabel: resolveCurrentPhaseLabel(normalizedAgenda, state.workshopMeta.currentPhaseLabel),
      },
    };
  }, instanceId);
}

export async function moveAgendaItem(
  itemId: string,
  direction: "up" | "down",
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) => {
    const agenda = [...state.agenda].sort((left, right) => left.order - right.order);
    const currentIndex = agenda.findIndex((item) => item.id === itemId);
    if (currentIndex < 0) {
      return state;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= agenda.length) {
      return state;
    }

    const [moved] = agenda.splice(currentIndex, 1);
    agenda.splice(targetIndex, 0, moved);
    const normalizedAgenda = normalizeAgenda(agenda, state.agenda.find((item) => item.status === "current")?.id);
    return {
      ...state,
      agenda: normalizedAgenda,
      workshopMeta: {
        ...state.workshopMeta,
        currentPhaseLabel: resolveCurrentPhaseLabel(normalizedAgenda, state.workshopMeta.currentPhaseLabel),
      },
    };
  }, instanceId);
}

export async function upsertTeam(input: Team, instanceId = getCurrentWorkshopInstanceId()) {
  const repository = getTeamRepository();
  await repository.upsertTeam(instanceId, input);
  const teams = await repository.listTeams(instanceId);

  // Keep the workshop-state projection aligned during the migration window.
  const state = await getBaseWorkshopState(instanceId);
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    teams,
  });

  return getWorkshopState(instanceId);
}

export async function updateCheckpoint(teamId: string, checkpoint: string, instanceId = getCurrentWorkshopInstanceId()) {
  const repository = getTeamRepository();
  const teams = await repository.listTeams(instanceId);
  const baselineTeams = teams.length > 0 ? teams : (await getBaseWorkshopState(instanceId)).teams;
  const nextTeams = baselineTeams.map((team) => (team.id === teamId ? { ...team, checkpoint } : team));
  await repository.replaceTeams(instanceId, nextTeams);

  // Keep the workshop-state projection aligned during the migration window.
  const state = await getBaseWorkshopState(instanceId);
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    teams: nextTeams,
  });

  return getWorkshopState(instanceId);
}

export async function getWorkshopInstances(options?: { includeRemoved?: boolean }) {
  return getWorkshopInstanceRepository().listInstances(options);
}

export async function createWorkshopInstance(input: {
  id: string;
  templateId: string;
  city?: string;
  dateRange?: string;
}, actorNeonUserId?: string | null) {
  const instanceRepository = getWorkshopInstanceRepository();
  const existingInstance = await instanceRepository.getInstance(input.id);
  if (existingInstance) {
    return existingInstance;
  }

  const now = new Date().toISOString();
  const instance = createWorkshopInstanceRecord({
    id: input.id,
    templateId: input.templateId,
    importedAt: now,
  });
  const nextInstance: WorkshopInstanceRecord = {
    ...instance,
    workshopMeta: {
      ...instance.workshopMeta,
      city: input.city?.trim() || instance.workshopMeta.city,
      dateRange: input.dateRange?.trim() || instance.workshopMeta.dateRange,
    },
  };

  await instanceRepository.createInstance(nextInstance);
  await getWorkshopStateRepository().saveState(nextInstance.id, createWorkshopStateFromInstance(nextInstance));
  await getTeamRepository().replaceTeams(nextInstance.id, []);
  await getCheckpointRepository().replaceCheckpoints(nextInstance.id, []);
  await getMonitoringSnapshotRepository().replaceSnapshots(nextInstance.id, []);
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId: nextInstance.id,
    actorKind: "facilitator",
    action: "instance_created",
    result: "success",
    createdAt: now,
    metadata: {
      templateId: nextInstance.templateId,
      actorNeonUserId: actorNeonUserId ?? null,
    },
  });

  return nextInstance;
}

export async function prepareWorkshopInstance(instanceId: string, actorNeonUserId?: string | null) {
  const repository = getWorkshopInstanceRepository();
  const current = await repository.getInstance(instanceId);
  if (!current) {
    return null;
  }

  const next = { ...current, status: "prepared" as const };
  await repository.updateInstance(instanceId, next);
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "instance_prepared",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: {
      actorNeonUserId: actorNeonUserId ?? null,
    },
  });
  return next;
}

export async function completeChallenge(
  challengeId: string,
  teamId: string,
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) => ({
    ...state,
    challenges: state.challenges.map((challenge) =>
      challenge.id === challengeId && !challenge.completedBy.includes(teamId)
        ? { ...challenge, completedBy: [...challenge.completedBy, teamId] }
        : challenge,
    ),
  }), instanceId);
}

export async function setRotationReveal(revealed: boolean, instanceId = getCurrentWorkshopInstanceId()) {
  return updateWorkshopState((state) => ({
    ...state,
    rotation: { ...state.rotation, revealed },
  }), instanceId);
}

export async function addSprintUpdate(update: SprintUpdate, instanceId = getCurrentWorkshopInstanceId()) {
  const repository = getCheckpointRepository();
  await repository.appendCheckpoint(instanceId, update);
  const checkpoints = await repository.listCheckpoints(instanceId);

  // Keep the workshop-state projection aligned during the migration window.
  const state = await getBaseWorkshopState(instanceId);
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    sprintUpdates: checkpoints,
  });

  return getWorkshopState(instanceId);
}

export async function replaceMonitoring(items: MonitoringSnapshot[], instanceId = getCurrentWorkshopInstanceId()) {
  const repository = getMonitoringSnapshotRepository();
  await repository.replaceSnapshots(instanceId, items);

  // Keep the workshop-state projection aligned during the migration window.
  const state = await getBaseWorkshopState(instanceId);
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    monitoring: items,
  });

  return getWorkshopState(instanceId);
}

export async function getLatestWorkshopArchive(instanceId = getCurrentWorkshopInstanceId()) {
  return getInstanceArchiveRepository().getLatestArchive(instanceId);
}

export async function createWorkshopArchive(options?: {
  reason?: "manual" | "reset";
  notes?: string | null;
}, instanceId = getCurrentWorkshopInstanceId()) {
  const reason = options?.reason ?? "manual";
  const archivedAt = new Date();
  const [workshopState, checkpoints, monitoringSnapshots, participantEventAccess, participantSessions] = await Promise.all([
    getWorkshopState(instanceId),
    getCheckpointRepository().listCheckpoints(instanceId),
    getMonitoringSnapshotRepository().getSnapshots(instanceId),
    getParticipantEventAccessRepository().getActiveAccess(instanceId),
    getEventAccessRepository().listSessions(instanceId),
  ]);

  const archiveRecord = {
    id: `archive-${randomUUID()}`,
    instanceId,
    archiveStatus: "ready" as const,
    storageUri: null,
    createdAt: archivedAt.toISOString(),
    retentionUntil: addDays(archivedAt, archiveRetentionDays),
    notes: options?.notes ?? null,
    payload: {
      archivedAt: archivedAt.toISOString(),
      reason,
      workshopState,
      checkpoints,
      monitoringSnapshots,
      participantEventAccessVersion: participantEventAccess?.version ?? null,
      participantSessions,
    },
  };

  await getInstanceArchiveRepository().createArchive(archiveRecord);
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "instance_archive_created",
    result: "success",
    createdAt: archivedAt.toISOString(),
    metadata: {
      reason,
      archiveId: archiveRecord.id,
      participantSessionCount: participantSessions.length,
      checkpointCount: checkpoints.length,
      monitoringSnapshotCount: monitoringSnapshots.length,
    },
  });
  emitRuntimeAlert({
    category: "instance_archive_created",
    severity: "info",
    instanceId,
    metadata: {
      reason,
      archiveId: archiveRecord.id,
    },
  });

  return archiveRecord;
}

export async function applyRuntimeRetentionPolicy(instanceId = getCurrentWorkshopInstanceId()) {
  const now = new Date();
  await Promise.all([
    getEventAccessRepository().deleteExpiredSessions(instanceId, now.toISOString()),
    getMonitoringSnapshotRepository().deleteOlderThan(instanceId, subtractDays(now, monitoringRetentionDays)),
    getAuditLogRepository().deleteOlderThan(instanceId, subtractDays(now, auditRetentionDays)),
    getRedeemAttemptRepository().deleteOlderThan(instanceId, subtractDays(now, redeemAttemptRetentionDays)),
    getInstanceArchiveRepository().deleteExpiredArchives(now.toISOString()),
  ]);
}

export async function resetWorkshopState(templateId: string, instanceId = getCurrentWorkshopInstanceId()) {
  await createWorkshopArchive({
    reason: "reset",
    notes: `Automatic pre-reset archive for template ${templateId}`,
  }, instanceId);

  const sessionRepository = getEventAccessRepository();
  const sessions = await sessionRepository.listSessions(instanceId);
  await Promise.all(sessions.map((session) => sessionRepository.deleteSession(instanceId, session.tokenHash)));

  const instanceRepository = getWorkshopInstanceRepository();
  const existingInstance = await instanceRepository.getInstance(instanceId);
  const nextState = createWorkshopStateFromTemplate(templateId, instanceId);
  if (existingInstance) {
    await instanceRepository.updateInstance(instanceId, {
      ...existingInstance,
      templateId,
      status: "prepared",
      importedAt: new Date().toISOString(),
      removedAt: null,
      workshopMeta: nextState.workshopMeta,
    });
  }
  await getWorkshopStateRepository().saveState(instanceId, nextState);
  await getTeamRepository().replaceTeams(instanceId, []);
  await getCheckpointRepository().replaceCheckpoints(instanceId, []);
  await getMonitoringSnapshotRepository().replaceSnapshots(instanceId, []);
  await applyRuntimeRetentionPolicy(instanceId);
  return getWorkshopState(instanceId);
}

export async function removeWorkshopInstance(instanceId: string, actorNeonUserId?: string | null) {
  await createWorkshopArchive({
    reason: "manual",
    notes: "Automatic pre-remove archive for instance removal",
  }, instanceId);

  await getWorkshopInstanceRepository().removeInstance(instanceId, new Date().toISOString());
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "instance_removed",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: {
      actorNeonUserId: actorNeonUserId ?? null,
    },
  });
}
