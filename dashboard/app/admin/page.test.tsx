import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { adminCopy } from "@/lib/ui-language";
import { sampleWorkshopInstances, seedWorkshopState } from "@/lib/workshop-data";

const requireFacilitatorActionAccess = vi.fn();
const requireFacilitatorPageAccess = vi.fn();
const getFacilitatorSession = vi.fn();
const getWorkshopState = vi.fn();
const getLatestWorkshopArchive = vi.fn();
const getRuntimeStorageMode = vi.fn();
const listActiveGrants = vi.fn();
const getSession = vi.fn();
const listInstances = vi.fn();
const getDefaultInstanceId = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/facilitator-access", () => ({
  requireFacilitatorActionAccess,
  requireFacilitatorPageAccess,
}));

vi.mock("@/lib/auth/server", () => ({
  auth: {
    getSession,
    signOut: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock("@/lib/instance-grant-repository", () => ({
  getInstanceGrantRepository: () => ({
    listActiveGrants,
    getActiveGrantByNeonUserId: vi.fn(),
    createGrant: vi.fn(),
    revokeGrant: vi.fn(),
  }),
}));

vi.mock("@/lib/facilitator-session", () => ({
  getFacilitatorSession,
}));

vi.mock("@/lib/runtime-storage", () => ({
  getRuntimeStorageMode,
}));

vi.mock("@/lib/neon-db", () => ({
  getNeonSql: vi.fn(),
}));

vi.mock("@/lib/audit-log-repository", () => ({
  getAuditLogRepository: () => ({
    append: vi.fn(),
  }),
}));

vi.mock("@/lib/workshop-instance-repository", () => ({
  getWorkshopInstanceRepository: () => ({
    listInstances,
    getDefaultInstanceId,
  }),
}));

vi.mock("@/lib/workshop-store", () => ({
  addAgendaItem: vi.fn(),
  addSprintUpdate: vi.fn(),
  createWorkshopInstance: vi.fn(),
  completeChallenge: vi.fn(),
  createWorkshopArchive: vi.fn(),
  getLatestWorkshopArchive,
  getWorkshopState,
  moveAgendaItem: vi.fn(),
  removeAgendaItem: vi.fn(),
  removeWorkshopInstance: vi.fn(),
  resetWorkshopState: vi.fn(),
  setCurrentAgendaItem: vi.fn(),
  setRotationReveal: vi.fn(),
  updateAgendaItem: vi.fn(),
  upsertTeam: vi.fn(),
}));

const adminPageViewModelPromise = import("@/lib/admin-page-view-model");
const adminPageModulePromise = import("./page");

describe("admin page helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts only known admin sections", async () => {
    const { resolveAdminSection } = await adminPageViewModelPromise;

    expect(resolveAdminSection("teams")).toBe("teams");
    expect(resolveAdminSection("unknown")).toBe("overview");
    expect(resolveAdminSection(undefined)).toBe("overview");
  });

  it("builds instance-scoped admin links and preserves errors", async () => {
    const { buildAdminHref } = await adminPageViewModelPromise;

    expect(buildAdminHref({ lang: "cs" })).toBe("/admin");
    expect(
      buildAdminHref({
        lang: "en",
        section: "signals",
        instanceId: "sample-studio-b",
        error: "password_mismatch",
      }),
    ).toBe("/admin?section=signals&instance=sample-studio-b&error=password_mismatch&lang=en");
  });

  it("reads trimmed action state from form data", async () => {
    const { readActionState } = await adminPageViewModelPromise;
    const formData = new FormData();
    formData.set("lang", "en");
    formData.set("section", "access");
    formData.set("instanceId", "  sample-studio-c  ");

    expect(readActionState(formData)).toEqual({
      lang: "en",
      section: "access",
      instanceId: "sample-studio-c",
    });
  });

  it("derives the overview state for the selected instance", async () => {
    const { deriveAdminPageState, buildAdminSummaryStats, buildAdminOverviewState, buildAdminSessionState, resolveActiveInstanceId } =
      await adminPageViewModelPromise;
    const state = structuredClone(seedWorkshopState);

    expect(deriveAdminPageState(state, sampleWorkshopInstances, "sample-studio-b")).toMatchObject({
      currentAgendaItem: state.agenda.find((item) => item.status === "current"),
      nextAgendaItem: state.agenda.find((item) => item.status === "upcoming"),
      selectedInstance: sampleWorkshopInstances[1],
    });
    expect(resolveActiveInstanceId(sampleWorkshopInstances, "missing", "sample-studio-a")).toBe("sample-studio-a");
    expect(
      buildAdminSummaryStats({
        copy: adminCopy.cs,
        state,
        selectedInstance: sampleWorkshopInstances[0],
        currentAgendaItem: state.agenda[0],
      }),
    ).toHaveLength(4);
    expect(
      buildAdminOverviewState({
        copy: adminCopy.en,
        lang: "en",
        state,
        activeInstanceId: "sample-studio-a",
        currentAgendaItem: state.agenda[0],
        nextAgendaItem: state.agenda[1],
      }).nextUpLabel,
    ).toContain(state.agenda[1].title);
    expect(
      buildAdminOverviewState({
        copy: adminCopy.en,
        lang: "cs",
        state,
        activeInstanceId: "sample-studio-a",
        currentAgendaItem: undefined,
        nextAgendaItem: null,
      }),
    ).toMatchObject({
      nextUpLabel: null,
      participantState: adminCopy.en.participantStateHidden,
    });
    expect(
      buildAdminSessionState({
        copy: adminCopy.en,
        signedInEmail: "facilitator@example.com",
        signedInName: "Facilitator",
        currentRole: "owner",
        latestArchive: { createdAt: "2026-04-06T12:00:00.000Z", retentionUntil: null },
      }).signedInLine,
    ).toContain("Facilitator");
    expect(
      buildAdminSessionState({
        copy: adminCopy.cs,
        signedInEmail: null,
        signedInName: null,
        currentRole: null,
        latestArchive: null,
      }),
    ).toEqual({
      signedInLine: null,
      archiveLine: null,
    });
  });
});

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listInstances.mockResolvedValue(structuredClone(sampleWorkshopInstances));
    getDefaultInstanceId.mockResolvedValue("sample-studio-a");
    requireFacilitatorPageAccess.mockResolvedValue(undefined);
    getRuntimeStorageMode.mockReturnValue("file");
    getWorkshopState.mockResolvedValue(structuredClone(seedWorkshopState));
    getLatestWorkshopArchive.mockResolvedValue({
      createdAt: "2026-04-06T12:00:00.000Z",
      retentionUntil: "2026-04-20T12:00:00.000Z",
    });
    getFacilitatorSession.mockResolvedValue(null);
    listActiveGrants.mockResolvedValue([]);
    getSession.mockResolvedValue({ data: null });
  });

  it("loads the overview using the requested instance when available", async () => {
    const { default: AdminPage } = await adminPageModulePromise;

    const view = await AdminPage({
      searchParams: Promise.resolve({ lang: "en", section: "overview", instance: "sample-studio-b" }),
    });

    expect(view).toBeTruthy();
    expect(requireFacilitatorPageAccess).toHaveBeenCalledWith("sample-studio-b");
    expect(getWorkshopState).toHaveBeenCalledWith("sample-studio-b");
  });

  it("renders instance-management controls and the selected agenda item editor", async () => {
    const { default: AdminPage } = await adminPageModulePromise;

    const view = await AdminPage({
      searchParams: Promise.resolve({ lang: "en", section: "agenda", instance: "sample-studio-a", agendaItem: "talk" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.createInstanceTitle);
    expect(html).toContain(adminCopy.en.removeInstanceTitle);
    expect(html).toContain(adminCopy.en.agendaEditTitle);
    expect(html).toContain('name="agendaId"');
    expect(html).toContain('value="talk"');
    expect(html).toContain('value="Context is King"');
  });

  it("renders team-first editing with the selected team prefilled", async () => {
    const { default: AdminPage } = await adminPageModulePromise;

    const view = await AdminPage({
      searchParams: Promise.resolve({ lang: "en", section: "teams", instance: "sample-studio-a", team: "t3" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.editTeamTitle);
    expect(html).toContain(adminCopy.en.createAnotherTeamLabel);
    expect(html).toContain('name="id"');
    expect(html).toContain('value="t3"');
    expect(html).toContain('value="Tým 3"');
    expect(html).toContain("https://github.com/example/code-review-helper");
    expect(html).toContain("Adam, Barbora, Filip, Lenka");
  });

  it("falls back to the default instance when the query instance is unknown", async () => {
    const { default: AdminPage } = await adminPageModulePromise;

    const view = await AdminPage({
      searchParams: Promise.resolve({ lang: "cs", section: "agenda", instance: "missing-instance" }),
    });

    expect(view).toBeTruthy();
    expect(requireFacilitatorPageAccess).toHaveBeenCalledWith("sample-studio-a");
    expect(getWorkshopState).toHaveBeenCalledWith("sample-studio-a");
  });
});
