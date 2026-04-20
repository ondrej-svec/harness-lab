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
import { setWorkshopInstanceRepositoryForTests } from "@/lib/workshop-instance-repository";
import type {
  AuditLogRecord,
  CheckpointRecord,
  InstanceArchiveRecord,
  ParticipantEventAccessRecord,
  ParticipantSessionRecord,
  RedeemAttemptRecord,
  WorkshopInstanceRepository,
} from "@/lib/runtime-contracts";
import { sampleWorkshopInstances } from "@/lib/workshop-data";

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
  async findSessionByTokenHash(tokenHash: string) {
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

  async listAllActiveAccess() {
    return [];
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

class MemoryWorkshopInstanceRepository implements WorkshopInstanceRepository {
  constructor(private items = structuredClone(sampleWorkshopInstances)) {}

  async getDefaultInstanceId() {
    return this.items.find((item) => !item.removedAt && item.status !== "removed")?.id ?? this.items[0]?.id ?? "sample-studio-a";
  }

  async getInstance(instanceId: string) {
    return structuredClone(this.items.find((item) => item.id === instanceId) ?? null);
  }

  async listInstances(options?: { includeRemoved?: boolean }) {
    const items = options?.includeRemoved ? this.items : this.items.filter((item) => !item.removedAt && item.status !== "removed");
    return structuredClone(items);
  }

  async createInstance(instance: typeof sampleWorkshopInstances[number]) {
    this.items.push(structuredClone(instance));
    return instance;
  }

  async updateInstance(instanceId: string, instance: typeof sampleWorkshopInstances[number]) {
    this.items = this.items.map((item) => (item.id === instanceId ? structuredClone(instance) : item));
    return instance;
  }

  async removeInstance(instanceId: string, removedAt: string) {
    this.items = this.items.map((item) =>
      item.id === instanceId ? { ...item, status: "removed", removedAt } : item,
    );
  }
}

class AllowFacilitatorAuthService implements FacilitatorAuthService {
  async hasValidRequestCredentials() {
    return true;
  }

  async hasValidSession() {
    return false;
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
    setWorkshopInstanceRepositoryForTests(new MemoryWorkshopInstanceRepository());
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
    setWorkshopInstanceRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
  });

  it("returns workshop metadata and available templates when instanceId is provided", async () => {
    const response = await GET(new Request("http://localhost/api/workshop?instanceId=sample-studio-a"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      workshopId: "sample-studio-a",
      workshopMeta: { title: "Harness Lab" },
      templates: expect.arrayContaining([expect.objectContaining({ id: "blueprint-default" })]),
    });
    expect(payload).not.toHaveProperty("instances");
  });

  it("returns just templates without instanceId (auth probe mode)", async () => {
    const response = await GET(new Request("http://localhost/api/workshop"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      templates: expect.arrayContaining([expect.objectContaining({ id: "blueprint-default" })]),
    });
    expect(payload).not.toHaveProperty("workshopId");
  });

  it("resets a workshop runtime while preserving its instance metadata", async () => {
    const response = await POST(
      new Request("http://localhost/api/workshop", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({ templateId: "blueprint-default", instanceId: "sample-studio-a" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      workshopId: "sample-studio-a",
      workshopMeta: {
        city: "Studio A",
        currentPhaseLabel: "Úvod a\u00a0naladění",
      },
    });

    const current = await GET(new Request("http://localhost/api/workshop?instanceId=sample-studio-a"));
    await expect(current.json()).resolves.toMatchObject({
      workshopId: "sample-studio-a",
      workshopMeta: { currentPhaseLabel: "Úvod a\u00a0naladění" },
    });
  });

  it("falls back to the default blueprint when reset requests omit a template id", async () => {
    const response = await POST(
      new Request("http://localhost/api/workshop", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({ instanceId: "sample-studio-a" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      workshopId: "sample-studio-a",
    });
  });

  it("rejects reset action without instanceId", async () => {
    const response = await POST(
      new Request("http://localhost/api/workshop", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("creates a rich instance record through the legacy workshop action route", async () => {
    const response = await POST(
      new Request("http://localhost/api/workshop", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          action: "create",
          id: "sample-workshop-demo-orbit",
          templateId: "blueprint-default",
          eventTitle: "Sample Workshop Demo",
          city: "Example City",
          dateRange: "15. června 2026",
          venueName: "Example Campus North",
          roomName: "Orbit",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      created: true,
      instance: {
        id: "sample-workshop-demo-orbit",
        workshopMeta: {
          eventTitle: "Sample Workshop Demo",
          city: "Example City",
          venueName: "Example Campus North",
        },
      },
    });
  });
});
