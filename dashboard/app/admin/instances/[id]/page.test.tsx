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
const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
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
  }),
}));

vi.mock("@/lib/workshop-store", () => ({
  addAgendaItem: vi.fn(),
  addSprintUpdate: vi.fn(),
  createWorkshopArchive: vi.fn(),
  completeChallenge: vi.fn(),
  getLatestWorkshopArchive,
  getWorkshopState,
  moveAgendaItem: vi.fn(),
  removeAgendaItem: vi.fn(),
  resetWorkshopState: vi.fn(),
  setCurrentAgendaItem: vi.fn(),
  setRotationReveal: vi.fn(),
  updateAgendaItem: vi.fn(),
  upsertTeam: vi.fn(),
}));

const controlRoomPageModulePromise = import("./page");

describe("Admin control room page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listInstances.mockResolvedValue(structuredClone(sampleWorkshopInstances));
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

  it("loads the live control room for the requested instance", async () => {
    const { default: AdminControlRoomPage } = await controlRoomPageModulePromise;

    const view = await AdminControlRoomPage({
      params: Promise.resolve({ id: "sample-studio-b" }),
      searchParams: Promise.resolve({ lang: "en", section: "live" }),
    });
    const html = renderToStaticMarkup(view);

    expect(requireFacilitatorPageAccess).toHaveBeenCalledWith("sample-studio-b");
    expect(getWorkshopState).toHaveBeenCalledWith("sample-studio-b");
    expect(html).toContain(adminCopy.en.controlRoomBack);
    expect(html).toContain(adminCopy.en.navLive);
    expect(html).toContain(adminCopy.en.continuationTitle);
  });

  it("renders the agenda editor sheet for the selected agenda item", async () => {
    const { default: AdminControlRoomPage } = await controlRoomPageModulePromise;

    const view = await AdminControlRoomPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", section: "agenda", agendaItem: "talk", overlay: "agenda-edit" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.agendaEditTitle);
    expect(html).toContain(adminCopy.en.closePanelButton);
    expect(html).toContain('name="agendaId"');
    expect(html).toContain('value="talk"');
    expect(html).toContain('value="Context is King"');
  });

  it("renders team editing in the teams section", async () => {
    const { default: AdminControlRoomPage } = await controlRoomPageModulePromise;

    const view = await AdminControlRoomPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", section: "teams", team: "t3" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.editTeamTitle);
    expect(html).toContain(adminCopy.en.createAnotherTeamLabel);
    expect(html).toContain(adminCopy.en.checkpointChangedLabel);
    expect(html).toContain(adminCopy.en.checkpointVerifiedLabel);
    expect(html).toContain(adminCopy.en.checkpointNextStepLabel);
    expect(html).toContain('value="t3"');
    expect(html).toContain('value="Tým 3"');
    expect(html).toContain("https://github.com/example/code-review-helper");
  });

  it("renders structured evidence fields in the signals section", async () => {
    const { default: AdminControlRoomPage } = await controlRoomPageModulePromise;

    const view = await AdminControlRoomPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", section: "signals" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.signalDescription);
    expect(html).toContain(adminCopy.en.checkpointFormHint);
    expect(html).toContain(adminCopy.en.checkpointChangedLabel);
    expect(html).toContain(adminCopy.en.checkpointVerifiedLabel);
    expect(html).toContain(adminCopy.en.checkpointNextStepLabel);
  });
});
