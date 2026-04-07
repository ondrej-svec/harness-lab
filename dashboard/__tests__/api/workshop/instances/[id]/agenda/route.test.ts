import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DELETE, GET, PATCH, POST } from "@/app/api/workshop/instances/[id]/agenda/route";
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

  async hasValidSession() {
    return false;
  }
}

describe("instance agenda route", () => {
  beforeEach(() => {
    setWorkshopStateRepositoryForTests(new MemoryWorkshopStateRepository(structuredClone(seedWorkshopState)));
    setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
  });

  it("returns the agenda for the selected instance", async () => {
    const response = await GET(new Request("http://localhost/api/workshop/instances/sample-studio-a/agenda"), {
      params: Promise.resolve({ id: "sample-studio-a" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      phase: { id: "build-1" },
      items: expect.arrayContaining([expect.objectContaining({ id: "rotation" })]),
    });
  });

  it("adds, updates, reorders, and removes local agenda items", async () => {
    const created = await POST(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/agenda", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          title: "Coffee break",
          time: "11:20",
          description: "Lokální blok navíc.",
          afterItemId: "build-1",
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    const createdBody = (await created.json()) as { items: WorkshopState["agenda"] };
    const customItem = createdBody.items.find((item) => item.title === "Coffee break");
    expect(customItem).toBeTruthy();

    const updated = await PATCH(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/agenda", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          action: "update",
          itemId: customItem?.id,
          title: "Break",
          time: "11:25",
          description: "Posunuto o pět minut.",
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    await expect(updated.json()).resolves.toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ id: customItem?.id, title: "Break", time: "11:25" })]),
    });

    const moved = await PATCH(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/agenda", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          action: "move",
          itemId: customItem?.id,
          direction: "up",
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    await expect(moved.json()).resolves.toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ id: customItem?.id })]),
    });

    const removed = await DELETE(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/agenda", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          itemId: customItem?.id,
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    await expect(removed.json()).resolves.toMatchObject({
      ok: true,
    });
  });
});
