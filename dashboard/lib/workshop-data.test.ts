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
    const state = createWorkshopStateFromTemplate("blueprint-default");

    expect(state.workshopId).toBe("blueprint-default");
    expect(state.workshopMeta.city).toBe("Workshop venue");
    expect(state.workshopMeta.dateRange).toBe("Workshop day");
    expect(state.workshopMeta.eventTitle).toBe("Harness Lab workshop");
    expect(state.workshopMeta.contentLang).toBe("cs");
    expect(state.workshopMeta.venueName).toBe("Workshop venue");
    expect(state.workshopMeta.roomName).toBe("Main room");
    expect(state.rotation.revealed).toBe(false);
    expect(state.rotation.scenario).toBe("20-participants");
    expect(state.teams).toEqual([]);
    expect(state.monitoring).toEqual([]);
    expect(state.sprintUpdates).toEqual([]);
    expect(state.challenges.every((challenge) => challenge.completedBy.length === 0)).toBe(true);
    expect(state.agenda.map((item) => item.id)).toEqual(blueprintAgenda.phases.map((phase) => phase.id));

    expect(state.agenda[0]?.status).toBe("current");
    expect(state.agenda.slice(1).every((item) => item.status === "upcoming")).toBe(true);
    expect(state.agenda[0]?.presenterScenes[0]).toMatchObject({
      id: blueprintAgenda.phases[0]?.scenes[0]?.id,
      kind: "blueprint",
      surface: "room",
      sourceBlueprintSceneId: blueprintAgenda.phases[0]?.scenes[0]?.id,
    });
    expect(state.agenda[1]?.defaultPresenterSceneId).toBe(blueprintAgenda.phases[1]?.defaultSceneId);
    expect(state.ticker).toEqual([
      {
        id: "tick-reset",
        label: "Instance Výchozí blueprint je připravená. Zaregistrujte týmy a spusťte první checkpoint.",
        tone: "info",
      },
    ]);
  });

  it("resolves localized agenda and presenter content for an English-content instance", () => {
    const state = createWorkshopStateFromTemplate("blueprint-default", "english-workshop", "en");
    const opening = state.agenda[0];
    const handoffScene = opening?.presenterScenes.find((scene) => scene.id === "opening-handoff-loop");
    const participantScene = opening?.presenterScenes.find((scene) => scene.id === "opening-participant-view");

    expect(state.workshopMeta.contentLang).toBe("en");
    expect(state.workshopMeta.subtitle).toBe("Workshop operating system for working with AI agents");
    expect(opening?.title).toBe("Opening and orientation");
    expect(opening?.goal).toContain("Open the day as a shared launch");
    expect(opening?.facilitatorRunner.goal).toBe("Launch the day as a room-facing start, not as an operating brief.");
    expect(handoffScene?.title).toBe("The day has one arc: learn, build, hand off, continue");
    expect(handoffScene?.blocks[0]).toMatchObject({
      id: "opening-loop-steps",
      title: "What you are actually going to experience today",
    });
    expect(handoffScene?.surface).toBe("room");
    expect(participantScene?.title).toBe("At the start of the day, keep the purpose, next block, and first proof in view");
    expect(participantScene?.surface).toBe("participant");
    expect(participantScene?.blocks[0]).toMatchObject({
      id: "opening-participant-hero",
      title: "Today is not prompt theatre",
    });
    expect(state.briefs[0]?.problem).toContain("Developers lose time");
    expect(state.challenges[0]?.title).toBe("Create AGENTS.md as a map");
    expect(state.setupPaths[0]?.summary).toContain("fastest path");
    expect(state.ticker[0]?.label).toBe("Instance is ready. Register teams and start the first checkpoint.");
  });

  it("falls back to the seed state when a template is unknown", () => {
    const state = createWorkshopStateFromTemplate("missing-template");

    expect(state.workshopId).toBe("blueprint-default");
    expect(state.workshopMeta.city).toBe("Workshop venue");
    expect(state.workshopMeta.title).toBe(seedWorkshopState.workshopMeta.title);
  });

  it("can create workshop state from an instance record", () => {
    const state = createWorkshopStateFromInstance(createWorkshopInstanceRecord({
      id: "client-workshop-001",
      templateId: "blueprint-default",
      workshopMeta: {
        title: "Harness Lab",
        subtitle: "Private workshop instance",
        contentLang: "en",
        eventTitle: "Client innovation day",
        city: "Client HQ",
        dateRange: "12. května 2026",
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
    expect(state.workshopMeta.contentLang).toBe("en");
    expect(state.workshopMeta.eventTitle).toBe("Client innovation day");
    expect(state.rotation.scenario).toBe("20-participants");
    expect(state.agenda[0]?.status).toBe("current");
    expect(state.agenda[0]?.title).toBe("Opening and orientation");
    expect(state.agenda[0]).toMatchObject({
      order: 1,
      sourceBlueprintPhaseId: blueprintAgenda.phases[0]?.id,
      kind: "blueprint",
      defaultPresenterSceneId: blueprintAgenda.phases[0]?.defaultSceneId,
    });
    expect(state.agenda[0]?.presenterScenes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: blueprintAgenda.phases[0]?.scenes[0]?.id,
          title: "Today we are building a working system, not prompt theatre",
        }),
      ]),
    );
  });

  it("includes an explicit participant-view scene for every blueprint phase", () => {
    expect(
      seedWorkshopState.agenda.every((item) =>
        item.presenterScenes.some((scene) => scene.surface === "participant"),
      ),
    ).toBe(true);
  });

  it("keeps default presenter scenes on the room-facing surface", () => {
    expect(
      seedWorkshopState.agenda.every((item) => {
        const defaultScene = item.presenterScenes.find((scene) => scene.id === item.defaultPresenterSceneId);
        return defaultScene?.surface === "room";
      }),
    ).toBe(true);
  });

  it("keeps the rewritten talk and reveal flagship scenes structurally richer in English content", () => {
    const state = createWorkshopStateFromTemplate("blueprint-default", "english-workshop", "en");
    const talk = state.agenda.find((item) => item.id === "talk");
    const reveal = state.agenda.find((item) => item.id === "reveal");
    const talkScene = talk?.presenterScenes.find((scene) => scene.id === "talk-framing");
    const talkParticipantScene = talk?.presenterScenes.find((scene) => scene.id === "talk-participant-view");
    const revealScene = reveal?.presenterScenes.find((scene) => scene.id === "reveal-1-2-4-all");

    expect(talkScene?.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "talk-reframe", type: "callout" }),
        expect.objectContaining({ id: "talk-adopt", type: "checklist" }),
      ]),
    );
    expect(talk?.facilitatorRunner.say[0]).toBe("Context is leverage, not cosmetics.");
    expect(talkParticipantScene?.ctaLabel).toBe("Open install and first commands");
    expect(revealScene?.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "reveal-steps", type: "steps" }),
        expect.objectContaining({ id: "reveal-system-frame", type: "callout" }),
      ]),
    );
  });

  it("keeps the rewritten talk and reveal flagship scenes structurally richer in the default Czech blueprint", () => {
    const state = createWorkshopStateFromTemplate("blueprint-default");
    const talk = state.agenda.find((item) => item.id === "talk");
    const reveal = state.agenda.find((item) => item.id === "reveal");
    const talkScene = talk?.presenterScenes.find((scene) => scene.id === "talk-framing");
    const talkParticipantScene = talk?.presenterScenes.find((scene) => scene.id === "talk-participant-view");
    const revealScene = reveal?.presenterScenes.find((scene) => scene.id === "reveal-1-2-4-all");

    expect(talkScene?.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "talk-reframe", type: "callout" }),
        expect.objectContaining({ id: "talk-adopt", type: "checklist" }),
      ]),
    );
    expect(talk?.facilitatorRunner.say[0]).toBe("Kontext je páka, ne kosmetika.");
    expect(talkParticipantScene?.ctaLabel).toBe("Otevřít install a první příkazy");
    expect(revealScene?.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "reveal-steps", type: "steps" }),
        expect.objectContaining({ id: "reveal-system-frame", type: "callout" }),
      ]),
    );
  });

  it("returns the team name when present and the id otherwise", () => {
    expect(getTeamName("t2", seedWorkshopState.teams)).toBe("Tým 2");
    expect(getTeamName("unknown-team", seedWorkshopState.teams)).toBe("unknown-team");
  });
});
