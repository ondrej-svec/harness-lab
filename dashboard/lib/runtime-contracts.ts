import type { MonitoringSnapshot, SprintUpdate, Team, WorkshopInstanceRecord, WorkshopState } from "./workshop-data";

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

export type InstanceGrantRecord = {
  id: string;
  instanceId: WorkshopInstanceId;
  neonUserId: string;
  role: "owner" | "operator" | "observer";
  grantedAt: string;
  revokedAt: string | null;
};

export type FacilitatorDeviceAuthStatus =
  | "pending"
  | "approved"
  | "denied"
  | "expired"
  | "exchanged";

export type FacilitatorDeviceAuthRecord = {
  id: string;
  instanceId: WorkshopInstanceId | null;
  deviceCodeHash: string;
  userCodeHash: string;
  status: FacilitatorDeviceAuthStatus;
  createdAt: string;
  expiresAt: string;
  intervalSeconds: number;
  verificationUri: string;
  approvedAt: string | null;
  deniedAt: string | null;
  exchangedAt: string | null;
  neonUserId: string | null;
  role: InstanceGrantRecord["role"] | null;
};

export type FacilitatorCliSessionRecord = {
  tokenHash: string;
  neonUserId: string;
  authMode: "device";
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string;
  revokedAt: string | null;
};

export type FacilitatorGrantInfo = {
  id: string;
  instanceId: WorkshopInstanceId;
  neonUserId: string;
  role: "owner" | "operator" | "observer";
  grantedAt: string;
  revokedAt: string | null;
  userName: string | null;
  userEmail: string | null;
};

export type CheckpointRecord = SprintUpdate;
export type TeamRecord = Team;

export type RedeemAttemptRecord = {
  instanceId: WorkshopInstanceId;
  fingerprint: string;
  result: "success" | "failure";
  createdAt: string;
};

/**
 * RotationSignal — a single facilitator observation captured during the
 * continuation shift. Schema is deliberately loose for v1; see
 * `docs/continuation-shift-eval-design.md` for the rationale and the
 * rollout plan for a future rubric.
 */
export type RotationSignal = {
  id: string;
  instanceId: WorkshopInstanceId;
  capturedAt: string;
  capturedBy: "facilitator" | "participant" | "auto";
  teamId?: string;
  tags: string[];
  freeText: string;
  artifactPaths?: string[];
};

/**
 * LearningsLogEntry — the cross-cohort append-only wrapper around a
 * RotationSignal. Lives outside any instance directory so it survives
 * instance teardown. See ADR 2026-04-09 continuation-shift-as-eval.
 */
export type LearningsLogEntry = {
  cohort: string;
  instanceId: WorkshopInstanceId;
  loggedAt: string;
  signal: RotationSignal;
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
  listInstances(options?: { includeRemoved?: boolean }): Promise<WorkshopInstanceRecord[]>;
  createInstance(instance: WorkshopInstanceRecord): Promise<WorkshopInstanceRecord>;
  updateInstance(instanceId: WorkshopInstanceId, instance: WorkshopInstanceRecord): Promise<WorkshopInstanceRecord>;
  removeInstance(instanceId: WorkshopInstanceId, removedAt: string): Promise<void>;
}

export interface RuntimeWorkshopStateRepository {
  getState(instanceId: WorkshopInstanceId): Promise<WorkshopState>;
  saveState(
    instanceId: WorkshopInstanceId,
    state: WorkshopState,
    options?: { expectedVersion?: number },
  ): Promise<void>;
}

export interface ParticipantSessionRepository {
  listSessions(instanceId: WorkshopInstanceId): Promise<ParticipantSessionRecord[]>;
  findSession(instanceId: WorkshopInstanceId, tokenHash: string): Promise<ParticipantSessionRecord | null>;
  findSessionByTokenHash(tokenHash: string): Promise<ParticipantSessionRecord | null>;
  upsertSession(instanceId: WorkshopInstanceId, session: ParticipantSessionRecord): Promise<void>;
  deleteSession(instanceId: WorkshopInstanceId, tokenHash: string): Promise<void>;
  deleteExpiredSessions(instanceId: WorkshopInstanceId, now: string): Promise<void>;
}

