import { beforeEach, describe, expect, it, vi } from "vitest";

const requireParticipantSession = vi.fn();
const updateTeamFromParticipant = vi.fn();
const isWorkshopStateTargetError = vi.fn();

vi.mock("@/lib/event-access", () => ({
  requireParticipantSession,
}));

vi.mock("@/lib/workshop-store", () => ({
  updateTeamFromParticipant,
  isWorkshopStateTargetError,
}));

const routeModulePromise = import("@/app/api/event-context/teams/[teamId]/route");

describe("PATCH /api/event-context/teams/[teamId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      session: { instanceId: "sample-studio-a" },
    });

    const response = await PATCH(
      new Request("http://localhost/api/event-context/teams/t1", {
        method: "PATCH",
        body: JSON.stringify({ repoUrl: "https://github.com/test/repo" }),
      }),
      { params: Promise.resolve({ teamId: "t1" }) },
    );

    expect(response.status).toBe(200);
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
      session: { instanceId: "sample-studio-a" },
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
      session: { instanceId: "sample-studio-a" },
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
      session: { instanceId: "sample-studio-a" },
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

  it("rejects an empty team name", async () => {
    const { PATCH } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: { instanceId: "sample-studio-a" },
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
      session: { instanceId: "sample-studio-a" },
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
      session: { instanceId: "sample-studio-a" },
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
});
