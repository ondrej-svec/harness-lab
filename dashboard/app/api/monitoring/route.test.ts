import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "./route";
import {
  setFacilitatorAuthServiceForTests,
} from "@/lib/facilitator-auth-service";
import {
  setMonitoringSnapshotRepositoryForTests,
  type MonitoringSnapshotRepository,
} from "@/lib/monitoring-snapshot-repository";
import type { FacilitatorAuthService } from "@/lib/runtime-contracts";
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

class MemoryMonitoringSnapshotRepository implements MonitoringSnapshotRepository {
  constructor(private items: WorkshopState["monitoring"] = []) {}

  async getSnapshots(instanceId: string) {
    void instanceId;
    return structuredClone(this.items);
  }

  async replaceSnapshots(_instanceId: string, snapshots: WorkshopState["monitoring"]) {
    this.items = structuredClone(snapshots);
  }
}

class AllowFacilitatorAuthService implements FacilitatorAuthService {
  async hasValidRequestCredentials() {
    return true;
  }
}

describe("monitoring route", () => {
  let repository: MemoryMonitoringSnapshotRepository;

  beforeEach(() => {
    repository = new MemoryMonitoringSnapshotRepository([
      {
        teamId: "t2",
        agentsFile: true,
        skillsCount: 2,
        commitsLast30Min: 7,
        testsVisible: 1,
      },
    ]);
    setWorkshopStateRepositoryForTests(new MemoryWorkshopStateRepository(structuredClone(seedWorkshopState)));
    setMonitoringSnapshotRepositoryForTests(repository);
    setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
    setMonitoringSnapshotRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
  });

  it("reads facilitator monitoring data from the normalized repository path", async () => {
    const response = await GET(new Request("http://localhost/api/monitoring"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      items: [{ teamId: "t2", skillsCount: 2 }],
    });
  });

  it("writes facilitator monitoring data through the normalized repository path", async () => {
    const response = await POST(
      new Request("http://localhost/api/monitoring", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          items: [
            {
              teamId: "t4",
              agentsFile: false,
              skillsCount: 1,
              commitsLast30Min: 3,
              testsVisible: 0,
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(repository.getSnapshots("sample-studio-a")).resolves.toMatchObject([{ teamId: "t4" }]);
  });
});
