import type { MonitoringSnapshot, SprintUpdate, Team, WorkshopInstanceRecord, WorkshopState } from "./workshop-data";

export type WorkshopInstanceId = string;

export type ParticipantSessionRecord = {
  tokenHash: string;
  instanceId: WorkshopInstanceId;
  createdAt: string;
  expiresAt: string;
  lastValidatedAt: string;
  absoluteExpiresAt: string;
  /**
   * Soft binding to a named Participant entity. Null / absent for anonymous
   * sessions (the pre-2026-04-16 default). Set when a participant self-
   * identifies via `/api/event-access/identify` or redeems with a name.
   * Persisted via migration 2026-04-16-participants-and-team-members.sql.
   */
  participantId?: string | null;
};

export type ParticipantSession = {
  instanceId: WorkshopInstanceId;
  expiresAt: string;
  lastValidatedAt: string;
  absoluteExpiresAt: string;
  participantId?: string | null;
};

/**
 * ParticipantRecord — named-participant entity, per-instance. Soft-deletable
 * via `archivedAt`. `email` is opt-in only; `emailOptIn` gates every
 * email-using operation (follow-up send, export). `tag` is free-text,
 * typically used as seniority hint for cross-level randomize.
 * See docs/plans/2026-04-16-feat-participant-management-and-team-formation-plan.md.
 */
