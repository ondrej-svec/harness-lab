import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DELETE, GET, PATCH, POST } from "@/app/api/workshop/instances/[id]/scenes/route";
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

describe("instance scenes route", () => {
  beforeEach(() => {
    setWorkshopStateRepositoryForTests(new MemoryWorkshopStateRepository(structuredClone(seedWorkshopState)));
    setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
  });

  it("returns presenter scenes for the selected instance", async () => {
    const response = await GET(new Request("http://localhost/api/workshop/instances/sample-studio-a/scenes"), {
      params: Promise.resolve({ id: "sample-studio-a" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      currentAgendaItemId: "build-1",
      items: expect.arrayContaining([
        expect.objectContaining({
          agendaItemId: "talk",
          scenes: expect.arrayContaining([
            expect.objectContaining({ id: "talk-argued-about-prompts", sceneType: "briefing" }),
            expect.objectContaining({ id: "talk-how-to-build", sceneType: "briefing" }),
          ]),
        }),
      ]),
    });
  });

  it("adds, updates, reorders, configures, and removes presenter scenes", async () => {
    const created = await POST(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/scenes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          agendaItemId: "talk",
          label: "Custom prompt",
          sceneType: "custom",
          title: "Custom scene",
          body: "Lokální presenter scena.",
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    const createdBody = (await created.json()) as { agendaItem: WorkshopState["agenda"][number] };
    const customScene = createdBody.agendaItem.presenterScenes.find((scene) => scene.label === "Custom prompt");
    expect(customScene).toBeTruthy();

    const updated = await PATCH(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/scenes", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          action: "update",
          agendaItemId: "talk",
          sceneId: customScene?.id,
          label: "Adjusted prompt",
          sceneType: "checkpoint",
          title: "Adjusted scene",
          body: "Evidence prompt.",
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    await expect(updated.json()).resolves.toMatchObject({
      agendaItem: {
        presenterScenes: expect.arrayContaining([expect.objectContaining({ id: customScene?.id, label: "Adjusted prompt" })]),
      },
    });

    const moved = await PATCH(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/scenes", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          action: "move",
          agendaItemId: "talk",
          sceneId: customScene?.id,
          direction: "up",
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    await expect(moved.json()).resolves.toMatchObject({
      agendaItem: {
        presenterScenes: expect.arrayContaining([expect.objectContaining({ id: customScene?.id })]),
      },
    });

    const setDefault = await PATCH(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/scenes", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          action: "set_default",
          agendaItemId: "talk",
          sceneId: customScene?.id,
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    await expect(setDefault.json()).resolves.toMatchObject({
      agendaItem: { defaultPresenterSceneId: customScene?.id },
    });

    const disabled = await PATCH(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/scenes", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          action: "set_enabled",
          agendaItemId: "talk",
          sceneId: customScene?.id,
          enabled: false,
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    await expect(disabled.json()).resolves.toMatchObject({
      agendaItem: {
        presenterScenes: expect.arrayContaining([expect.objectContaining({ id: customScene?.id, enabled: false })]),
      },
    });

    const removed = await DELETE(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/scenes", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          agendaItemId: "talk",
          sceneId: customScene?.id,
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    await expect(removed.json()).resolves.toMatchObject({
      ok: true,
      agendaItem: {
        presenterScenes: expect.not.arrayContaining([expect.objectContaining({ id: customScene?.id })]),
      },
    });
  });

  it("returns 404 when mutating a missing agenda item or presenter scene", async () => {
    const missingAgendaResponse = await POST(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/scenes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          agendaItemId: "missing",
          label: "Custom prompt",
          sceneType: "custom",
          title: "Custom scene",
          body: "Lokální presenter scena.",
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    expect(missingAgendaResponse.status).toBe(404);
    await expect(missingAgendaResponse.json()).resolves.toMatchObject({
      ok: false,
      error: "agenda_item_not_found",
    });

    const missingSceneResponse = await PATCH(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/scenes", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          action: "set_default",
          agendaItemId: "talk",
          sceneId: "missing-scene",
        }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    expect(missingSceneResponse.status).toBe(404);
    await expect(missingSceneResponse.json()).resolves.toMatchObject({
      ok: false,
      error: "presenter_scene_not_found",
    });
  });
});
