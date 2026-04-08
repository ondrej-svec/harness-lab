import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { adminCopy } from "@/lib/ui-language";
import { sampleWorkshopInstances, seedWorkshopState } from "@/lib/workshop-data";

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
  });

  it("renders participant walkthrough scenes when requested explicitly", async () => {
    const { default: PresenterPage } = await presenterPageModulePromise;

    const view = await PresenterPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", agendaItem: "talk", scene: "talk-participant-view" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.presenterRoomPulseLabel);
    expect(html).toContain("Co má tým vidět bez facilitátorského šumu");
    expect(html).toContain("Live fáze a nejbližší další krok.");
    expect(html).toContain("Context is King");
    expect(html).toContain("09:40 • Context is King");
    expect(html).toContain("Místnost má odnést, že AGENTS.md, skills, runbooky a testy nejsou doplněk.");
    expect(html).toContain("Tým 1");
  });
});
