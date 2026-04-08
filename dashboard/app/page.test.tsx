import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicCopy } from "@/lib/ui-language";
import { seedWorkshopState } from "@/lib/workshop-data";

const getConfiguredEventCode = vi.fn();
const getParticipantSessionFromCookieStore = vi.fn();
const getParticipantTeamLookup = vi.fn();
const getWorkshopState = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/event-access", () => ({
  getConfiguredEventCode,
  getParticipantSessionFromCookieStore,
  getParticipantTeamLookup,
  participantSessionCookieName: "participant-session",
  redeemEventCode: vi.fn(),
  revokeParticipantSession: vi.fn(),
}));

vi.mock("@/lib/workshop-store", () => ({
  getWorkshopState,
}));

const publicPageViewModelPromise = import("@/lib/public-page-view-model");

describe("public page helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derives the current and next agenda items with only the first three public notes", async () => {
    const { deriveHomePageState } = await publicPageViewModelPromise;
    const state = structuredClone(seedWorkshopState);
    state.agenda = [
      { ...state.agenda[0], status: "done" },
      { ...state.agenda[1], status: "current" },
      { ...state.agenda[2], status: "upcoming" },
    ];
    state.ticker = [
      { id: "1", label: "one", tone: "info" },
      { id: "2", label: "two", tone: "signal" },
      { id: "3", label: "three", tone: "highlight" },
      { id: "4", label: "four", tone: "info" },
    ];

    expect(deriveHomePageState(state)).toMatchObject({
      currentAgendaItem: state.agenda[1],
      nextAgendaItem: state.agenda[2],
      participantNotes: state.ticker.slice(0, 3),
      rotationRevealed: state.rotation.revealed,
    });
  });

  it("falls back to the first agenda item when none is marked current", async () => {
    const { deriveHomePageState } = await publicPageViewModelPromise;
    const state = structuredClone(seedWorkshopState);
    state.agenda = state.agenda.map((item, index) => ({
      ...item,
      status: index === 0 ? "done" : "upcoming",
    }));

    expect(deriveHomePageState(state).currentAgendaItem).toEqual(state.agenda[0]);
  });

  it("maps known event access errors and falls back for unknown ones", async () => {
    const { formatEventAccessError } = await publicPageViewModelPromise;

    expect(formatEventAccessError("invalid_code", publicCopy.en)).toBe(publicCopy.en.invalidCode);
    expect(formatEventAccessError("expired_code", publicCopy.en)).toBe(publicCopy.en.expiredCode);
    expect(formatEventAccessError("anything-else", publicCopy.en)).toBe(publicCopy.en.unknownCodeError);
  });

  it("formats participant session expiry in the requested locale", async () => {
    const { formatDateTime } = await publicPageViewModelPromise;
    const value = "2026-04-06T10:30:00.000Z";

    expect(formatDateTime(value, "en")).toContain("2026");
    expect(formatDateTime(value, "cs")).toContain("2026");
    expect(formatDateTime(value, "en")).not.toEqual(formatDateTime(value, "cs"));
  });

  it("builds participant and public header navigation from state", async () => {
    const {
      buildParticipantPanelState,
      buildParticipantTeamCards,
      buildPublicAccessPanelState,
      buildPublicFooterLinks,
      buildSharedRoomNotes,
      buildSiteHeaderNavLinks,
      getBlueprintRepoUrl,
      getPublicRepoUrl,
    } = await publicPageViewModelPromise;

    expect(buildSiteHeaderNavLinks({ isParticipant: true, lang: "en", copy: publicCopy.en }).map((item) => item.label)).toEqual([
      publicCopy.en.navRoom,
      publicCopy.en.navTeams,
      publicCopy.en.navNotes,
      publicCopy.en.navFacilitatorLogin,
    ]);
    expect(buildPublicFooterLinks("cs", publicCopy.cs).map((item) => item.label)).toContain(publicCopy.cs.footerBlueprint);
    expect(getBlueprintRepoUrl()).toContain("workshop-blueprint");
    expect(getPublicRepoUrl()).toContain("harness-lab");
    expect(
      buildPublicAccessPanelState({
        configuredEventCode: null,
        eventAccessError: undefined,
        copy: publicCopy.en,
      }),
    ).toEqual({
      eventCodeDefaultValue: "",
      showSampleHint: false,
      errorMessage: null,
    });

    expect(
      buildParticipantPanelState({
        copy: publicCopy.en,
        lang: "en",
        currentAgendaItem: seedWorkshopState.agenda[0],
        nextAgendaItem: seedWorkshopState.agenda[1],
        participantSession: {
          token: "session-token",
          instanceId: "sample-studio-a",
          expiresAt: "2026-04-06T16:30:00.000Z",
          lastValidatedAt: "2026-04-06T10:30:00.000Z",
        },
        rotationRevealed: false,
      }).body,
    ).toBe(publicCopy.en.participantBodyHidden);
    const buildPhasePanel = buildParticipantPanelState({
      copy: publicCopy.cs,
      lang: "cs",
      currentAgendaItem: seedWorkshopState.agenda.find((item) => item.id === "build-1"),
      nextAgendaItem: seedWorkshopState.agenda.find((item) => item.id === "intermezzo-1"),
      participantSession: {
        token: "session-token",
        instanceId: "sample-studio-a",
        expiresAt: "2026-04-06T16:30:00.000Z",
        lastValidatedAt: "2026-04-06T10:30:00.000Z",
      },
      rotationRevealed: false,
    });
    expect(buildPhasePanel.guidanceLabel).toBe("Participant board");
    expect(buildPhasePanel.guidanceBlocks.some((block) => block.type === "participant-preview")).toBe(true);
    expect(buildPhasePanel.guidanceBlocks.some((block) => block.type === "hero")).toBe(true);
    const customFallbackAgendaItem = {
      ...seedWorkshopState.agenda[0]!,
      id: "custom-fallback",
      title: "Custom fallback",
      presenterScenes: seedWorkshopState.agenda[0]!.presenterScenes.filter((scene) => scene.sceneType !== "participant-view"),
    };
    const fallbackPanel = buildParticipantPanelState({
      copy: publicCopy.en,
      lang: "en",
      currentAgendaItem: customFallbackAgendaItem,
      nextAgendaItem: seedWorkshopState.agenda.find((item) => item.id === "talk"),
      participantSession: {
        token: "session-token",
        instanceId: "sample-studio-a",
        expiresAt: "2026-04-06T16:30:00.000Z",
        lastValidatedAt: "2026-04-06T10:30:00.000Z",
      },
      rotationRevealed: false,
    });
    expect(fallbackPanel.guidanceLabel).toBe(publicCopy.en.participantGuidanceFallbackLabel);
    expect(fallbackPanel.guidanceBlocks.some((block) => block.type === "participant-preview")).toBe(true);
    expect(fallbackPanel.guidanceBlocks.some((block) => block.type === "bullet-list")).toBe(true);
    expect(buildParticipantTeamCards(null)).toEqual([]);
    expect(buildSharedRoomNotes(seedWorkshopState.ticker)).toEqual(seedWorkshopState.ticker.map((item) => item.label));
  });
});

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWorkshopState.mockResolvedValue(structuredClone(seedWorkshopState));
    getConfiguredEventCode.mockResolvedValue({
      isSample: true,
      sampleCode: "lantern8-context4-handoff2",
    });
    getParticipantTeamLookup.mockResolvedValue({
      items: structuredClone(seedWorkshopState.teams.slice(0, 2)),
    });
  });

  it("returns the public overview when no participant session exists", async () => {
    const { default: HomePage } = await import("./page");
    getParticipantSessionFromCookieStore.mockResolvedValue(null);

    const view = await HomePage({
      searchParams: Promise.resolve({ lang: "en", eventAccess: "invalid_code" }),
    });

    expect(view).toBeTruthy();
    expect(getConfiguredEventCode).toHaveBeenCalledTimes(1);
    expect(getParticipantTeamLookup).not.toHaveBeenCalled();
  });

  it("returns the participant room view when a participant session exists", async () => {
    const { default: HomePage } = await import("./page");
    getParticipantSessionFromCookieStore.mockResolvedValue({
      token: "session-token",
      expiresAt: "2026-04-06T16:30:00.000Z",
    });

    const view = await HomePage({
      searchParams: Promise.resolve({ lang: "cs" }),
    });

    expect(view).toBeTruthy();
    expect(getParticipantTeamLookup).toHaveBeenCalledTimes(1);
  });
});
