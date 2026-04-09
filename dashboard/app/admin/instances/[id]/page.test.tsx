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
const getInstance = vi.fn();
const redirect = vi.fn();
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
    getInstance,
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
    getInstance.mockImplementation(async (instanceId: string) =>
      structuredClone(sampleWorkshopInstances.find((instance) => instance.id === instanceId) ?? null),
    );
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

  it("loads the agenda-centered control room for the requested instance", async () => {
    const { default: AdminControlRoomPage } = await controlRoomPageModulePromise;

    const view = await AdminControlRoomPage({
      params: Promise.resolve({ id: "sample-studio-b" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });
    const html = renderToStaticMarkup(view);

    expect(requireFacilitatorPageAccess).toHaveBeenCalledWith("sample-studio-b");
    expect(getWorkshopState).toHaveBeenCalledWith("sample-studio-b");
    expect(html).toContain(adminCopy.en.controlRoomBack);
    expect(html).toContain(adminCopy.en.navAgenda);
    expect(html).toContain(adminCopy.en.agendaSectionTitle);
    expect(html).toContain(adminCopy.en.agendaTimelineTitle);
    expect(html).toContain(adminCopy.en.openAgendaDetailButton);
    expect(html).toContain(adminCopy.en.agendaMoveLiveHereButton);
    expect(html).not.toContain(adminCopy.en.archiveResetTitle);
    expect(html).not.toContain(adminCopy.en.continuationTitle);
    expect(html).not.toContain(adminCopy.en.participantSurfaceRecoveryHint);
  });

  it("shows the handoff control on the default agenda index when rotation is live", async () => {
    const { default: AdminControlRoomPage } = await controlRoomPageModulePromise;
    const state = structuredClone(seedWorkshopState);
    state.agenda = state.agenda.map((item) => ({
      ...item,
      status: item.id === "rotation" ? "current" : "done",
    }));
    const rotation = state.agenda.find((item) => item.id === "rotation");
    if (rotation) {
      delete (rotation as { intent?: string }).intent;
    }
    getWorkshopState.mockResolvedValue(state);

    const view = await AdminControlRoomPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.handoffMomentTitle);
    expect(html).toContain(adminCopy.en.unlockButton);
    expect(html).toContain(adminCopy.en.hideAgainButton);
    expect(html).toContain(adminCopy.en.handoffMomentJumpButton);
    expect(html).toContain("13:30 • Rotace týmů");
  });

  it("renders the agenda editor in a side sheet for the selected agenda item", async () => {
    const { default: AdminControlRoomPage } = await controlRoomPageModulePromise;

    const view = await AdminControlRoomPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", section: "agenda", agendaItem: "talk", overlay: "agenda-edit" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.agendaEditTitle);
    expect(html).toContain(adminCopy.en.closePanelButton);
    expect(html).toContain('fixed inset-0 z-50');
    expect(html).toContain('name="agendaId"');
    expect(html).toContain('value="talk"');
    expect(html).toContain('name="returnTo"');
    expect(html).toContain('value="detail"');
    expect(html).toContain('value="Context is King"');
  });

  it("renders the selected agenda moment as a dedicated detail workbench", async () => {
    const { default: AdminControlRoomPage } = await controlRoomPageModulePromise;

    const view = await AdminControlRoomPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", section: "agenda", agendaItem: "talk" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.agendaTimelineTitle);
    expect(html).toContain(adminCopy.en.presenterOpenParticipantSurfaceButton);
    expect(html).toContain(adminCopy.en.openEditSheetButton);
    expect(html).toContain(adminCopy.en.agendaRunnerTitle);
    expect(html).toContain(adminCopy.en.agendaRunnerSayTitle);
    expect(html).toContain(adminCopy.en.agendaRunnerShowTitle);
    expect(html).toContain(adminCopy.en.agendaDetailSourceMaterialTitle);
    expect(html).toContain(adminCopy.en.participantSurfaceCardTitle);
    expect(html).toContain(adminCopy.en.presenterOpenParticipantButton);
    expect(html).toContain("Context is King");
    expect(html).not.toContain(adminCopy.en.openAgendaDetailButton);
  });

  it("renders the scene editor sheet for the selected presenter scene", async () => {
    const { default: AdminControlRoomPage } = await controlRoomPageModulePromise;

    const view = await AdminControlRoomPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({
        lang: "en",
        section: "agenda",
        agendaItem: "talk",
        scene: "talk-framing",
        overlay: "scene-edit",
      }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.sceneEditTitle);
    expect(html).toContain(adminCopy.en.sceneFieldBlocks);
    expect(html).toContain("Block editor");
    expect(html).toContain("Add block");
    expect(html).toContain(adminCopy.en.presenterSetDefaultSceneButton);
    expect(html).toContain('name="sceneId"');
    expect(html).toContain('value="talk-framing"');
  });

  it("keeps persistent runtime context visible outside the live section", async () => {
    const { default: AdminControlRoomPage } = await controlRoomPageModulePromise;

    const view = await AdminControlRoomPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", section: "agenda", agendaItem: "talk" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.activeInstance);
    expect(html).toContain("sample-studio-a");
    expect(html).toContain(adminCopy.en.currentPhase);
    expect(html).toContain("Build fáze 1");
    expect(html).toContain(adminCopy.en.participantSurfaceCardTitle);
    expect(html).toContain(adminCopy.en.participantStateHidden);
    expect(html).toContain("20-participants");
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

  it("keeps safety actions in settings instead of the live canvas", async () => {
    const { default: AdminControlRoomPage } = await controlRoomPageModulePromise;

    const view = await AdminControlRoomPage({
      params: Promise.resolve({ id: "sample-studio-a" }),
      searchParams: Promise.resolve({ lang: "en", section: "settings" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain(adminCopy.en.participantSurfaceCardTitle);
    expect(html).toContain(adminCopy.en.participantSurfaceRecoveryHint);
    expect(html).toContain(adminCopy.en.unlockButton);
    expect(html).toContain(adminCopy.en.hideAgainButton);
    expect(html).toContain(adminCopy.en.archiveResetTitle);
    expect(html).toContain(adminCopy.en.settingsSafetyEyebrow);
    expect(html).toContain(adminCopy.en.blueprintLinkLabel);
  });
});
