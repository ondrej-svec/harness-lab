import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/workshop/archive/route";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import { setCheckpointRepositoryForTests, type CheckpointRepository } from "@/lib/checkpoint-repository";
import { setEventAccessRepositoryForTests, type EventAccessRepository } from "@/lib/event-access-repository";
import { setFacilitatorAuthServiceForTests, type FacilitatorAuthService } from "@/lib/facilitator-auth-service";
import { setInstanceArchiveRepositoryForTests, type InstanceArchiveRepository } from "@/lib/instance-archive-repository";
import {
  setMonitoringSnapshotRepositoryForTests,
  type MonitoringSnapshotRepository,
} from "@/lib/monitoring-snapshot-repository";
import {
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "@/lib/participant-event-access-repository";
import { setRedeemAttemptRepositoryForTests, type RedeemAttemptRepository } from "@/lib/redeem-attempt-repository";
import type {
  AuditLogRecord,
  CheckpointRecord,
  InstanceArchiveRecord,
  ParticipantEventAccessRecord,
  ParticipantSessionRecord,
  RedeemAttemptRecord,
} from "@/lib/runtime-contracts";
import { seedWorkshopState, type WorkshopState } from "@/lib/workshop-data";
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "@/lib/workshop-state-repository";

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
  constructor(private items: CheckpointRecord[] = []) {}

  async listCheckpoints(instanceId: string) {
    void instanceId;
    return structuredClone(this.items);
  }

  async appendCheckpoint(_instanceId: string, checkpoint: CheckpointRecord) {
    this.items = [structuredClone(checkpoint), ...this.items];
  }

  async replaceCheckpoints(_instanceId: string, checkpoints: CheckpointRecord[]) {
    this.items = structuredClone(checkpoints);
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
    this.sessions = [...this.sessions.filter((item) => item.tokenHash !== session.tokenHash), structuredClone(session)];
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

  async saveAccess(_instanceId: string, access: ParticipantEventAccessRecord) {
    this.access = structuredClone(access);
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
  async countRecentFailures(instanceId: string, fingerprint: string, since: string) {
    void instanceId;
    void fingerprint;
    void since;
    return 0;
  }

  async appendAttempt(attempt: RedeemAttemptRecord) {
    void attempt;
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    void instanceId;
    void olderThan;
  }
}

class MemoryAuditLogRepository implements AuditLogRepository {
  async append(record: AuditLogRecord) {
    void record;
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    void instanceId;
    void olderThan;
  }
}

class AllowFacilitatorAuthService implements FacilitatorAuthService {
  async hasValidRequestCredentials() {
    return true;
  }
}

describe("workshop archive route", () => {
  let archiveRepository: MemoryArchiveRepository;

  beforeEach(() => {
    archiveRepository = new MemoryArchiveRepository();
    setWorkshopStateRepositoryForTests(new MemoryWorkshopStateRepository(structuredClone(seedWorkshopState)));
    setCheckpointRepositoryForTests(
      new MemoryCheckpointRepository([{ id: "u-archive", teamId: "t1", text: "Archivovat", at: "14:10" }]),
    );
    setMonitoringSnapshotRepositoryForTests(
      new MemoryMonitoringSnapshotRepository([
        { teamId: "t1", agentsFile: true, skillsCount: 2, commitsLast30Min: 4, testsVisible: 1 },
      ]),
    );
    setEventAccessRepositoryForTests(
      new MemoryEventAccessRepository([
        {
          tokenHash: "live-token",
          instanceId: "sample-studio-a",
          createdAt: "2026-04-06T09:00:00.000Z",
          lastValidatedAt: "2026-04-06T10:00:00.000Z",
          expiresAt: "2026-04-06T18:00:00.000Z",
          absoluteExpiresAt: "2026-04-06T22:00:00.000Z",
        },
      ]),
    );
    setParticipantEventAccessRepositoryForTests(
      new MemoryParticipantEventAccessRepository({
        id: "pea-sample-studio-a",
        instanceId: "sample-studio-a",
        version: 2,
        codeHash: "stored-hash",
        expiresAt: "2026-04-20T12:00:00.000Z",
        revokedAt: null,
      }),
    );
    setInstanceArchiveRepositoryForTests(archiveRepository);
    setRedeemAttemptRepositoryForTests(new MemoryRedeemAttemptRepository());
    setAuditLogRepositoryForTests(new MemoryAuditLogRepository());
    setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-06T12:00:00.000Z"));
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
    setCheckpointRepositoryForTests(null);
    setMonitoringSnapshotRepositoryForTests(null);
    setEventAccessRepositoryForTests(null);
    setParticipantEventAccessRepositoryForTests(null);
    setInstanceArchiveRepositoryForTests(null);
    setRedeemAttemptRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
    vi.useRealTimers();
  });

  it("creates a facilitator-triggered archive snapshot", async () => {
    const response = await POST(
      new Request("http://localhost/api/workshop/archive", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({ notes: "Po workshopu" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      archive: { reason: "manual", notes: "Po workshopu" },
    });
    await expect(archiveRepository.getLatestArchive("sample-studio-a")).resolves.toMatchObject({
      payload: {
        participantEventAccessVersion: 2,
        participantSessions: [{ tokenHash: "live-token" }],
      },
    });
  });

  it("returns the latest archive summary", async () => {
    await archiveRepository.createArchive({
      id: "archive-existing",
      instanceId: "sample-studio-a",
      archiveStatus: "ready",
      storageUri: null,
      createdAt: "2026-04-06T12:00:00.000Z",
      retentionUntil: "2026-05-06T12:00:00.000Z",
      notes: "Existing archive",
      payload: {
        archivedAt: "2026-04-06T12:00:00.000Z",
        reason: "manual",
        workshopState: structuredClone(seedWorkshopState),
        checkpoints: [],
        monitoringSnapshots: [],
        participantEventAccessVersion: null,
        participantSessions: [],
      },
    });

    const response = await GET(
      new Request("http://localhost/api/workshop/archive", {
        headers: {
          authorization: "Basic dummy",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      archive: { id: "archive-existing", notes: "Existing archive" },
    });
  });

  it("returns a null archive summary when nothing has been archived yet", async () => {
    const response = await GET(
      new Request("http://localhost/api/workshop/archive", {
        headers: {
          authorization: "Basic dummy",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ archive: null });
  });

  it("accepts invalid json bodies and archives with null notes", async () => {
    const response = await POST(
      new Request("http://localhost/api/workshop/archive", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          authorization: "Basic dummy",
        },
        body: "{",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      archive: { reason: "manual", notes: null },
    });
  });
});
