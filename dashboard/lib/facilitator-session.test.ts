import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const getActiveGrantByNeonUserId = vi.fn();
const getRuntimeStorageMode = vi.fn();

vi.mock("./auth/server", () => ({
  auth: {
    getSession,
  },
}));

vi.mock("./instance-grant-repository", () => ({
  getInstanceGrantRepository: () => ({
    getActiveGrantByNeonUserId,
  }),
}));

vi.mock("./instance-context", () => ({
  getCurrentWorkshopInstanceId: () => "sample-studio-a",
}));

vi.mock("./runtime-storage", () => ({
  getRuntimeStorageMode,
}));

const facilitatorSessionModulePromise = import("./facilitator-session");

describe("facilitator-session", () => {
  const originalBaseUrl = process.env.NEON_AUTH_BASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEON_AUTH_BASE_URL = "https://auth.example.com";
    getRuntimeStorageMode.mockReturnValue("neon");
  });

  it("returns null outside neon mode", async () => {
    const { getFacilitatorSession } = await facilitatorSessionModulePromise;
    getRuntimeStorageMode.mockReturnValue("file");

    await expect(getFacilitatorSession()).resolves.toBeNull();
  });

  it("returns null when neon auth is not configured", async () => {
    const { getFacilitatorSession } = await facilitatorSessionModulePromise;
    delete process.env.NEON_AUTH_BASE_URL;

    await expect(getFacilitatorSession()).resolves.toBeNull();
  });

  it("returns null when there is no signed-in user", async () => {
    const { getFacilitatorSession } = await facilitatorSessionModulePromise;
    getSession.mockResolvedValue({ data: null });

    await expect(getFacilitatorSession()).resolves.toBeNull();
  });

  it("returns null when the signed-in user has no active grant", async () => {
    const { getFacilitatorSession } = await facilitatorSessionModulePromise;
    getSession.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getActiveGrantByNeonUserId.mockResolvedValue(null);

    await expect(getFacilitatorSession("sample-studio-b")).resolves.toBeNull();
    expect(getActiveGrantByNeonUserId).toHaveBeenCalledWith("sample-studio-b", "user-1");
  });

  it("returns the facilitator session when a grant exists", async () => {
    const { getFacilitatorSession } = await facilitatorSessionModulePromise;
    getSession.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getActiveGrantByNeonUserId.mockResolvedValue({ id: "grant-1", role: "owner" });

    await expect(getFacilitatorSession("sample-studio-a")).resolves.toEqual({
      neonUserId: "user-1",
      grant: { id: "grant-1", role: "owner" },
    });
  });

  afterEach(() => {
    process.env.NEON_AUTH_BASE_URL = originalBaseUrl;
  });
});
