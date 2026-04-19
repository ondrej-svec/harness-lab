import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWorkshopStateFromTemplate } from "@/lib/workshop-data";

const getParticipantSessionFromCookieStore = vi.fn();
const getParticipantTeamLookup = vi.fn();
const getWorkshopState = vi.fn();
const findMemberByParticipant = vi.fn();
const findParticipant = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const redirectError = new Error("NEXT_REDIRECT");
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => { throw redirectError; }),
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/event-access", () => ({
  getParticipantSessionFromCookieStore,
  getParticipantTeamLookup,
  participantSessionCookieName: "participant-session",
  revokeParticipantSession: vi.fn(),
}));

vi.mock("@/lib/workshop-store", () => ({
  getWorkshopState,
}));

vi.mock("@/lib/participant-repository", () => ({
  getParticipantRepository: () => ({
    findParticipant,
  }),
}));

vi.mock("@/lib/team-member-repository", () => ({
  getTeamMemberRepository: () => ({
    findMemberByParticipant,
  }),
}));

describe("ParticipantPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_HARNESS_REPO_URL;
    delete process.env.NEXT_PUBLIC_HARNESS_REPO_BRANCH;
    findMemberByParticipant.mockResolvedValue(null);
    findParticipant.mockResolvedValue({ id: "p1", displayName: "Test Participant" });
  });

  it("redirects to / when no participant session exists", async () => {
    const { redirect } = await import("next/navigation");
    const { default: ParticipantPage } = await import("./page");
    getParticipantSessionFromCookieStore.mockResolvedValue(null);

    await expect(
      ParticipantPage({ searchParams: Promise.resolve({ lang: "en" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/?lang=en");
  });

  it("renders the participant room view with workshop context", async () => {
    process.env.NEXT_PUBLIC_HARNESS_REPO_URL = "https://github.com/example/harness-lab";
    const { default: ParticipantPage } = await import("./page");
    const state = createWorkshopStateFromTemplate("blueprint-default", "sample-studio-a", "cs");
    state.agenda = state.agenda.map((item, index) => ({
      ...item,
      status: item.id === "build-1" ? "current" : index < 3 ? "done" : "upcoming",
    }));
    getWorkshopState.mockResolvedValue(state);
    getParticipantTeamLookup.mockResolvedValue({
      items: state.teams.slice(0, 2),
    });
    getParticipantSessionFromCookieStore.mockResolvedValue({
      instanceId: "sample-studio-a",
      expiresAt: "2026-04-06T16:30:00.000Z",
      lastValidatedAt: "2026-04-06T10:30:00.000Z",
      absoluteExpiresAt: "2026-04-06T20:30:00.000Z",
      participantId: "p1",
    });

    const view = await ParticipantPage({
      searchParams: Promise.resolve({ lang: "cs" }),
    });
    const html = renderToStaticMarkup(view);

    expect(view).toBeTruthy();
    expect(getWorkshopState).toHaveBeenCalledWith("sample-studio-a");
    expect(getParticipantTeamLookup).toHaveBeenCalledWith("sample-studio-a");
    expect(html).toContain("participant plocha");
    expect(html).toContain("opustit kontext místnosti");
    expect(html).toContain("dashboard-motion-card");
    expect(html).toMatch(/view-transition-name:\s*room-access/);
    expect(html).toContain("Srovnejte si zadání. Otevřete repo. Sepište první mapu.");
    expect(html).toContain("připravená zadání pro tuto místnost");
    expect(html).toContain("fallback při setupu");
    expect(html).toContain("live feed checkpointů");
    expect(html).toContain("reference");
  });

  it("renders the self-identify prompt when the session has no participantId", async () => {
    const { default: ParticipantPage } = await import("./page");
    getParticipantSessionFromCookieStore.mockResolvedValue({
      instanceId: "sample-studio-a",
      expiresAt: "2026-04-06T16:30:00.000Z",
      lastValidatedAt: "2026-04-06T10:30:00.000Z",
      absoluteExpiresAt: "2026-04-06T20:30:00.000Z",
      participantId: null,
    });

    const view = await ParticipantPage({
      searchParams: Promise.resolve({ lang: "en" }),
    });
    const html = renderToStaticMarkup(view);

    expect(html).toContain("What&#x27;s your name?");
    expect(html).toContain("Continue");
    expect(getWorkshopState).not.toHaveBeenCalled();
    expect(getParticipantTeamLookup).not.toHaveBeenCalled();
  });

  it("renders English participant guidance for an English-content workshop instance", async () => {
    const { default: ParticipantPage } = await import("./page");
    const state = createWorkshopStateFromTemplate("blueprint-default", "sample-studio-a", "en");
    getWorkshopState.mockResolvedValue(state);
    getParticipantTeamLookup.mockResolvedValue({ items: state.teams.slice(0, 2) });
    getParticipantSessionFromCookieStore.mockResolvedValue({
      instanceId: "sample-studio-a",
      expiresAt: "2026-04-06T16:30:00.000Z",
      lastValidatedAt: "2026-04-06T10:30:00.000Z",
      absoluteExpiresAt: "2026-04-06T20:30:00.000Z",
      participantId: "p1",
    });

    const view = await ParticipantPage({
      searchParams: Promise.resolve({ lang: "en" }),
    });
    const html = renderToStaticMarkup(view);

    expect(getWorkshopState).toHaveBeenCalledWith("sample-studio-a");
    expect(html).toContain("Opening and orientation");
    expect(html).toContain("Experience line + team formation");
    expect(html).toContain("Form the line. Count off. Claim your anchor.");
    expect(html).not.toContain("Agree on the brief. Open the repo. Draft the first map.");
  });
});
