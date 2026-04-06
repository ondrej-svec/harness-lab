import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { seedWorkshopState, type WorkshopState } from "./workshop-data";
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "./workshop-state-repository";
import {
  addSprintUpdate,
  completeChallenge,
  resetWorkshopState,
  setCurrentAgendaItem,
  setRotationReveal,
  updateCheckpoint,
  upsertTeam,
} from "./workshop-store";

class MemoryWorkshopStateRepository implements WorkshopStateRepository {
  constructor(private state: WorkshopState) {}

  async getState() {
    return structuredClone(this.state);
  }

  async saveState(state: WorkshopState) {
    this.state = structuredClone(state);
  }
}

describe("workshop-store", () => {
  let repository: MemoryWorkshopStateRepository;

  beforeEach(() => {
    repository = new MemoryWorkshopStateRepository(structuredClone(seedWorkshopState));
    setWorkshopStateRepositoryForTests(repository);
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
  });

  it("moves the agenda and updates the phase label", async () => {
    const state = await setCurrentAgendaItem("rotation");

    expect(state.workshopMeta.currentPhaseLabel).toBe("Rotace týmů");
    expect(state.agenda.find((item) => item.id === "rotation")?.status).toBe("current");
    expect(state.agenda.find((item) => item.id === "opening")?.status).toBe("done");
  });

  it("updates facilitator-controlled team and checkpoint state", async () => {
    await updateCheckpoint("t1", "Checkpoint po facilitaci");
    let state = await repository.getState();
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

    state = await repository.getState();
    expect(state.teams.find((team) => team.id === "t9")?.name).toBe("Tým 9");
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
  });

  it("resets state from a sample template", async () => {
    const state = await resetWorkshopState("sample-lab-d");

    expect(state.workshopId).toBe("sample-lab-d");
    expect(state.workshopMeta.city).toBe("Lab D");
    expect(state.teams).toEqual([]);
    expect(state.monitoring).toEqual([]);
    expect(state.sprintUpdates).toEqual([]);
  });
});
