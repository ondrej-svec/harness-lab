import { beforeEach, describe, expect, it, vi } from "vitest";

const requireParticipantSession = vi.fn();
const requireParticipantScopedWrite = vi.fn();
const isParticipantTeamAccessError = vi.fn();
const isTeamModeEnabled = vi.fn();
const appendParticipantCheckIn = vi.fn();
const getWorkshopState = vi.fn();
const findParticipant = vi.fn();

vi.mock("@/lib/event-access", () => ({
  requireParticipantSession,
}));

vi.mock("@/lib/participant-team-access", () => ({
  requireParticipantScopedWrite,
  isParticipantTeamAccessError,
  isTeamModeEnabled,
}));

vi.mock("@/lib/participant-repository", () => ({
  getParticipantRepository: () => ({ findParticipant }),
}));

vi.mock("@/lib/workshop-mutation-response", () => ({
  workshopMutationErrorResponse: (error: Error) =>
    new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 }),
}));

vi.mock("@/lib/workshop-store", () => ({
  appendParticipantCheckIn,
  getWorkshopState,
}));

const routeModulePromise = import("@/app/api/participant/check-in/route");

function buildAuthedSession() {
  return {
    ok: true as const,
    session: {
      instanceId: "sample-studio-a",
      participantId: "p-alice",
    },
  };
}

function buildBody() {
  return {
    phaseId: "opening",
    changed: "rewrote the room surface",
    verified: "replayed the flow end-to-end",
    nextStep: "wire up the feed tab",
  };
}

describe("POST /api/participant/check-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireParticipantSession.mockResolvedValue(buildAuthedSession());
    isTeamModeEnabled.mockResolvedValue(false);
    requireParticipantScopedWrite.mockResolvedValue({ participantId: "p-alice" });
    isParticipantTeamAccessError.mockReturnValue(false);
    appendParticipantCheckIn.mockResolvedValue(undefined);
    getWorkshopState.mockResolvedValue({
      agenda: [{ id: "opening", status: "current" }],
    });
    findParticipant.mockResolvedValue({ displayName: "Alice" });
  });

  it("writes a participant-scoped check-in in participant mode", async () => {
    const { POST } = await routeModulePromise;
    const request = new Request("http://localhost/api/participant/check-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildBody()),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, participantId: "p-alice" });
    expect(appendParticipantCheckIn).toHaveBeenCalledWith(
      "p-alice",
      expect.objectContaining({
        phaseId: "opening",
        writtenBy: "Alice",
        changed: "rewrote the room surface",
        verified: "replayed the flow end-to-end",
        nextStep: "wire up the feed tab",
      }),
      "sample-studio-a",
    );
  });

  it("returns 409 when the instance is in team mode (wrong route)", async () => {
    isTeamModeEnabled.mockResolvedValue(true);
    const { POST } = await routeModulePromise;
    const request = new Request("http://localhost/api/participant/check-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildBody()),
    });
    const response = await POST(request);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: "team_mode_active" });
    expect(appendParticipantCheckIn).not.toHaveBeenCalled();
  });

  it("rejects when participant session is missing", async () => {
    requireParticipantSession.mockResolvedValue({
      ok: false,
      response: new Response("nope", { status: 401 }),
    });
    const { POST } = await routeModulePromise;
    const request = new Request("http://localhost/api/participant/check-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildBody()),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(appendParticipantCheckIn).not.toHaveBeenCalled();
  });

  it("rejects empty structured content with 400", async () => {
    const { POST } = await routeModulePromise;
    const request = new Request("http://localhost/api/participant/check-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phaseId: "opening", changed: "  ", verified: "", nextStep: "" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(appendParticipantCheckIn).not.toHaveBeenCalled();
  });

  it("rejects with 403 when participant identity is missing (scoped-write guard)", async () => {
    requireParticipantScopedWrite.mockRejectedValue(
      Object.assign(new Error("missing"), { code: "participant_identity_required" }),
    );
    isParticipantTeamAccessError.mockReturnValue(true);
    const { POST } = await routeModulePromise;
    const request = new Request("http://localhost/api/participant/check-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildBody()),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "participant_identity_required" });
    expect(appendParticipantCheckIn).not.toHaveBeenCalled();
  });
});
