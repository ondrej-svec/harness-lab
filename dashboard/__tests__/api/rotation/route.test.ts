import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedWorkshopState } from "@/lib/workshop-data";

const requireFacilitatorRequest = vi.fn();
const requireParticipantSession = vi.fn();
const getWorkshopState = vi.fn();
const setRotationReveal = vi.fn();

vi.mock("@/lib/facilitator-access", () => ({
  requireFacilitatorRequest,
}));

vi.mock("@/lib/event-access", () => ({
  requireParticipantSession,
  participantSessionCookieName: "harness_event_session",
}));

vi.mock("@/lib/workshop-store", () => ({
  getWorkshopState,
  setRotationReveal,
  isWorkshopStateConflictError: (error: unknown) =>
    error instanceof Error && error.name === "WorkshopStateConflictError",
  isWorkshopStateTargetError: () => false,
}));

const routeModulePromise = import("@/app/api/rotation/route");

describe("rotation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWorkshopState.mockResolvedValue(structuredClone(seedWorkshopState));
    setRotationReveal.mockResolvedValue({
      ...structuredClone(seedWorkshopState),
      rotation: {
        ...structuredClone(seedWorkshopState.rotation),
        revealed: true,
      },
    });
    requireParticipantSession.mockResolvedValue({
      ok: true,
      session: {
        instanceId: "sample-studio-a",
        expiresAt: "2099-01-01T00:00:00.000Z",
        lastValidatedAt: "2026-04-06T12:00:00.000Z",
        absoluteExpiresAt: "2099-01-01T00:00:00.000Z",
        participantId: null,
      },
    });
  });

  it("returns 401 when no participant session", async () => {
    const { GET } = await routeModulePromise;
    requireParticipantSession.mockResolvedValue({
      ok: false,
      response: new Response("Authentication required", { status: 401 }),
    });

    const response = await GET(new Request("http://localhost/api/rotation"));
    expect(response.status).toBe(401);
  });

  it("returns the current rotation plan for an authenticated participant", async () => {
    const { GET } = await routeModulePromise;

    const response = await GET(new Request("http://localhost/api/rotation"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(seedWorkshopState.rotation);
  });

  it("rejects facilitator writes when access is denied", async () => {
    const { PATCH } = await routeModulePromise;
    requireFacilitatorRequest.mockResolvedValue(new Response("Authentication required", { status: 401 }));

    const response = await PATCH(
      new Request("http://localhost/api/rotation", {
        method: "PATCH",
        body: JSON.stringify({ revealed: true, instanceId: "sample-studio-a" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(setRotationReveal).not.toHaveBeenCalled();
  });

  it("rejects PATCH without instanceId", async () => {
    const { PATCH } = await routeModulePromise;

    const response = await PATCH(
      new Request("http://localhost/api/rotation", {
        method: "PATCH",
        body: JSON.stringify({ revealed: true }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("validates the revealed payload type", async () => {
    const { PATCH } = await routeModulePromise;
    requireFacilitatorRequest.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/rotation", {
        method: "PATCH",
        body: JSON.stringify({ revealed: "yes", instanceId: "sample-studio-a" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "revealed must be a boolean",
    });
  });

  it("updates the rotation visibility for authorized facilitator writes", async () => {
    const { PATCH } = await routeModulePromise;
    requireFacilitatorRequest.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/rotation", {
        method: "PATCH",
        body: JSON.stringify({ revealed: true, instanceId: "sample-studio-a" }),
      }),
    );

    expect(setRotationReveal).toHaveBeenCalledWith(true, "sample-studio-a");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      rotation: expect.objectContaining({ revealed: true }),
    });
  });

  it("returns a retryable conflict response when the workshop state changes first", async () => {
    const { PATCH } = await routeModulePromise;
    requireFacilitatorRequest.mockResolvedValue(null);
    const conflict = new Error("stale");
    conflict.name = "WorkshopStateConflictError";
    setRotationReveal.mockRejectedValue(conflict);

    const response = await PATCH(
      new Request("http://localhost/api/rotation", {
        method: "PATCH",
        body: JSON.stringify({ revealed: true, instanceId: "sample-studio-a" }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "workshop_state_conflict",
    });
  });
});
