import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { adminCopy } from "@/lib/ui-language";
import { sampleWorkshopInstances, seedWorkshopState } from "@/lib/workshop-data";

const redirect = vi.fn();
const requireFacilitatorActionAccess = vi.fn();
const requireFacilitatorPageAccess = vi.fn();
const getFacilitatorSession = vi.fn();
const getWorkshopState = vi.fn();
const getRuntimeStorageMode = vi.fn();
const getSession = vi.fn();
const listInstances = vi.fn();
const getDefaultInstanceId = vi.fn();
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
  requireFacilitatorActionAccess,
  requireFacilitatorPageAccess,
}));

vi.mock("@/lib/auth/server", () => ({
  auth: {
    getSession,
    signOut: vi.fn(),
  },
}));

vi.mock("@/lib/facilitator-session", () => ({
  getFacilitatorSession,
}));

vi.mock("@/lib/runtime-storage", () => ({
  getRuntimeStorageMode,
}));

vi.mock("@/lib/workshop-instance-repository", () => ({
  getWorkshopInstanceRepository: () => ({
    listInstances,
    getDefaultInstanceId,
  }),
}));

vi.mock("@/lib/workshop-store", () => ({
  createWorkshopInstance: vi.fn(),
  getWorkshopState,
  removeWorkshopInstance: vi.fn(),
}));

const adminPageViewModelPromise = import("@/lib/admin-page-view-model");
const adminPageModulePromise = import("./page");

describe("workspace admin helpers", () => {
  it("resolves control-room sections and workspace links", async () => {
    const {
      buildAdminInstanceHref,
      buildAdminWorkspaceHref,
      buildWorkspaceStatusSummary,
      filterWorkshopInstances,
      resolveAdminSection,
    } = await adminPageViewModelPromise;

    expect(resolveAdminSection("teams")).toBe("people");
    expect(resolveAdminSection("unknown")).toBe("run");
    expect(buildAdminWorkspaceHref({ lang: "cs" })).toBe("/admin");
    expect(buildAdminWorkspaceHref({ lang: "en", query: "studio", status: "running" })).toBe(
      "/admin?q=studio&status=running&lang=en",
    );
    expect(buildAdminWorkspaceHref({ lang: "en", query: "studio", status: "running", removeInstanceId: "sample-studio-a" })).toBe(
      "/admin?q=studio&status=running&removeInstance=sample-studio-a&lang=en",
    );
    expect(
      buildAdminInstanceHref({
        lang: "en",
        instanceId: "sample-studio-b",
        section: "signals",
        error: "password_mismatch",
      }),
    ).toBe("/admin/instances/sample-studio-b?error=password_mismatch&lang=en");
    expect(buildWorkspaceStatusSummary(sampleWorkshopInstances)).toMatchObject({ all: 4, prepared: 4, running: 0 });
    expect(filterWorkshopInstances(sampleWorkshopInstances, { query: "lab c", status: "all" })).toHaveLength(1);
  });
});

describe("AdminWorkspacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listInstances.mockResolvedValue(structuredClone(sampleWorkshopInstances));
    getDefaultInstanceId.mockResolvedValue("sample-studio-a");
    requireFacilitatorPageAccess.mockResolvedValue(undefined);
    getRuntimeStorageMode.mockReturnValue("file");
    getWorkshopState.mockResolvedValue(structuredClone(seedWorkshopState));
    getFacilitatorSession.mockResolvedValue(null);
    getSession.mockResolvedValue({ data: null });
  });

  it("renders the workspace cockpit and instance creation form", async () => {
    const { default: AdminWorkspacePage } = await adminPageModulePromise;

    const view = await AdminWorkspacePage({
      searchParams: Promise.resolve({ lang: "en" }),
    });
    const html = renderToStaticMarkup(view);

    expect(requireFacilitatorPageAccess).toHaveBeenCalledWith(null);
    expect(getWorkshopState).toHaveBeenCalledTimes(sampleWorkshopInstances.length);
    expect(html).toContain(adminCopy.en.workspaceTitle);
    expect(html).toContain(adminCopy.en.workspaceOpenInstance);
    expect(html).toContain(adminCopy.en.createInstanceEventTitleLabel);
    expect(html).toContain(adminCopy.en.instanceBlueprintSummary);
    expect(html).toContain(adminCopy.en.instanceOwnerPlaceholder);
    expect(html).toContain('type="date"');
    expect(html).toContain("/admin/instances/sample-studio-a?lang=en");
    expect(html).toContain(adminCopy.en.removeInstanceReviewButton);
    expect(html).not.toContain(adminCopy.en.confirmRemoveInstanceButton);
    expect(html).toContain("dashboard-motion-card");
    expect(html).toContain("dashboard-drift");
  });

  it("filters the workspace gallery by query", async () => {
    const { default: AdminWorkspacePage } = await adminPageModulePromise;

    const view = await AdminWorkspacePage({
      searchParams: Promise.resolve({ lang: "en", q: "lab c" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("sample-lab-c");
    expect((html.match(/open control room/g) ?? []).length).toBe(1);
  });

  it("redirects old instance-scoped admin URLs to the new control-room route", async () => {
    const { default: AdminWorkspacePage } = await adminPageModulePromise;

    await AdminWorkspacePage({
      searchParams: Promise.resolve({ lang: "en", instance: "sample-studio-b", section: "signals" }),
    });

    expect(redirect).toHaveBeenCalledWith("/admin/instances/sample-studio-b?lang=en");
  });

  it("renders a confirmation dialog before removing an instance", async () => {
    const { default: AdminWorkspacePage } = await adminPageModulePromise;

    const view = await AdminWorkspacePage({
      searchParams: Promise.resolve({ lang: "en", removeInstance: "sample-studio-a" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.removeInstanceDialogTitle);
    expect(html).toContain(adminCopy.en.removeInstanceArchiveNote);
    expect(html).toContain(adminCopy.en.confirmRemoveInstanceButton);
    expect(html).toContain('name="confirmRemoveInstanceId"');
    expect(html).toContain('value="sample-studio-a"');
  });
});
