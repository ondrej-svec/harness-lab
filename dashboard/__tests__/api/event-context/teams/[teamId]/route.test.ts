import { beforeEach, describe, expect, it, vi } from "vitest";

const requireParticipantSession = vi.fn();
const requireParticipantTeamAccess = vi.fn();
const isParticipantTeamAccessError = vi.fn();
const updateTeamFromParticipant = vi.fn();
const isWorkshopStateTargetError = vi.fn();

vi.mock("@/lib/event-access", () => ({
  requireParticipantSession,
}));

vi.mock("@/lib/participant-team-access", () => ({
  requireParticipantTeamAccess,
  isParticipantTeamAccessError,
}));

vi.mock("@/lib/workshop-store", () => ({
  updateTeamFromParticipant,
  isWorkshopStateTargetError,
}));

const routeModulePromise = import("@/app/api/event-context/teams/[teamId]/route");

describe("PATCH /api/event-context/teams/[teamId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireParticipantTeamAccess.mockResolvedValue({ teamId: "t1" });
    isParticipantTeamAccessError.mockReturnValue(false);
    updateTeamFromParticipant.mockResolvedValue({});
    isWorkshopStateTargetError.mockReturnValue(false);
  });

  it("rejects the request when no participant session is present", async () => {
    const { PATCH } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: false,
      response: new Response("Authentication required", { status: 401 }),
    });

    const response = await PATCH(
      new Request("http://localhost/api/event-context/teams/t1", {
        method: "PATCH",
        body: JSON.stringify({ repoUrl: "https://github.com/test/repo" }),
      }),
      { params: Promise.resolve({ teamId: "t1" }) },
    );

    expect(response.status).toBe(401);
    expect(updateTeamFromParticipant).not.toHaveBeenCalled();
  });

  it("updates the repo URL for a valid participant session", async () => {
    const { PATCH } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: { instanceId: "sample-studio-a", participantId: "p1" },
    });

    const response = await PATCH(
      new Request("http://localhost/api/event-context/teams/t1", {
        method: "PATCH",
        body: JSON.stringify({ repoUrl: "https://github.com/test/repo" }),
      }),
      { params: Promise.resolve({ teamId: "t1" }) },
    );

    expect(response.status).toBe(200);
    expect(requireParticipantTeamAccess).toHaveBeenCalledWith({
      instanceId: "sample-studio-a",
      participantId: "p1",
      teamId: "t1",
    });
    expect(updateTeamFromParticipant).toHaveBeenCalledWith(
      "t1",
      { repoUrl: "https://github.com/test/repo" },
      "sample-studio-a",
    );
  });

  it("updates team name for a valid participant session", async () => {
    const { PATCH } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: { instanceId: "sample-studio-a", participantId: "p1" },
    });

    const response = await PATCH(
      new Request("http://localhost/api/event-context/teams/t1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Robotníci" }),
      }),
      { params: Promise.resolve({ teamId: "t1" }) },
    );

    expect(response.status).toBe(200);
    expect(updateTeamFromParticipant).toHaveBeenCalledWith(
      "t1",
      { name: "Robotníci" },
      "sample-studio-a",
    );
  });

  it("updates members for a valid participant session", async () => {
    const { PATCH } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: { instanceId: "sample-studio-a", participantId: "p1" },
    });

    const response = await PATCH(
      new Request("http://localhost/api/event-context/teams/t1", {
        method: "PATCH",
        body: JSON.stringify({ members: ["Anna", "David", "Eva"] }),
      }),
      { params: Promise.resolve({ teamId: "t1" }) },
    );

    expect(response.status).toBe(200);
    expect(updateTeamFromParticipant).toHaveBeenCalledWith(
      "t1",
      { members: ["Anna", "David", "Eva"] },
      "sample-studio-a",
    );
  });

  it("rejects an invalid repo URL", async () => {
    const { PATCH } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: { instanceId: "sample-studio-a", participantId: "p1" },
    });

    const response = await PATCH(
      new Request("http://localhost/api/event-context/teams/t1", {
        method: "PATCH",
        body: JSON.stringify({ repoUrl: "not-a-url" }),
      }),
      { params: Promise.resolve({ teamId: "t1" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "repoUrl must be a valid URL" });
  });

  it("rejects an unsafe repo URL scheme", async () => {
    const { PATCH } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: { instanceId: "sample-studio-a", participantId: "p1" },
    });

    const response = await PATCH(
      new Request("http://localhost/api/event-context/teams/t1", {
        method: "PATCH",
        body: JSON.stringify({ repoUrl: "javascript:alert(1)" }),
      }),
      { params: Promise.resolve({ teamId: "t1" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "repoUrl must use https unless it points to localhost",
    });
    expect(requireParticipantTeamAccess).not.toHaveBeenCalled();
  });

  it("rejects an empty team name", async () => {
    const { PATCH } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: { instanceId: "sample-studio-a", participantId: "p1" },
    });

    const response = await PATCH(
      new Request("http://localhost/api/event-context/teams/t1", {
        method: "PATCH",
        body: JSON.stringify({ name: "  " }),
      }),
      { params: Promise.resolve({ teamId: "t1" }) },
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when the team does not exist", async () => {
    const { PATCH } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: { instanceId: "sample-studio-a", participantId: "p1" },
    });
    const targetError = new Error("team 'nonexistent' not found");
    updateTeamFromParticipant.mockRejectedValue(targetError);
    isWorkshopStateTargetError.mockReturnValue(true);

    const response = await PATCH(
      new Request("http://localhost/api/event-context/teams/nonexistent", {
        method: "PATCH",
        body: JSON.stringify({ repoUrl: "https://github.com/test/repo" }),
      }),
      { params: Promise.resolve({ teamId: "nonexistent" }) },
    );

    expect(response.status).toBe(404);
  });

  it("rejects requests with no valid fields", async () => {
    const { PATCH } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: { instanceId: "sample-studio-a", participantId: "p1" },
    });

    const response = await PATCH(
      new Request("http://localhost/api/event-context/teams/t1", {
        method: "PATCH",
        body: JSON.stringify({ unknownField: "value" }),
      }),
      { params: Promise.resolve({ teamId: "t1" }) },
    );

    expect(response.status).toBe(400);
  });

  it("returns 403 when the participant targets another team", async () => {
    const { PATCH } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: { instanceId: "sample-studio-a", participantId: "p1" },
    });
    requireParticipantTeamAccess.mockRejectedValue({ code: "team_forbidden" });
    isParticipantTeamAccessError.mockReturnValue(true);

    const response = await PATCH(
      new Request("http://localhost/api/event-context/teams/t2", {
        method: "PATCH",
        body: JSON.stringify({ name: "Cross-team rename" }),
      }),
      { params: Promise.resolve({ teamId: "t2" }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "team_forbidden" });
    expect(updateTeamFromParticipant).not.toHaveBeenCalled();
  });
});
