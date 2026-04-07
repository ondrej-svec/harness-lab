import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedWorkshopState } from "@/lib/workshop-data";

const requireFacilitatorRequest = vi.fn();
const getWorkshopState = vi.fn();
const setRotationReveal = vi.fn();

vi.mock("@/lib/facilitator-access", () => ({
  requireFacilitatorRequest,
}));

vi.mock("@/lib/workshop-store", () => ({
  getWorkshopState,
  setRotationReveal,
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
  });

  it("returns the current rotation plan", async () => {
    const { GET } = await routeModulePromise;

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(seedWorkshopState.rotation);
  });

  it("rejects facilitator writes when access is denied", async () => {
    const { PATCH } = await routeModulePromise;
    requireFacilitatorRequest.mockResolvedValue(new Response("Authentication required", { status: 401 }));

    const response = await PATCH(
      new Request("http://localhost/api/rotation", {
        method: "PATCH",
        body: JSON.stringify({ revealed: true }),
      }),
    );

    expect(response.status).toBe(401);
    expect(setRotationReveal).not.toHaveBeenCalled();
  });

  it("validates the revealed payload type", async () => {
    const { PATCH } = await routeModulePromise;
    requireFacilitatorRequest.mockResolvedValue(null);

    const response = await PATCH(
      new Request("http://localhost/api/rotation", {
        method: "PATCH",
        body: JSON.stringify({ revealed: "yes" }),
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
        body: JSON.stringify({ revealed: true }),
      }),
    );

    expect(setRotationReveal).toHaveBeenCalledWith(true);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      rotation: expect.objectContaining({ revealed: true }),
    });
  });
});
