import { setAuditLogRepositoryForTests, type AuditLogRepository } from "./audit-log-repository";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setCheckpointRepositoryForTests, type CheckpointRepository } from "./checkpoint-repository";
import { setEventAccessRepositoryForTests, type EventAccessRepository } from "./event-access-repository";
import { setInstanceArchiveRepositoryForTests, type InstanceArchiveRepository } from "./instance-archive-repository";
import {
  setMonitoringSnapshotRepositoryForTests,
  type MonitoringSnapshotRepository,
} from "./monitoring-snapshot-repository";
import {
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "./participant-event-access-repository";
import { setRedeemAttemptRepositoryForTests, type RedeemAttemptRepository } from "./redeem-attempt-repository";
import { setTeamRepositoryForTests, type TeamRepository } from "./team-repository";
import { seedWorkshopState, type WorkshopState } from "./workshop-data";
import type { AuditLogRecord, InstanceArchiveRecord, ParticipantEventAccessRecord, ParticipantSessionRecord, RedeemAttemptRecord } from "./runtime-contracts";
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "./workshop-state-repository";
import {
  addSprintUpdate,
  applyRuntimeRetentionPolicy,
  createWorkshopArchive,
  completeChallenge,
  getWorkshopState,
  getLatestWorkshopArchive,
  resetWorkshopState,
  setCurrentAgendaItem,
  setRotationReveal,
  updateCheckpoint,
  upsertTeam,
} from "./workshop-store";

class MemoryWorkshopStateRepository implements WorkshopStateRepository {
  constructor(private state: WorkshopState) {}

  async getState(instanceId: string) {
    void instanceId;
    return structuredClone(this.state);
  }

  async saveState(_instanceId: string, state: WorkshopState) {
    this.state = structuredClone(state);
  }
}

class MemoryCheckpointRepository implements CheckpointRepository {
  constructor(private items: WorkshopState["sprintUpdates"] = []) {}

  async listCheckpoints(instanceId: string) {
    void instanceId;
    return structuredClone(this.items);
  }

  async appendCheckpoint(_instanceId: string, checkpoint: WorkshopState["sprintUpdates"][number]) {
    this.items = [structuredClone(checkpoint), ...this.items].slice(0, 12);
  }

  async replaceCheckpoints(_instanceId: string, checkpoints: WorkshopState["sprintUpdates"]) {
    this.items = structuredClone(checkpoints);
  }
}

class MemoryTeamRepository implements TeamRepository {
  constructor(private items: WorkshopState["teams"] = []) {}

  async listTeams(instanceId: string) {
    void instanceId;
    return structuredClone(this.items);
  }

  async upsertTeam(instanceId: string, team: WorkshopState["teams"][number]) {
    void instanceId;
    this.items = this.items.some((item) => item.id === team.id)
      ? this.items.map((item) => (item.id === team.id ? structuredClone(team) : item))
      : [...this.items, structuredClone(team)];
  }

  async replaceTeams(instanceId: string, teams: WorkshopState["teams"]) {
    void instanceId;
    this.items = structuredClone(teams);
  }
}

class MemoryMonitoringSnapshotRepository implements MonitoringSnapshotRepository {
  constructor(private items: WorkshopState["monitoring"] = []) {}

  async getSnapshots(instanceId: string) {
    void instanceId;
    return structuredClone(this.items);
  }

  async replaceSnapshots(_instanceId: string, snapshots: WorkshopState["monitoring"]) {
    this.items = structuredClone(snapshots);
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    void instanceId;
    void olderThan;
  }
}

class MemoryEventAccessRepository implements EventAccessRepository {
  constructor(private sessions: ParticipantSessionRecord[] = []) {}

  async listSessions(instanceId: string) {
    return structuredClone(this.sessions.filter((session) => session.instanceId === instanceId));
  }

  async findSession(instanceId: string, tokenHash: string) {
    return structuredClone(
      this.sessions.find((session) => session.instanceId === instanceId && session.tokenHash === tokenHash) ?? null,
    );
  }

  async upsertSession(instanceId: string, session: ParticipantSessionRecord) {
    this.sessions = this.sessions.some((item) => item.instanceId === instanceId && item.tokenHash === session.tokenHash)
      ? this.sessions.map((item) =>
          item.instanceId === instanceId && item.tokenHash === session.tokenHash ? structuredClone(session) : item,
        )
      : [...this.sessions, structuredClone({ ...session, instanceId })];
  }

  async deleteSession(instanceId: string, tokenHash: string) {
    this.sessions = this.sessions.filter((item) => !(item.instanceId === instanceId && item.tokenHash === tokenHash));
  }

  async deleteExpiredSessions(instanceId: string, now: string) {
    const nowMs = Date.parse(now);
    this.sessions = this.sessions.filter(
      (item) =>
        item.instanceId !== instanceId ||
        (Date.parse(item.expiresAt) > nowMs && Date.parse(item.absoluteExpiresAt) > nowMs),
    );
  }
}

class MemoryParticipantEventAccessRepository implements ParticipantEventAccessRepository {
  constructor(private access: ParticipantEventAccessRecord | null) {}

  async getActiveAccess(instanceId: string) {
    if (!this.access || this.access.instanceId !== instanceId) {
      return null;
    }

    return structuredClone(this.access);
  }

  async saveAccess(instanceId: string, access: ParticipantEventAccessRecord) {
    this.access = structuredClone({ ...access, instanceId });
  }
}

class MemoryArchiveRepository implements InstanceArchiveRepository {
  constructor(private items: InstanceArchiveRecord[] = []) {}

  async createArchive(record: InstanceArchiveRecord) {
    this.items = [structuredClone(record), ...this.items];
  }

  async getLatestArchive(instanceId: string) {
    return structuredClone(this.items.find((item) => item.instanceId === instanceId) ?? null);
  }

  async deleteExpiredArchives(now: string) {
    const nowMs = Date.parse(now);
    this.items = this.items.filter((item) => !item.retentionUntil || Date.parse(item.retentionUntil) >= nowMs);
  }
}

class MemoryRedeemAttemptRepository implements RedeemAttemptRepository {
  constructor(private items: RedeemAttemptRecord[] = []) {}

  async countRecentFailures(instanceId: string, fingerprint: string, since: string) {
    const sinceMs = Date.parse(since);
    return this.items.filter(
      (item) =>
        item.instanceId === instanceId &&
        item.fingerprint === fingerprint &&
        item.result === "failure" &&
        Date.parse(item.createdAt) >= sinceMs,
    ).length;
  }

  async appendAttempt(attempt: RedeemAttemptRecord) {
    this.items.push(structuredClone(attempt));
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    const olderThanMs = Date.parse(olderThan);
    this.items = this.items.filter(
      (item) => item.instanceId !== instanceId || Date.parse(item.createdAt) >= olderThanMs,
    );
  }
}

class MemoryAuditLogRepository implements AuditLogRepository {
  records: AuditLogRecord[] = [];

  async append(record: AuditLogRecord) {
    this.records.push(structuredClone(record));
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    const olderThanMs = Date.parse(olderThan);
    this.records = this.records.filter(
      (record) => record.instanceId !== instanceId || Date.parse(record.createdAt) >= olderThanMs,
    );
  }
}

describe("workshop-store", () => {
  let repository: MemoryWorkshopStateRepository;
  let checkpointRepository: MemoryCheckpointRepository;
  let teamRepository: MemoryTeamRepository;
  let monitoringRepository: MemoryMonitoringSnapshotRepository;
  let eventAccessRepository: MemoryEventAccessRepository;
  let participantEventAccessRepository: MemoryParticipantEventAccessRepository;
  let archiveRepository: MemoryArchiveRepository;
  let redeemAttemptRepository: MemoryRedeemAttemptRepository;
  let auditLogRepository: MemoryAuditLogRepository;

  beforeEach(() => {
    repository = new MemoryWorkshopStateRepository(structuredClone(seedWorkshopState));
    checkpointRepository = new MemoryCheckpointRepository();
    teamRepository = new MemoryTeamRepository();
    monitoringRepository = new MemoryMonitoringSnapshotRepository();
    eventAccessRepository = new MemoryEventAccessRepository([
      {
        tokenHash: "live-token",
        instanceId: "sample-studio-a",
        createdAt: "2026-04-06T09:00:00.000Z",
        lastValidatedAt: "2026-04-06T09:30:00.000Z",
        expiresAt: "2026-04-06T18:00:00.000Z",
        absoluteExpiresAt: "2026-04-06T22:00:00.000Z",
      },
    ]);
    participantEventAccessRepository = new MemoryParticipantEventAccessRepository({
      id: "pea-sample-studio-a",
      instanceId: "sample-studio-a",
      version: 3,
      codeHash: "stored-hash",
      expiresAt: "2026-04-20T12:00:00.000Z",
      revokedAt: null,
      sampleCode: "lantern8-context4-handoff2",
    });
    archiveRepository = new MemoryArchiveRepository();
    redeemAttemptRepository = new MemoryRedeemAttemptRepository([
      {
        instanceId: "sample-studio-a",
        fingerprint: "fp-1",
        result: "failure",
        createdAt: "2026-03-20T12:00:00.000Z",
      },
    ]);
    auditLogRepository = new MemoryAuditLogRepository();
    setWorkshopStateRepositoryForTests(repository);
    setCheckpointRepositoryForTests(checkpointRepository);
    setTeamRepositoryForTests(teamRepository);
    setMonitoringSnapshotRepositoryForTests(monitoringRepository);
    setEventAccessRepositoryForTests(eventAccessRepository);
    setParticipantEventAccessRepositoryForTests(participantEventAccessRepository);
    setInstanceArchiveRepositoryForTests(archiveRepository);
    setRedeemAttemptRepositoryForTests(redeemAttemptRepository);
    setAuditLogRepositoryForTests(auditLogRepository);
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
    setCheckpointRepositoryForTests(null);
    setTeamRepositoryForTests(null);
    setMonitoringSnapshotRepositoryForTests(null);
    setEventAccessRepositoryForTests(null);
    setParticipantEventAccessRepositoryForTests(null);
    setInstanceArchiveRepositoryForTests(null);
    setRedeemAttemptRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
  });

  it("moves the agenda and updates the phase label", async () => {
    const state = await setCurrentAgendaItem("rotation");

    expect(state.workshopMeta.currentPhaseLabel).toBe("Rotace týmů");
    expect(state.agenda.find((item) => item.id === "rotation")?.status).toBe("current");
    expect(state.agenda.find((item) => item.id === "opening")?.status).toBe("done");
  });

  it("updates facilitator-controlled team and checkpoint state", async () => {
    await updateCheckpoint("t1", "Checkpoint po facilitaci");
    let state = await getWorkshopState();
    expect(state.teams.find((team) => team.id === "t1")?.checkpoint).toBe("Checkpoint po facilitaci");

    await upsertTeam({
      id: "t9",
      name: "Tým 9",
      city: "Studio E",
      members: ["Iva", "Milan"],
      repoUrl: "https://github.com/example/new-team",
      projectBriefId: "standup-bot",
      checkpoint: "Nový tým zaregistrován",
    });

    state = await getWorkshopState();
    expect(state.teams.find((team) => team.id === "t9")?.name).toBe("Tým 9");
    await expect(teamRepository.listTeams("sample-studio-a")).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "t1", checkpoint: "Checkpoint po facilitaci" }),
        expect.objectContaining({ id: "t9", name: "Tým 9" }),
      ]),
    );
  });

  it("records challenge completion, sprint updates, and rotation reveal", async () => {
    await completeChallenge("review-skill", "t2");
    await addSprintUpdate({
      id: "u-new",
      teamId: "t2",
      text: "Přidali jsme test jako tracer bullet.",
      at: "11:23",
    });
    const state = await setRotationReveal(true);

    expect(state.rotation.revealed).toBe(true);
    expect(state.challenges.find((item) => item.id === "review-skill")?.completedBy).toContain("t2");
    expect(state.sprintUpdates[0]?.id).toBe("u-new");
    await expect(checkpointRepository.listCheckpoints("sample-studio-a")).resolves.toMatchObject([{ id: "u-new" }]);
  });

  it("resets state from a sample template", async () => {
    const state = await resetWorkshopState("sample-lab-d");

    expect(state.workshopId).toBe("sample-lab-d");
    expect(state.workshopMeta.city).toBe("Lab D");
    expect(state.teams).toEqual([]);
    expect(state.monitoring).toEqual([]);
    expect(state.sprintUpdates).toEqual([]);
    expect(state.teams).toEqual([]);
    await expect(teamRepository.listTeams("sample-studio-a")).resolves.toEqual([]);
    await expect(checkpointRepository.listCheckpoints("sample-studio-a")).resolves.toEqual([]);
    await expect(monitoringRepository.getSnapshots("sample-studio-a")).resolves.toEqual([]);
    await expect(eventAccessRepository.listSessions("sample-studio-a")).resolves.toEqual([]);
    await expect(getLatestWorkshopArchive()).resolves.toMatchObject({
      payload: {
        reason: "reset",
        participantEventAccessVersion: 3,
        participantSessions: [{ tokenHash: "live-token" }],
      },
    });
  });

  it("projects normalized checkpoint and monitoring data into the workshop-shaped read model", async () => {
    await teamRepository.replaceTeams("sample-studio-a", [
      {
        id: "t4",
        name: "Tým 4 runtime",
        city: "Lab D",
        members: ["Daniel", "Hana"],
        repoUrl: "https://github.com/example/runtime-team",
        projectBriefId: "metrics-dashboard",
        checkpoint: "Runtime team repository",
      },
    ]);
    await checkpointRepository.replaceCheckpoints("sample-studio-a", [
      {
        id: "u-projected",
        teamId: "t4",
        text: "Checkpoint je z dedikovaného repository.",
        at: "13:40",
      },
    ]);
    await monitoringRepository.replaceSnapshots("sample-studio-a", [
      {
        teamId: "t4",
        agentsFile: true,
        skillsCount: 3,
        commitsLast30Min: 8,
        testsVisible: 2,
      },
    ]);

    const state = await getWorkshopState();
    expect(state.teams).toMatchObject([{ id: "t4", name: "Tým 4 runtime" }]);
    expect(state.sprintUpdates).toMatchObject([{ id: "u-projected" }]);
    expect(state.monitoring).toMatchObject([{ teamId: "t4", skillsCount: 3 }]);
  });

  it("creates a manual archive with the normalized runtime payload", async () => {
    await checkpointRepository.replaceCheckpoints("sample-studio-a", [
      {
        id: "u-archive",
        teamId: "t1",
        text: "Archivovaný checkpoint",
        at: "14:10",
      },
    ]);
    await monitoringRepository.replaceSnapshots("sample-studio-a", [
      {
        teamId: "t1",
        agentsFile: true,
        skillsCount: 4,
        commitsLast30Min: 3,
        testsVisible: 2,
      },
    ]);

    const archive = await createWorkshopArchive({ notes: "Po workshopu" });

    expect(archive.payload.reason).toBe("manual");
    expect(archive.payload.checkpoints).toMatchObject([{ id: "u-archive" }]);
    expect(archive.payload.monitoringSnapshots).toMatchObject([{ teamId: "t1" }]);
    expect(archive.payload.participantSessions).toMatchObject([{ tokenHash: "live-token" }]);
    expect(auditLogRepository.records.at(-1)).toMatchObject({
      action: "instance_archive_created",
      result: "success",
    });
  });

  it("applies retention cleanup to stale runtime records", async () => {
    archiveRepository = new MemoryArchiveRepository([
      {
        id: "archive-expired",
        instanceId: "sample-studio-a",
        archiveStatus: "ready",
        storageUri: null,
        createdAt: "2026-03-01T12:00:00.000Z",
        retentionUntil: "2026-03-15T12:00:00.000Z",
        notes: null,
        payload: {
          archivedAt: "2026-03-01T12:00:00.000Z",
          reason: "manual",
          workshopState: structuredClone(seedWorkshopState),
          checkpoints: [],
          monitoringSnapshots: [],
          participantEventAccessVersion: null,
          participantSessions: [],
        },
      },
    ]);
    setInstanceArchiveRepositoryForTests(archiveRepository);

    await applyRuntimeRetentionPolicy();

    await expect(archiveRepository.getLatestArchive("sample-studio-a")).resolves.toBeNull();
    expect(redeemAttemptRepository["items"]).toEqual([]);
  });
});