export interface ParticipantEventAccessRepository {
  getActiveAccess(instanceId: WorkshopInstanceId): Promise<ParticipantEventAccessRecord | null>;
  listAllActiveAccess(): Promise<ParticipantEventAccessRecord[]>;
  saveAccess(instanceId: WorkshopInstanceId, access: ParticipantEventAccessRecord): Promise<void>;
}

export interface CheckpointRepository {
  listCheckpoints(instanceId: WorkshopInstanceId): Promise<CheckpointRecord[]>;
  appendCheckpoint(instanceId: WorkshopInstanceId, checkpoint: CheckpointRecord): Promise<void>;
  replaceCheckpoints(instanceId: WorkshopInstanceId, checkpoints: CheckpointRecord[]): Promise<void>;
}

export interface TeamRepository {
  listTeams(instanceId: WorkshopInstanceId): Promise<TeamRecord[]>;
  upsertTeam(instanceId: WorkshopInstanceId, team: TeamRecord): Promise<void>;
  replaceTeams(instanceId: WorkshopInstanceId, teams: TeamRecord[]): Promise<void>;
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

/**
 * RotationSignalRepository — instance-local persistence for rotation
 * signals. Scoped to one workshop instance. Deleted with the instance.
 */
export interface RotationSignalRepository {
  list(instanceId: WorkshopInstanceId): Promise<RotationSignal[]>;
  append(instanceId: WorkshopInstanceId, signal: RotationSignal): Promise<void>;
}

/**
 * LearningsLogRepository — cross-cohort append-only sink for rotation
 * signals. Lives at the root of the data directory (file mode) or in a
 * dedicated table (Neon mode), outside any instance scope so entries
 * survive instance teardown.
 */
export interface LearningsLogRepository {
  append(entry: LearningsLogEntry): Promise<void>;
}

export interface InstanceArchiveRepository {
  createArchive(record: InstanceArchiveRecord): Promise<void>;
  getLatestArchive(instanceId: WorkshopInstanceId): Promise<InstanceArchiveRecord | null>;
  deleteExpiredArchives(now: string): Promise<void>;
}

export interface FacilitatorAuthService {
  hasValidRequestCredentials(options: {
    authorizationHeader: string | null;
    instanceId?: WorkshopInstanceId | null;
  }): Promise<boolean>;

  /**
   * Validate the current Neon Auth session and check instance grants.
   * Returns true if the session is valid and the facilitator has an active grant.
   * Implementations that don't support session-based auth should return false.
   */
  hasValidSession(options: {
    instanceId?: WorkshopInstanceId | null;
  }): Promise<boolean>;
}

export interface InstanceGrantRepository {
  getActiveGrantByNeonUserId(instanceId: WorkshopInstanceId, neonUserId: string): Promise<InstanceGrantRecord | null>;
  listActiveGrants(instanceId: WorkshopInstanceId): Promise<FacilitatorGrantInfo[]>;
  countActiveGrants(instanceId: WorkshopInstanceId): Promise<number>;
  createGrant(instanceId: WorkshopInstanceId, neonUserId: string, role: InstanceGrantRecord["role"]): Promise<InstanceGrantRecord>;
  revokeGrant(grantId: string): Promise<void>;
}

export interface FacilitatorCliAuthRepository {
  createDeviceAuthorization(record: FacilitatorDeviceAuthRecord): Promise<void>;
  getDeviceAuthorizationByDeviceCodeHash(deviceCodeHash: string): Promise<FacilitatorDeviceAuthRecord | null>;
  getDeviceAuthorizationByUserCodeHash(userCodeHash: string): Promise<FacilitatorDeviceAuthRecord | null>;
  updateDeviceAuthorization(record: FacilitatorDeviceAuthRecord): Promise<void>;
  createCliSession(record: FacilitatorCliSessionRecord): Promise<void>;
  getCliSessionByTokenHash(tokenHash: string): Promise<FacilitatorCliSessionRecord | null>;
  updateCliSession(record: FacilitatorCliSessionRecord): Promise<void>;
}
