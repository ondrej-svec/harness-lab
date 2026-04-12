import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { adminCopy } from "@/lib/ui-language";
import { createWorkshopStateFromTemplate, sampleWorkshopInstances, seedWorkshopState } from "@/lib/workshop-data";

const redirect = vi.fn();
const requireFacilitatorPageAccess = vi.fn();
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
  getWorkshopState,
}));

const presenterPageModulePromise = import("./page");

describe("PresenterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInstance.mockResolvedValue(structuredClone(sampleWorkshopInstances[0]));
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
    // renders its Czech hero title from the 2026-04-12 Phase B translation.
    expect(html).toContain("Tvoje repo už není tvoje");
    expect(html).not.toContain(adminCopy.en.presenterBack);
    expect(html).not.toContain(adminCopy.en.presenterScenesLabel);
  });

  it("keeps low-chrome previous and next scene navigation on the presenter surface", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "rotation", scene: "rotation-read-the-room" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.presenterScenePagerLabel);
    expect(html).toContain(adminCopy.en.presenterPreviousSceneButton);
    expect(html).not.toContain(adminCopy.en.presenterNextSceneButton);
    expect(html).toContain("scene 3/3");
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
      searchParams: Promise.resolve({ lang: "en", agendaItem: "talk", scene: "talk-got-a-name" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Last week, it got a name");
    expect(html).toContain("Agent = Model + Harness");
    expect(html).toContain("Birgitta Böckeler, Thoughtworks");
    expect(html).not.toContain("What the room should see now");
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

  it("renders checklist scenes without generic backstage cue labels", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;
    const state = createWorkshopStateFromTemplate("blueprint-default", "sample-studio-a", "en");
    getWorkshopState.mockResolvedValue(state);
    getInstance.mockResolvedValue({
      ...structuredClone(sampleWorkshopInstances[0]),
      workshopMeta: state.workshopMeta,
    });

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "opening", scene: "opening-day-schedule" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("09:10");
    expect(html).toContain("Day schedule");
    expect(html).not.toContain("What the room should see now");
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
    expect(html).toContain("If this is confusing, that&#x27;s the point.");
  });
});
