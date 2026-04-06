import type { MonitoringSnapshot, SprintUpdate, WorkshopInstanceRecord, WorkshopState } from "./workshop-data";

export type WorkshopInstanceId = string;

export type ParticipantSessionRecord = {
  tokenHash: string;
  instanceId: WorkshopInstanceId;
  createdAt: string;
  expiresAt: string;
  lastValidatedAt: string;
  absoluteExpiresAt: string;
};

export type ParticipantSession = {
  instanceId: WorkshopInstanceId;
  expiresAt: string;
  lastValidatedAt: string;
  absoluteExpiresAt: string;
};

export type ParticipantEventAccessRecord = {
  id: string;
  instanceId: WorkshopInstanceId;
  version: number;
  codeHash: string;
  expiresAt: string;
  revokedAt: string | null;
  sampleCode?: string | null;
};

export type AuditLogRecord = {
  id: string;
  instanceId: WorkshopInstanceId | null;
  actorKind: "participant" | "facilitator" | "system";
  action: string;
  result: "success" | "failure";
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type FacilitatorIdentityRecord = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string | null;
  authSubject: string | null;
  status: "active" | "disabled";
};

export type InstanceGrantRecord = {
  id: string;
  instanceId: WorkshopInstanceId;
  facilitatorIdentityId: string;
  role: "owner" | "operator" | "observer";
  revokedAt: string | null;
};

export type CheckpointRecord = SprintUpdate;

export type RedeemAttemptRecord = {
  instanceId: WorkshopInstanceId;
  fingerprint: string;
  result: "success" | "failure";
  createdAt: string;
};

export type WorkshopArchivePayload = {
  archivedAt: string;
  reason: "manual" | "reset";
  workshopState: WorkshopState;
  checkpoints: CheckpointRecord[];
  monitoringSnapshots: MonitoringSnapshot[];
  participantEventAccessVersion: number | null;
  participantSessions: ParticipantSessionRecord[];
};

export type InstanceArchiveRecord = {
  id: string;
  instanceId: WorkshopInstanceId;
  archiveStatus: "ready" | "expired";
  storageUri: string | null;
  createdAt: string;
  retentionUntil: string | null;
  notes: string | null;
  payload: WorkshopArchivePayload;
};

export interface WorkshopInstanceRepository {
  getDefaultInstanceId(): Promise<WorkshopInstanceId>;
  getInstance(instanceId: WorkshopInstanceId): Promise<WorkshopInstanceRecord | null>;
  listInstances(): Promise<WorkshopInstanceRecord[]>;
}

export interface RuntimeWorkshopStateRepository {
  getState(instanceId: WorkshopInstanceId): Promise<WorkshopState>;
  saveState(instanceId: WorkshopInstanceId, state: WorkshopState): Promise<void>;
}

export interface ParticipantSessionRepository {
  listSessions(instanceId: WorkshopInstanceId): Promise<ParticipantSessionRecord[]>;
  findSession(instanceId: WorkshopInstanceId, tokenHash: string): Promise<ParticipantSessionRecord | null>;
  upsertSession(instanceId: WorkshopInstanceId, session: ParticipantSessionRecord): Promise<void>;
  deleteSession(instanceId: WorkshopInstanceId, tokenHash: string): Promise<void>;
  deleteExpiredSessions(instanceId: WorkshopInstanceId, now: string): Promise<void>;
}

export interface ParticipantEventAccessRepository {
  getActiveAccess(instanceId: WorkshopInstanceId): Promise<ParticipantEventAccessRecord | null>;
  saveAccess(instanceId: WorkshopInstanceId, access: ParticipantEventAccessRecord): Promise<void>;
}

export interface CheckpointRepository {
  listCheckpoints(instanceId: WorkshopInstanceId): Promise<CheckpointRecord[]>;
  appendCheckpoint(instanceId: WorkshopInstanceId, checkpoint: CheckpointRecord): Promise<void>;
  replaceCheckpoints(instanceId: WorkshopInstanceId, checkpoints: CheckpointRecord[]): Promise<void>;
}

export interface MonitoringSnapshotRepository {
  getSnapshots(instanceId: WorkshopInstanceId): Promise<MonitoringSnapshot[]>;
  replaceSnapshots(instanceId: WorkshopInstanceId, snapshots: MonitoringSnapshot[]): Promise<void>;
  deleteOlderThan(instanceId: WorkshopInstanceId, olderThan: string): Promise<void>;
}

export interface RedeemAttemptRepository {
  countRecentFailures(instanceId: WorkshopInstanceId, fingerprint: string, since: string): Promise<number>;
  appendAttempt(attempt: RedeemAttemptRecord): Promise<void>;
  deleteOlderThan(instanceId: WorkshopInstanceId, olderThan: string): Promise<void>;
}

export interface AuditLogRepository {
  append(record: AuditLogRecord): Promise<void>;
  deleteOlderThan(instanceId: WorkshopInstanceId, olderThan: string): Promise<void>;
}

export interface InstanceArchiveRepository {
  createArchive(record: InstanceArchiveRecord): Promise<void>;
  getLatestArchive(instanceId: WorkshopInstanceId): Promise<InstanceArchiveRecord | null>;
  deleteExpiredArchives(now: string): Promise<void>;
}

export interface FacilitatorAuthService {
  hasValidRequestCredentials(options: {
    authorizationHeader: string | null;
    instanceId: WorkshopInstanceId;
  }): Promise<boolean>;
}

export interface FacilitatorIdentityRepository {
  findByUsername(username: string): Promise<FacilitatorIdentityRecord | null>;
  findBySubject(subject: string): Promise<FacilitatorIdentityRecord | null>;
}

export interface InstanceGrantRepository {
  getActiveGrant(instanceId: WorkshopInstanceId, facilitatorIdentityId: string): Promise<InstanceGrantRecord | null>;
}
