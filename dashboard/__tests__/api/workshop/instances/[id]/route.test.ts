import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET, PATCH } from "@/app/api/workshop/instances/[id]/route";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import { setFacilitatorAuthServiceForTests, type FacilitatorAuthService } from "@/lib/facilitator-auth-service";
import { sampleWorkshopInstances, seedWorkshopState, type WorkshopState } from "@/lib/workshop-data";
import { setWorkshopInstanceRepositoryForTests } from "@/lib/workshop-instance-repository";
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "@/lib/workshop-state-repository";
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

describe("workshop instance route", () => {
  let instanceRepository: MemoryWorkshopInstanceRepository;
  let stateRepository: MemoryWorkshopStateRepository;

  beforeEach(() => {
    instanceRepository = new MemoryWorkshopInstanceRepository();
    stateRepository = new MemoryWorkshopStateRepository();
    setWorkshopInstanceRepositoryForTests(instanceRepository);
    setWorkshopStateRepositoryForTests(stateRepository);
    setAuditLogRepositoryForTests(new MemoryAuditLogRepository());
    setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());
  });

  afterEach(() => {
    setWorkshopInstanceRepositoryForTests(null);
    setWorkshopStateRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
  });

  it("returns a single instance record", async () => {
    const response = await GET(
      new Request("http://localhost/api/workshop/instances/sample-studio-a"),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      instance: {
        id: "sample-studio-a",
        workshopMeta: { city: "Studio A" },
      },
    });
  });

  it("updates rich instance metadata for facilitator skill usage", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/workshop/instances/sample-studio-a", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          action: "update_metadata",
          eventTitle: "Developer Hackathon Praha",
          dateRange: "24. dubna 2026",
          venueName: "Seyfor Praha jednička 103",
          roomName: "Saturn",
          addressLine: "CZ, Praha 8, Sokolovska 695/115b",
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      instance: {
        id: "sample-studio-a",
        workshopMeta: {
          eventTitle: "Developer Hackathon Praha",
          dateRange: "24. dubna 2026",
          venueName: "Seyfor Praha jednička 103",
          roomName: "Saturn",
        },
      },
    });
    await expect(instanceRepository.getInstance("sample-studio-a")).resolves.toMatchObject({
      workshopMeta: {
        eventTitle: "Developer Hackathon Praha",
        addressLine: "CZ, Praha 8, Sokolovska 695/115b",
      },
    });
    await expect(stateRepository.getState("sample-studio-a")).resolves.toMatchObject({
      workshopMeta: {
        eventTitle: "Developer Hackathon Praha",
        venueName: "Seyfor Praha jednička 103",
      },
    });
  });

  it("rejects metadata updates that do not include any mutable fields", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/workshop/instances/sample-studio-a", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({ action: "update_metadata" }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error:
        "at least one metadata field is required (eventTitle, city, dateRange, venueName, roomName, addressLine, locationDetails, facilitatorLabel)",
    });
  });
});
