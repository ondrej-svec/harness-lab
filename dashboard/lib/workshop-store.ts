import { randomUUID } from "node:crypto";
import { getAuditLogRepository } from "./audit-log-repository";
import {
  createWorkshopStateFromTemplate,
  type MonitoringSnapshot,
  type SprintUpdate,
  type Team,
  type WorkshopState,
} from "./workshop-data";
import { getCheckpointRepository } from "./checkpoint-repository";
import { getEventAccessRepository } from "./event-access-repository";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { getInstanceArchiveRepository } from "./instance-archive-repository";
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

export async function getWorkshopState(): Promise<WorkshopState> {
  const instanceId = getCurrentWorkshopInstanceId();
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
): Promise<WorkshopState> {
  const current = await getBaseWorkshopState();
  const next = updater(current);
  await getWorkshopStateRepository().saveState(getCurrentWorkshopInstanceId(), {
    ...next,
    monitoring: current.monitoring,
    sprintUpdates: current.sprintUpdates,
  });
  return getWorkshopState();
}

export async function setCurrentAgendaItem(itemId: string) {
  return updateWorkshopState((state) => {
    const agenda = state.agenda.map((item) => {
      if (item.id === itemId) {
        return { ...item, status: "current" as const };
      }
      const targetIndex = state.agenda.findIndex((entry) => entry.id === itemId);
      const ownIndex = state.agenda.findIndex((entry) => entry.id === item.id);
      return {
        ...item,
        status: ownIndex < targetIndex ? ("done" as const) : ("upcoming" as const),
      };
    });
    const currentPhaseLabel = agenda.find((item) => item.status === "current")?.title ?? state.workshopMeta.currentPhaseLabel;
    return {
      ...state,
      agenda,
      workshopMeta: { ...state.workshopMeta, currentPhaseLabel },
    };
  });
}

export async function upsertTeam(input: Team) {
  const instanceId = getCurrentWorkshopInstanceId();
  const repository = getTeamRepository();
  await repository.upsertTeam(instanceId, input);
  const teams = await repository.listTeams(instanceId);

  // Keep the workshop-state projection aligned during the migration window.
  const state = await getBaseWorkshopState(instanceId);
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    teams,
  });

  return getWorkshopState();
}

export async function updateCheckpoint(teamId: string, checkpoint: string) {
  const instanceId = getCurrentWorkshopInstanceId();
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

  return getWorkshopState();
}

export async function completeChallenge(challengeId: string, teamId: string) {
  return updateWorkshopState((state) => ({
    ...state,
    challenges: state.challenges.map((challenge) =>
      challenge.id === challengeId && !challenge.completedBy.includes(teamId)
        ? { ...challenge, completedBy: [...challenge.completedBy, teamId] }
        : challenge,
    ),
  }));
}

export async function setRotationReveal(revealed: boolean) {
  return updateWorkshopState((state) => ({
    ...state,
    rotation: { ...state.rotation, revealed },
  }));
}

export async function addSprintUpdate(update: SprintUpdate) {
  const instanceId = getCurrentWorkshopInstanceId();
  const repository = getCheckpointRepository();
  await repository.appendCheckpoint(instanceId, update);
  const checkpoints = await repository.listCheckpoints(instanceId);

  // Keep the workshop-state projection aligned during the migration window.
  const state = await getBaseWorkshopState(instanceId);
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    sprintUpdates: checkpoints,
  });

  return getWorkshopState();
}

export async function replaceMonitoring(items: MonitoringSnapshot[]) {
  const instanceId = getCurrentWorkshopInstanceId();
  const repository = getMonitoringSnapshotRepository();
  await repository.replaceSnapshots(instanceId, items);

  // Keep the workshop-state projection aligned during the migration window.
  const state = await getBaseWorkshopState(instanceId);
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    monitoring: items,
  });

  return getWorkshopState();
}

export async function getLatestWorkshopArchive() {
  const instanceId = getCurrentWorkshopInstanceId();
  return getInstanceArchiveRepository().getLatestArchive(instanceId);
}

export async function createWorkshopArchive(options?: {
  reason?: "manual" | "reset";
  notes?: string | null;
}) {
  const instanceId = getCurrentWorkshopInstanceId();
  const reason = options?.reason ?? "manual";
  const archivedAt = new Date();
  const [workshopState, checkpoints, monitoringSnapshots, participantEventAccess, participantSessions] = await Promise.all([
    getWorkshopState(),
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

export async function applyRuntimeRetentionPolicy() {
  const instanceId = getCurrentWorkshopInstanceId();
  const now = new Date();
  await Promise.all([
    getEventAccessRepository().deleteExpiredSessions(instanceId, now.toISOString()),
    getMonitoringSnapshotRepository().deleteOlderThan(instanceId, subtractDays(now, monitoringRetentionDays)),
    getAuditLogRepository().deleteOlderThan(instanceId, subtractDays(now, auditRetentionDays)),
    getRedeemAttemptRepository().deleteOlderThan(instanceId, subtractDays(now, redeemAttemptRetentionDays)),
    getInstanceArchiveRepository().deleteExpiredArchives(now.toISOString()),
  ]);
}

export async function resetWorkshopState(templateId: string) {
  const instanceId = getCurrentWorkshopInstanceId();
  await createWorkshopArchive({
    reason: "reset",
    notes: `Automatic pre-reset archive for template ${templateId}`,
  });

  const sessionRepository = getEventAccessRepository();
  const sessions = await sessionRepository.listSessions(instanceId);
  await Promise.all(sessions.map((session) => sessionRepository.deleteSession(instanceId, session.tokenHash)));

  const next = createWorkshopStateFromTemplate(templateId);
  await getWorkshopStateRepository().saveState(instanceId, next);
  await getTeamRepository().replaceTeams(instanceId, []);
  await getCheckpointRepository().replaceCheckpoints(instanceId, []);
  await getMonitoringSnapshotRepository().replaceSnapshots(instanceId, []);
  await applyRuntimeRetentionPolicy();
  return getWorkshopState();
}
