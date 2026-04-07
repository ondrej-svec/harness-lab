import { beforeEach, describe, expect, it, vi } from "vitest";

const getParticipantTeamLookup = vi.fn();
const requireParticipantSession = vi.fn();

vi.mock("@/lib/event-access", () => ({
  getParticipantTeamLookup,
  requireParticipantSession,
}));

const routeModulePromise = import("@/app/api/event-context/teams/route");

describe("GET /api/event-context/teams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects the request when no participant session is present", async () => {
    const { GET } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: false,
      response: new Response("Authentication required", { status: 401 }),
    });

    const response = await GET(new Request("http://localhost/api/event-context/teams"));

    expect(response.status).toBe(401);
    expect(getParticipantTeamLookup).not.toHaveBeenCalled();
  });

  it("returns participant team lookup data for an authorized session", async () => {
    const { GET } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({ ok: true });
    getParticipantTeamLookup.mockResolvedValue({
      items: [{ id: "t1", name: "Team 1" }],
    });

    const response = await GET(new Request("http://localhost/api/event-context/teams"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [{ id: "t1", name: "Team 1" }],
    });
  });
});
