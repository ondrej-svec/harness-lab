import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET, PATCH } from "@/app/api/agenda/route";
import { setFacilitatorAuthServiceForTests, type FacilitatorAuthService } from "@/lib/facilitator-auth-service";
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

class AllowFacilitatorAuthService implements FacilitatorAuthService {
  async hasValidRequestCredentials() {
    return true;
  }
}

describe("agenda route", () => {
  beforeEach(() => {
    setWorkshopStateRepositoryForTests(new MemoryWorkshopStateRepository(structuredClone(seedWorkshopState)));
    setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
  });

  it("returns the current phase and agenda items", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      phase: { id: "build-1", title: "Build Phase 1" },
      items: expect.arrayContaining([expect.objectContaining({ id: "rotation" })]),
    });
  });

  it("updates the current phase through the shared runtime store", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/agenda", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({ currentId: "rotation" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      phase: "Rotace týmů",
      items: expect.arrayContaining([expect.objectContaining({ id: "rotation", status: "current" })]),
    });
  });
});
