import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedWorkshopState } from "@/lib/workshop-data";

const getWorkshopState = vi.fn();

vi.mock("@/lib/workshop-store", () => ({
  getWorkshopState,
}));

const routeModulePromise = import("@/app/api/challenges/route");

describe("challenges route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWorkshopState.mockResolvedValue(structuredClone(seedWorkshopState));
  });

  it("returns workshop challenges with storage mode metadata", async () => {
    const { GET } = await routeModulePromise;

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: seedWorkshopState.challenges,
      storageMode: "file",
    });
  });
});
