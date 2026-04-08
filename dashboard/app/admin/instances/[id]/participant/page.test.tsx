import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicCopy } from "@/lib/ui-language";
import { sampleWorkshopInstances, seedWorkshopState } from "@/lib/workshop-data";

const requireFacilitatorPageAccess = vi.fn();
const getInstance = vi.fn();
const getWorkshopState = vi.fn();
const redirect = vi.fn();

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

const participantMirrorPageModulePromise = import("./page");

describe("Admin participant mirror page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInstance.mockResolvedValue(structuredClone(sampleWorkshopInstances[0]));
    getWorkshopState.mockResolvedValue(structuredClone(seedWorkshopState));
    requireFacilitatorPageAccess.mockResolvedValue(undefined);
  });

  it("renders the participant surface contract for facilitators without participant logout chrome", async () => {
    const { default: AdminParticipantMirrorPage } = await participantMirrorPageModulePromise;

    const view = await AdminParticipantMirrorPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });
    const html = renderToStaticMarkup(view);

    expect(requireFacilitatorPageAccess).toHaveBeenCalledWith("sample-studio-a");
    expect(getWorkshopState).toHaveBeenCalledWith("sample-studio-a");
    expect(html).toContain(publicCopy.en.navRoom);
    expect(html).toContain(publicCopy.en.sharedRoomNotes);
    expect(html).toContain("https://github.com/example/code-review-helper");
    expect(html).not.toContain(publicCopy.en.leaveRoomContext);
  });
});
