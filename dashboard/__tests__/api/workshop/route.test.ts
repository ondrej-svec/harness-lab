import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/workshop/route";
import { setFacilitatorAuthServiceForTests, type FacilitatorAuthService } from "@/lib/facilitator-auth-service";
import { seedWorkshopState, type WorkshopState } from "@/lib/workshop-data";
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "@/lib/workshop-state-repository";
import { setCheckpointRepositoryForTests, type CheckpointRepository } from "@/lib/checkpoint-repository";
import { setEventAccessRepositoryForTests, type EventAccessRepository } from "@/lib/event-access-repository";
import {
  setInstanceArchiveRepositoryForTests,
  type InstanceArchiveRepository,
} from "@/lib/instance-archive-repository";
import {
  setMonitoringSnapshotRepositoryForTests,
  type MonitoringSnapshotRepository,
} from "@/lib/monitoring-snapshot-repository";
import {
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "@/lib/participant-event-access-repository";
import { setRedeemAttemptRepositoryForTests, type RedeemAttemptRepository } from "@/lib/redeem-attempt-repository";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import type {
  AuditLogRecord,
  CheckpointRecord,
  InstanceArchiveRecord,
  ParticipantEventAccessRecord,
  ParticipantSessionRecord,
  RedeemAttemptRecord,
} from "@/lib/runtime-contracts";

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
  async listCheckpoints(instanceId: string): Promise<CheckpointRecord[]> {
    void instanceId;
    return [];
  }
  async appendCheckpoint(instanceId: string, checkpoint: CheckpointRecord) {
    void instanceId;
    void checkpoint;
  }
  async replaceCheckpoints(instanceId: string, checkpoints: CheckpointRecord[]) {
    void instanceId;
    void checkpoints;
  }
}

class MemoryEventAccessRepository implements EventAccessRepository {
  async listSessions(instanceId: string): Promise<ParticipantSessionRecord[]> {
    void instanceId;
    return [];
  }
  async findSession(instanceId: string, tokenHash: string) {
    void instanceId;
    void tokenHash;
    return null;
  }
  async upsertSession(instanceId: string, session: ParticipantSessionRecord) {
    void instanceId;
    void session;
  }
  async deleteSession(instanceId: string, tokenHash: string) {
    void instanceId;
    void tokenHash;
  }
  async deleteExpiredSessions(instanceId: string, now: string) {
    void instanceId;
    void now;
  }
}

class MemoryMonitoringSnapshotRepository implements MonitoringSnapshotRepository {
  async getSnapshots(instanceId: string) {
    void instanceId;
    return [];
  }
  async replaceSnapshots(instanceId: string, snapshots: WorkshopState["monitoring"]) {
    void instanceId;
    void snapshots;
  }
  async deleteOlderThan(instanceId: string, olderThan: string) {
    void instanceId;
    void olderThan;
  }
}

class MemoryParticipantEventAccessRepository implements ParticipantEventAccessRepository {
  async getActiveAccess(instanceId: string): Promise<ParticipantEventAccessRecord | null> {
    void instanceId;
    return null;
  }
  async saveAccess(instanceId: string, access: ParticipantEventAccessRecord) {
    void instanceId;
    void access;
  }
}

class MemoryArchiveRepository implements InstanceArchiveRepository {
  async createArchive(record: InstanceArchiveRecord) {
    void record;
  }
  async getLatestArchive(instanceId: string) {
    void instanceId;
    return null;
  }
  async deleteExpiredArchives(now: string) {
    void now;
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

describe("workshop route", () => {
  beforeEach(() => {
    setWorkshopStateRepositoryForTests(new MemoryWorkshopStateRepository(structuredClone(seedWorkshopState)));
    setCheckpointRepositoryForTests(new MemoryCheckpointRepository());
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository());
    setMonitoringSnapshotRepositoryForTests(new MemoryMonitoringSnapshotRepository());
    setParticipantEventAccessRepositoryForTests(new MemoryParticipantEventAccessRepository());
    setInstanceArchiveRepositoryForTests(new MemoryArchiveRepository());
    setRedeemAttemptRepositoryForTests(new MemoryRedeemAttemptRepository());
    setAuditLogRepositoryForTests(new MemoryAuditLogRepository());
    setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
    setCheckpointRepositoryForTests(null);
    setEventAccessRepositoryForTests(null);
    setMonitoringSnapshotRepositoryForTests(null);
    setParticipantEventAccessRepositoryForTests(null);
    setInstanceArchiveRepositoryForTests(null);
    setRedeemAttemptRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
  });

  it("returns workshop metadata and available templates", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      workshopId: "sample-studio-a",
      workshopMeta: { title: "Harness Lab" },
      templates: expect.arrayContaining([expect.objectContaining({ id: "sample-lab-d" })]),
    });
  });

  it("resets a workshop by re-importing the selected blueprint-backed template", async () => {
    const response = await POST(
      new Request("http://localhost/api/workshop", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({ templateId: "sample-lab-d" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      workshopId: "sample-lab-d",
      workshopMeta: { city: "Lab D" },
    });

    const current = await GET();
    await expect(current.json()).resolves.toMatchObject({
      workshopId: "sample-lab-d",
      workshopMeta: { currentPhaseLabel: "Úvod a naladění" },
    });
  });
});