export type ParticipantRecord = {
  id: string;
  instanceId: WorkshopInstanceId;
  displayName: string;
  email: string | null;
  emailOptIn: boolean;
  tag: string | null;
  neonUserId: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

/**
 * TeamMemberRecord — normalized participant-to-team assignment. The
 * `UNIQUE(participant_id)` constraint enforces one-team-per-participant
 * per instance; move semantics require delete-then-insert.
 */
export type TeamMemberRecord = {
  id: string;
  instanceId: WorkshopInstanceId;
  teamId: string;
  participantId: string;
  assignedAt: string;
};

export type TeamCompositionHistoryEventType =
  | "assigned"
  | "unassigned"
  | "moved"
  | "rotation_marker";

export type TeamCompositionHistoryActorKind = "facilitator" | "system";

export type TeamCompositionHistoryEvent = {
  id: string;
  instanceId: WorkshopInstanceId;
  eventType: TeamCompositionHistoryEventType;
  participantId: string | null;
  fromTeamId: string | null;
  toTeamId: string | null;
  capturedAt: string;
  actorKind: TeamCompositionHistoryActorKind;
  note?: string | null;
  rotationId?: string | null;
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
  instanceId: WorkshopInstanceId | null;
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

export type PollResponseRecord = {
  id: string;
  instanceId: WorkshopInstanceId;
  pollId: string;
  participantId: string | null;
  sessionKey: string;
  teamId: string | null;
  optionId: string;
  submittedAt: string;
};

export type ParticipantFeedbackKind = "blocker" | "question";

export type ParticipantFeedbackRecord = {
  id: string;
  instanceId: WorkshopInstanceId;
  agendaItemId: string | null;
  participantMomentId: string | null;
  participantId: string | null;
  sessionKey: string;
  teamId: string | null;
  kind: ParticipantFeedbackKind;
  message: string;
  createdAt: string;
  promotedToTickerAt: string | null;
  promotedTickerId: string | null;
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

export interface ParticipantRepository {
  listParticipants(
    instanceId: WorkshopInstanceId,
    options?: { includeArchived?: boolean },
  ): Promise<ParticipantRecord[]>;
  findParticipant(
    instanceId: WorkshopInstanceId,
    participantId: string,
  ): Promise<ParticipantRecord | null>;
  findParticipantByDisplayName(
    instanceId: WorkshopInstanceId,
    displayName: string,
  ): Promise<ParticipantRecord | null>;
  /**
   * Return up to `limit` non-archived participants whose display name
   * contains `prefix` (case-insensitive). Backs the identify suggest
   * endpoint — the caller enforces min-chars and rate limiting.
   */
  listByDisplayNamePrefix(
    instanceId: WorkshopInstanceId,
    prefix: string,
    limit: number,
  ): Promise<ParticipantRecord[]>;
  findByNeonUserId(
    instanceId: WorkshopInstanceId,
    neonUserId: string,
  ): Promise<ParticipantRecord | null>;
  /**
   * Link a participant row to its Neon Auth user. Idempotent when the
   * link already matches. Rejects silently when another participant row
   * already owns that neon_user_id — the caller checks with
   * `findByNeonUserId` first if they care.
   */
  linkNeonUser(
    instanceId: WorkshopInstanceId,
    participantId: string,
    neonUserId: string,
    updatedAt: string,
  ): Promise<void>;
  upsertParticipant(
    instanceId: WorkshopInstanceId,
    participant: ParticipantRecord,
  ): Promise<void>;
  archiveParticipant(
    instanceId: WorkshopInstanceId,
    participantId: string,
    archivedAt: string,
  ): Promise<void>;
  replaceParticipants(
    instanceId: WorkshopInstanceId,
    participants: ParticipantRecord[],
  ): Promise<void>;
}

/**
 * AssignResult — returned by `assignMember`. If the participant was already
 * on another team, `movedFrom` names the previous team; `null` means this
 * was a fresh assignment. `changed=false` means the assignment was already
 * current and no write happened, so callers should not record a history event.
 */
export type AssignResult = { teamId: string; movedFrom: string | null; changed: boolean };
export type UnassignResult = { teamId: string } | null;

export interface TeamMemberRepository {
  listMembers(instanceId: WorkshopInstanceId): Promise<TeamMemberRecord[]>;
  listMembersByTeam(
    instanceId: WorkshopInstanceId,
    teamId: string,
  ): Promise<TeamMemberRecord[]>;
  findMemberByParticipant(
    instanceId: WorkshopInstanceId,
    participantId: string,
  ): Promise<TeamMemberRecord | null>;
  /** Assign-or-move. Idempotent on the same (participant, team) pair. */
  assignMember(
    instanceId: WorkshopInstanceId,
    assignment: TeamMemberRecord,
  ): Promise<AssignResult>;
  unassignMember(
    instanceId: WorkshopInstanceId,
    participantId: string,
  ): Promise<UnassignResult>;
  replaceMembers(
    instanceId: WorkshopInstanceId,
    members: TeamMemberRecord[],
  ): Promise<void>;
}

export interface TeamCompositionHistoryRepository {
  list(instanceId: WorkshopInstanceId): Promise<TeamCompositionHistoryEvent[]>;
  append(instanceId: WorkshopInstanceId, event: TeamCompositionHistoryEvent): Promise<void>;
}

export interface MonitoringSnapshotRepository {
  getSnapshots(instanceId: WorkshopInstanceId): Promise<MonitoringSnapshot[]>;
  replaceSnapshots(instanceId: WorkshopInstanceId, snapshots: MonitoringSnapshot[]): Promise<void>;
  deleteOlderThan(instanceId: WorkshopInstanceId, olderThan: string): Promise<void>;
}

export interface RedeemAttemptRepository {
  /**
   * Count recent failure attempts by fingerprint. Redeem happens before
   * the server knows which instance a submitted code belongs to, so the
   * rate-limit bucket is intentionally fingerprint-scoped (not instance-
   * scoped).
   */
  countRecentFailures(fingerprint: string, since: string): Promise<number>;
  appendAttempt(attempt: RedeemAttemptRecord): Promise<void>;
  deleteOlderThan(olderThan: string): Promise<void>;
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

export interface PollResponseRepository {
  list(instanceId: WorkshopInstanceId, pollId?: string): Promise<PollResponseRecord[]>;
  upsert(instanceId: WorkshopInstanceId, response: PollResponseRecord): Promise<void>;
  deletePoll(instanceId: WorkshopInstanceId, pollId: string): Promise<void>;
}

export interface ParticipantFeedbackRepository {
  list(instanceId: WorkshopInstanceId): Promise<ParticipantFeedbackRecord[]>;
  append(instanceId: WorkshopInstanceId, feedback: ParticipantFeedbackRecord): Promise<void>;
  markPromoted(
    instanceId: WorkshopInstanceId,
    feedbackId: string,
    promotion: { promotedToTickerAt: string; promotedTickerId: string },
  ): Promise<void>;
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
