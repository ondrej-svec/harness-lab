import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { adminCopy } from "@/lib/ui-language";
import { createWorkshopStateFromTemplate, sampleWorkshopInstances, seedWorkshopState } from "@/lib/workshop-data";

const redirect = vi.fn();
const requireFacilitatorPageAccess = vi.fn();
const getActivePollSummary = vi.fn();
const getActivePollSummaryForState = vi.fn();
const getWorkshopState = vi.fn();
const getInstance = vi.fn();
const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
  useRouter: () => ({
    push,
    replace,
  }),
  usePathname: () => "/admin/instances/sample-studio-a/presenter",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/facilitator-access", () => ({
  requireFacilitatorPageAccess,
}));

vi.mock("@/lib/workshop-instance-repository", () => ({
  getWorkshopInstanceRepository: () => ({
    getInstance,
  }),
}));

vi.mock("@/lib/workshop-store", () => ({
  getActivePollSummary,
  getActivePollSummaryForState,
  getWorkshopState,
}));

const presenterPageModulePromise = import("./page");

describe("PresenterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInstance.mockResolvedValue(structuredClone(sampleWorkshopInstances[0]));
    getActivePollSummary.mockResolvedValue(null);
    getActivePollSummaryForState.mockResolvedValue(null);
    getWorkshopState.mockResolvedValue(structuredClone(seedWorkshopState));
    requireFacilitatorPageAccess.mockResolvedValue(undefined);
  });

  it("renders the default room scene for the requested agenda item", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "rotation" }),
    });
    const html = renderToStaticMarkup(view);

    expect(getInstance).toHaveBeenCalledWith("sample-studio-a");
    expect(requireFacilitatorPageAccess).toHaveBeenCalledWith("sample-studio-a");
    expect(getWorkshopState).toHaveBeenCalledWith("sample-studio-a");
    // seedWorkshopState is a Czech-content instance, so the default scene
    // renders its Czech hero title from the 2026-04-12 Phase B translation
    // (with the 2026-04-13 ty→vy normalisation applied per style guide).
    expect(html).toContain("Vaše repo zůstává vaše");
    expect(html).not.toContain(adminCopy.en.presenterBack);
    expect(html).not.toContain(adminCopy.en.presenterScenesLabel);
  });

  it("keeps previous and next scene navigation via the scene rail", async () => {
    // Phase 6: the old ScenePager low-chrome prev/next buttons have
    // been replaced by the right-edge SceneRail (one dot per scene)
    // and the PresenterShell vertical swipe + keyboard handlers. This
    // test verifies the rail still surfaces every scene's href so the
    // facilitator can jump directly even without the swipe gesture.
    const { default: PresenterPage } = await presenterPageModulePromise;

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "rotation", scene: "rotation-read-the-room" }),
    });
    const html = renderToStaticMarkup(view);

    // Rail chrome is visible and carries the active scene marker.
    expect(html).toContain('aria-label="scene navigation"');
    expect(html).toContain('aria-current="true"');
    // The previous-scene href is still reachable from the rail.
    expect(html).toContain("scene=rotation-line-up");
  });

  it("renders the new Phase 2 engine-and-chassis reveal scene on the presenter surface", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;
    const state = createWorkshopStateFromTemplate("blueprint-default", "sample-studio-a", "en");
    getWorkshopState.mockResolvedValue(state);
    getInstance.mockResolvedValue({
      ...structuredClone(sampleWorkshopInstances[0]),
      workshopMeta: state.workshopMeta,
    });

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "talk", scene: "talk-how-to-build" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("How you actually build one");
    expect(html).toContain("Four pillars. Four moves. All visible in the repo.");
    expect(html).toContain("Context as infrastructure.");
    expect(html).not.toContain("What the room should see now");
  });

  it("renders room-safe poll aggregates on the live presenter scene", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;
    const state = createWorkshopStateFromTemplate("blueprint-default", "sample-studio-a", "en");
    state.agenda = state.agenda.map((item) => ({
      ...item,
      status: item.id === "talk" ? "current" : "upcoming",
    }));
    state.liveMoment = {
      agendaItemId: "talk",
      roomSceneId: "talk-how-to-build",
      participantMomentId: "talk-note-one-gap",
      participantMode: "auto",
      activePollId: "repo-signal-check",
    };
    getWorkshopState.mockResolvedValue(state);
    const pollSummary = {
      agendaItemId: "talk",
      participantMomentId: "talk-note-one-gap",
      pollId: "repo-signal-check",
      prompt: "Which repo signal needs work first?",
      totalResponses: 3,
      options: [
        { id: "map", label: "Map", count: 2 },
        { id: "verification", label: "Verification", count: 1 },
      ],
    };
    getActivePollSummary.mockResolvedValue(pollSummary);
    getActivePollSummaryForState.mockResolvedValue(pollSummary);
    getInstance.mockResolvedValue({
      ...structuredClone(sampleWorkshopInstances[0]),
      workshopMeta: state.workshopMeta,
    });

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "talk", scene: "talk-how-to-build" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Room signal");
    expect(html).toContain("Which repo signal needs work first?");
    expect(html).toContain("3 responses");
    expect(html).toContain("Verification");
  });

  it("renders attributed quotes and actionable link-list items in presenter scenes", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;
    const state = structuredClone(seedWorkshopState);
    const demoAgenda = state.agenda.find((item) => item.id === "demo");
    const demoScene = demoAgenda?.presenterScenes.find((scene) => scene.id === demoAgenda.defaultPresenterSceneId);
    if (demoScene) {
      demoScene.blocks = [
        {
          id: "demo-quote",
          type: "quote",
          quote: "A working system beats a bigger prompt.",
          attribution: "Andrew Ng",
        },
        {
          id: "demo-links",
          type: "link-list",
          title: "Source material",
          items: [
            {
              label: "Review the workshop blueprint",
              href: "https://example.com/blueprint",
              description: "Open the reusable workshop definition.",
            },
          ],
        },
      ];
    }
    getWorkshopState.mockResolvedValue(state);

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "demo" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Andrew Ng");
    expect(html).toContain("href=\"https://example.com/blueprint\"");
    expect(html).toContain(adminCopy.en.openLinkLabel);
  });

  it("renders image blocks with source attribution when provided", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;
    const state = structuredClone(seedWorkshopState);
    const talkAgenda = state.agenda.find((item) => item.id === "talk");
    const talkScene = talkAgenda?.presenterScenes.find((scene) => scene.id === talkAgenda.defaultPresenterSceneId);
    if (talkScene) {
      talkScene.blocks = [
        {
          id: "talk-image",
          type: "image",
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'%3E%3Crect width='1200' height='675' fill='%23e7dccd'/%3E%3C/svg%3E",
          alt: "Context map illustration",
          caption: "Use one room-facing image only when it sharpens the current moment.",
          sourceLabel: "Internal reference board",
          sourceHref: "https://example.com/internal-board",
        },
      ];
    }
    getWorkshopState.mockResolvedValue(state);

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "talk" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Context map illustration");
    expect(html).toContain("Internal reference board");
    expect(html).toContain("href=\"https://example.com/internal-board\"");
    expect(html).toContain(adminCopy.en.openLinkLabel);
  });

  it("renders the opening promise scene as room-safe content without backstage labels or facilitator source strips", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;
    const state = createWorkshopStateFromTemplate("blueprint-default", "sample-studio-a", "en");
    state.teams = structuredClone(seedWorkshopState.teams.slice(0, 1));
    getWorkshopState.mockResolvedValue(state);
    getInstance.mockResolvedValue({
      ...structuredClone(sampleWorkshopInstances[0]),
      workshopMeta: state.workshopMeta,
    });

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "opening", scene: "opening-framing" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Today you learn to shape the work so anyone");
    expect(html).toContain("The main line for today");
    expect(html).toContain("What should change today");
    expect(html).toContain("data-tone=\"info\"");
    expect(html).not.toContain("What the room should see now");
    expect(html).not.toContain("What the room should hear immediately");
    expect(html).not.toContain("source material");
    expect(html).not.toContain("content/talks/context-is-king.md");
  });

  it("renders the opening agenda scene as a concrete day timeline without backstage cue labels", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;
    const state = createWorkshopStateFromTemplate("blueprint-default", "sample-studio-a", "en");
    getWorkshopState.mockResolvedValue(state);
    getInstance.mockResolvedValue({
      ...structuredClone(sampleWorkshopInstances[0]),
      workshopMeta: state.workshopMeta,
    });

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "opening", scene: "opening-day-arc" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Today at a glance.");
    expect(html).toContain("09:10 · Opening, talk, and demo");
    expect(html).toContain("10:30 · Build 1");
    expect(html).toContain("13:30 · Rotation and Build 2");
    expect(html).toContain("15:45 · Reveal");
    expect(html).not.toContain("What the room should see now");
  });

  it("renders the simplified Czech team-formation room scene without anchor or naming steps", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ agendaItem: "opening", scene: "opening-team-formation-room" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Postavte se do řady. Rozpočítejte se. Sedněte si spolu.");
    expect(html).toContain("Sedněte si spolu a krátce se seznamte");
    expect(html).not.toContain("Vyberte si kotvu");
    expect(html).not.toContain("pojmenujte tým");
    expect(html).not.toContain("Řiďte se děním v sále");
    expect(html).not.toContain("tým zapíšeme naživo");
  });

  it("renders the updated opening handoff without board-based wording", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ agendaItem: "opening", scene: "opening-handoff" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Týmy jsou hotové. Podívejte se nahoru.");
    expect(html).toContain("Další krok: talk.");
    expect(html).not.toContain("Na boardu máte svůj tým");
  });

  it("renders localized English presenter content for an English-content workshop instance", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;
    const state = createWorkshopStateFromTemplate("blueprint-default", "sample-studio-a", "en");
    state.teams = structuredClone(seedWorkshopState.teams.slice(0, 1));
    getWorkshopState.mockResolvedValue(state);
    getInstance.mockResolvedValue({
      ...structuredClone(sampleWorkshopInstances[0]),
      workshopMeta: state.workshopMeta,
    });

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "rotation", scene: "rotation-read-the-room" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Every fresh agent session is a rotation");
    expect(html).toContain("That is the move you are about to practice.");
  });
});
