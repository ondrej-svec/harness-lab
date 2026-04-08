import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/workshop/instances/route";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import { setFacilitatorAuthServiceForTests, type FacilitatorAuthService } from "@/lib/facilitator-auth-service";
import { setWorkshopInstanceRepositoryForTests } from "@/lib/workshop-instance-repository";
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "@/lib/workshop-state-repository";
import { setCheckpointRepositoryForTests, type CheckpointRepository } from "@/lib/checkpoint-repository";
import { setMonitoringSnapshotRepositoryForTests, type MonitoringSnapshotRepository } from "@/lib/monitoring-snapshot-repository";
import { setTeamRepositoryForTests, type TeamRepository } from "@/lib/team-repository";
import { sampleWorkshopInstances, seedWorkshopState, type WorkshopState } from "@/lib/workshop-data";
import type { AuditLogRecord, WorkshopInstanceRepository } from "@/lib/runtime-contracts";

class MemoryWorkshopInstanceRepository implements WorkshopInstanceRepository {
  constructor(private items = structuredClone(sampleWorkshopInstances)) {}

  async getDefaultInstanceId() {
    return this.items[0]?.id ?? "sample-studio-a";
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
    this.items = this.items.map((item) => (item.id === instanceId ? { ...item, status: "removed", removedAt } : item));
  }
}

class MemoryWorkshopStateRepository implements WorkshopStateRepository {
  private items = new Map<string, WorkshopState>([["sample-studio-a", structuredClone(seedWorkshopState)]]);

  async getState(instanceId: string) {
    return structuredClone(this.items.get(instanceId) ?? { ...seedWorkshopState, workshopId: instanceId });
  }

  async saveState(instanceId: string, state: WorkshopState) {
    this.items.set(instanceId, structuredClone(state));
  }
}

class MemoryCheckpointRepository implements CheckpointRepository {
  async listCheckpoints() {
    return [];
  }
  async appendCheckpoint() {}
  async replaceCheckpoints() {}
}

class MemoryMonitoringSnapshotRepository implements MonitoringSnapshotRepository {
  async getSnapshots() {
    return [];
  }
  async replaceSnapshots() {}
  async deleteOlderThan() {}
}

class MemoryTeamRepository implements TeamRepository {
  async listTeams() {
    return [];
  }
  async upsertTeam() {}
  async replaceTeams() {}
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

  async hasValidSession() {
    return false;
  }
}

describe("workshop instances route", () => {
  let instanceRepository: MemoryWorkshopInstanceRepository;
  let stateRepository: MemoryWorkshopStateRepository;

  beforeEach(() => {
    instanceRepository = new MemoryWorkshopInstanceRepository();
    stateRepository = new MemoryWorkshopStateRepository();
    setWorkshopInstanceRepositoryForTests(instanceRepository);
    setWorkshopStateRepositoryForTests(stateRepository);
    setCheckpointRepositoryForTests(new MemoryCheckpointRepository());
    setMonitoringSnapshotRepositoryForTests(new MemoryMonitoringSnapshotRepository());
    setTeamRepositoryForTests(new MemoryTeamRepository());
    setAuditLogRepositoryForTests(new MemoryAuditLogRepository());
    setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());
  });

  afterEach(() => {
    setWorkshopInstanceRepositoryForTests(null);
    setWorkshopStateRepositoryForTests(null);
    setCheckpointRepositoryForTests(null);
    setMonitoringSnapshotRepositoryForTests(null);
    setTeamRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
  });

  it("lists active instances", async () => {
    const response = await GET(new Request("http://localhost/api/workshop/instances"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ id: "sample-studio-a" })]),
    });
  });

  it("creates a new instance and seeds its workshop state", async () => {
    const response = await POST(
      new Request("http://localhost/api/workshop/instances", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          id: "client-hackathon-2026-05",
          templateId: "blueprint-default",
          contentLang: "en",
          eventTitle: "Sample Workshop Demo",
          city: "Example City",
          dateRange: "15. června 2026",
          venueName: "Example Campus North",
          roomName: "Orbit",
          addressLine: "Example Avenue 123",
          locationDetails: "12 participants + facilitator",
          facilitatorLabel: "Alex",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      created: true,
      instance: {
        id: "client-hackathon-2026-05",
        templateId: "blueprint-default",
        workshopMeta: {
          contentLang: "en",
          eventTitle: "Sample Workshop Demo",
          city: "Example City",
          venueName: "Example Campus North",
          roomName: "Orbit",
        },
      },
    });
    await expect(instanceRepository.getInstance("client-hackathon-2026-05")).resolves.toMatchObject({
      id: "client-hackathon-2026-05",
      workshopMeta: {
        contentLang: "en",
        addressLine: "Example Avenue 123",
        locationDetails: "12 participants + facilitator",
        facilitatorLabel: "Alex",
      },
    });
    await expect(stateRepository.getState("client-hackathon-2026-05")).resolves.toMatchObject({
      workshopId: "client-hackathon-2026-05",
      workshopMeta: {
        contentLang: "en",
        eventTitle: "Sample Workshop Demo",
        city: "Example City",
        venueName: "Example Campus North",
      },
    });
  });

  it("rejects invalid create payloads for skill-facing calls", async () => {
    const response = await POST(
      new Request("http://localhost/api/workshop/instances", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          id: "Sample Workshop Demo",
          templateId: "missing-template",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "id must be a lowercase slug using only letters, numbers, and hyphens",
    });
  });
});
