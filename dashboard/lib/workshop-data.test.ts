import { describe, expect, it } from "vitest";
import blueprintAgenda from "./workshop-blueprint-agenda.json";
import {
  createWorkshopInstanceRecord,
  createWorkshopStateFromInstance,
  createWorkshopStateFromTemplate,
  getTeamName,
  seedWorkshopState,
} from "./workshop-data";

describe("workshop-data", () => {
  it("creates a clean sample instance from a template", () => {
    const state = createWorkshopStateFromTemplate("sample-lab-c");

    expect(state.workshopId).toBe("sample-lab-c");
    expect(state.workshopMeta.city).toBe("Lab C");
    expect(state.workshopMeta.dateRange).toBe("Ukázkový workshop den • Project room");
    expect(state.workshopMeta.eventTitle).toBe("Ukázková instance C");
    expect(state.workshopMeta.venueName).toBe("Lab C");
    expect(state.workshopMeta.roomName).toBe("Project room");
    expect(state.rotation.revealed).toBe(false);
    expect(state.rotation.scenario).toBe("17-participants");
    expect(state.teams).toEqual([]);
    expect(state.monitoring).toEqual([]);
    expect(state.sprintUpdates).toEqual([]);
    expect(state.challenges.every((challenge) => challenge.completedBy.length === 0)).toBe(true);
    expect(state.agenda.map((item) => item.id)).toEqual(blueprintAgenda.phases.map((phase) => phase.id));

    expect(state.agenda[0]?.status).toBe("current");
    expect(state.agenda.slice(1).every((item) => item.status === "upcoming")).toBe(true);
    expect(state.ticker).toEqual([
      {
        id: "tick-reset",
        label: "Instance Ukázková instance C je připravená. Zaregistrujte týmy a spusťte první checkpoint.",
        tone: "info",
      },
    ]);
  });

  it("falls back to the seed state when a template is unknown", () => {
    const state = createWorkshopStateFromTemplate("missing-template");

    expect(state.workshopId).toBe("sample-studio-a");
    expect(state.workshopMeta.city).toBe("Studio A");
    expect(state.workshopMeta.title).toBe(seedWorkshopState.workshopMeta.title);
  });

  it("can create workshop state from an instance record", () => {
    const state = createWorkshopStateFromInstance(createWorkshopInstanceRecord({
      id: "client-workshop-001",
      templateId: "sample-studio-b",
      workshopMeta: {
        title: "Harness Lab",
        subtitle: "Soukromá workshop instance",
        eventTitle: "Client innovation day",
        city: "Client HQ",
        dateRange: "12. května 2026 • Main room",
        venueName: "Client HQ",
        roomName: "Main room",
        addressLine: "Innovation street 12",
        facilitatorLabel: "Ondrej",
        currentPhaseLabel: "Opening",
        adminHint: "Privátní data běží mimo public repo.",
      },
    }));

    expect(state.workshopId).toBe("client-workshop-001");
    expect(state.workshopMeta.city).toBe("Client HQ");
    expect(state.workshopMeta.eventTitle).toBe("Client innovation day");
    expect(state.rotation.scenario).toBe("20-participants");
    expect(state.agenda[0]?.status).toBe("current");
    expect(state.agenda[0]?.title).toBe(blueprintAgenda.phases[0]?.label);
    expect(state.agenda[0]).toMatchObject({
      order: 1,
      sourceBlueprintPhaseId: blueprintAgenda.phases[0]?.id,
      kind: "blueprint",
    });
  });

  it("returns the team name when present and the id otherwise", () => {
    expect(getTeamName("t2", seedWorkshopState.teams)).toBe("Tým 2");
    expect(getTeamName("unknown-team", seedWorkshopState.teams)).toBe("unknown-team");
  });
});
