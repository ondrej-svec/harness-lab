import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const getActiveGrantByNeonUserId = vi.fn();
const countActiveGrants = vi.fn();
const createGrant = vi.fn();
const getRuntimeStorageMode = vi.fn();

vi.mock("./auth/server", () => ({
  auth: {
    getSession,
  },
}));

vi.mock("./instance-grant-repository", () => ({
  getInstanceGrantRepository: () => ({
    getActiveGrantByNeonUserId,
    countActiveGrants,
    createGrant,
  }),
}));

vi.mock("./instance-context", () => ({
  getCurrentWorkshopInstanceId: () => "sample-studio-a",
}));

vi.mock("./runtime-storage", () => ({
  getRuntimeStorageMode,
}));

function importFacilitatorSessionModule() {
  return import("./facilitator-session");
}

describe("facilitator-session", () => {
  const originalBaseUrl = process.env.NEON_AUTH_BASE_URL;
  const originalCookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEON_AUTH_BASE_URL = "https://auth.example.com";
    process.env.NEON_AUTH_COOKIE_SECRET = "secret-secret-secret-secret";
    getRuntimeStorageMode.mockReturnValue("neon");
    countActiveGrants.mockResolvedValue(1);
    createGrant.mockResolvedValue(null);
  });

  it("returns null outside neon mode", async () => {
    const { getFacilitatorSession } = await importFacilitatorSessionModule();
    getRuntimeStorageMode.mockReturnValue("file");

    await expect(getFacilitatorSession()).resolves.toBeNull();
  });

  it("throws when neon auth is not fully configured", async () => {
    const { getFacilitatorSession } = await importFacilitatorSessionModule();
    delete process.env.NEON_AUTH_BASE_URL;

    await expect(getFacilitatorSession()).rejects.toThrow(
      "NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET are required when HARNESS_STORAGE_MODE=neon",
    );
  });

  it("returns null when there is no signed-in user", async () => {
    const { getFacilitatorSession } = await importFacilitatorSessionModule();
    getSession.mockResolvedValue({ data: null });

    await expect(getFacilitatorSession()).resolves.toBeNull();
  });

  it("returns null when the signed-in user has no active grant", async () => {
    const { getFacilitatorSession } = await importFacilitatorSessionModule();
    getSession.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getActiveGrantByNeonUserId.mockResolvedValue(null);

    await expect(getFacilitatorSession("sample-studio-b")).resolves.toBeNull();
    expect(getActiveGrantByNeonUserId).toHaveBeenCalledWith("sample-studio-b", "user-1");
  });

  it("returns the facilitator session when a grant exists", async () => {
    const { getFacilitatorSession } = await importFacilitatorSessionModule();
    getSession.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getActiveGrantByNeonUserId.mockResolvedValue({ id: "grant-1", role: "owner" });

    await expect(getFacilitatorSession("sample-studio-a")).resolves.toEqual({
      neonUserId: "user-1",
      grant: { id: "grant-1", role: "owner" },
    });
  });

  afterEach(() => {
    process.env.NEON_AUTH_BASE_URL = originalBaseUrl;
    process.env.NEON_AUTH_COOKIE_SECRET = originalCookieSecret;
  });
});
