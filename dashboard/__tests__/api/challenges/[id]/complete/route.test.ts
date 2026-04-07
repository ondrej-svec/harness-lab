import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedWorkshopState } from "@/lib/workshop-data";

const requireFacilitatorRequest = vi.fn();
const completeChallenge = vi.fn();

vi.mock("@/lib/facilitator-access", () => ({
  requireFacilitatorRequest,
}));

vi.mock("@/lib/workshop-store", () => ({
  completeChallenge,
}));

const routeModulePromise = import("@/app/api/challenges/[id]/complete/route");

describe("challenge completion route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireFacilitatorRequest.mockResolvedValue(null);
  });

  it("returns facilitator denial responses unchanged", async () => {
    const { POST } = await routeModulePromise;
    requireFacilitatorRequest.mockResolvedValue(new Response("Authentication required", { status: 401 }));

    const response = await POST(
      new Request("http://localhost/api/challenges/c1/complete", { method: "POST" }) as any,
      { params: Promise.resolve({ id: "c1" }) },
    );

    expect(response.status).toBe(401);
    expect(completeChallenge).not.toHaveBeenCalled();
  });

  it("requires a team id in the request body", async () => {
    const { POST } = await routeModulePromise;

    const response = await POST(
      new Request("http://localhost/api/challenges/c1/complete", {
        method: "POST",
        body: JSON.stringify({}),
      }) as any,
      { params: Promise.resolve({ id: "c1" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Pole teamId je povinné.",
    });
  });

  it("returns 404 when the completed challenge cannot be found", async () => {
    const { POST } = await routeModulePromise;
    completeChallenge.mockResolvedValue({
      ...structuredClone(seedWorkshopState),
      challenges: [],
    });

    const response = await POST(
      new Request("http://localhost/api/challenges/c1/complete", {
        method: "POST",
        body: JSON.stringify({ teamId: "t1" }),
      }) as any,
      { params: Promise.resolve({ id: "c1" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Challenge nebyla nalezena.",
    });
  });

  it("returns the persisted completion payload when successful", async () => {
    const { POST } = await routeModulePromise;
    const challenge = { ...seedWorkshopState.challenges[0], id: "c1", completedBy: ["t2"] };
    completeChallenge.mockResolvedValue({
      ...structuredClone(seedWorkshopState),
      challenges: [challenge],
    });

    const response = await POST(
      new Request("http://localhost/api/challenges/c1/complete", {
        method: "POST",
        body: JSON.stringify({ teamId: "t2" }),
      }) as any,
      { params: Promise.resolve({ id: "c1" }) },
    );

    expect(completeChallenge).toHaveBeenCalledWith("c1", "t2");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      persisted: true,
      challengeId: "c1",
      completedBy: ["t2"],
    });
  });
});
