import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { adminCopy } from "@/lib/ui-language";
import { createWorkshopStateFromTemplate, sampleWorkshopInstances, seedWorkshopState } from "@/lib/workshop-data";

const redirect = vi.fn();
const requireFacilitatorPageAccess = vi.fn();
const getWorkshopState = vi.fn();
const getInstance = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
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
    expect(html).toContain(adminCopy.en.presenterPageEyebrow);
    expect(html).toContain("Rotace týmů");
    expect(html).toContain("Bez ústního handoffu");
    expect(html).not.toContain(adminCopy.en.presenterBack);
    expect(html).not.toContain(adminCopy.en.presenterScenesLabel);
  });

  it("renders participant walkthrough scenes when requested explicitly", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "talk", scene: "talk-participant-view" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Co má tým vidět bez facilitátorského šumu");
    expect(html).toContain("Aktuální fáze a nejbližší další krok.");
    expect(html).toContain("Context is King");
    expect(html).toContain("09:40 • Context is King");
    expect(html).not.toContain("Vrstva pro účastníky nemá být dekorace.");
    expect(html.split("Aktuální fáze a nejbližší další krok.")).toHaveLength(2);
    expect(html).not.toContain(adminCopy.en.presenterRoomPulseLabel);
    expect(html).not.toContain("Tým 1");
    expect(html).toContain("href=\"https://github.com/ondrej-svec/harness-lab/blob/main/workshop-skill/reference.md\"");
    expect(html).toContain(adminCopy.en.openLinkLabel);
  });

  it("keeps authored participant walkthrough scenes cue-first across rotation scenes too", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "rotation", scene: "rotation-participant-view" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Nový tým začíná mapou, ne improvizací");
    expect(html).toContain("Vrstva pro účastníky nemá zachraňovat slabý signál v repu.");
    expect(html).not.toContain("Nejdřív čtěte README, AGENTS.md a plan.");
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
      searchParams: Promise.resolve({ lang: "en", agendaItem: "rotation", scene: "rotation-instructions" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("Team rotation");
    expect(html).toContain("Instructions for the new team");
    expect(html).toContain("Start with the README, AGENTS.md, and the plan");
  });
});
