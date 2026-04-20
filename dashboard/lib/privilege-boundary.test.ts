/**
 * Privilege boundary regression — Phase 5.5.
 *
 * Asserts that the facilitator gate (`resolveFacilitatorGrant` /
 * `resolveFacilitatorGrantWithBootstrap`) checks `role = "admin"` on
 * the underlying Neon Auth user BEFORE returning a grant — even when
 * an active grant row exists in `instance_grants`. Today no UI/code
 * path can write such a row for a participant-role user, but the
 * defense-in-depth role check makes the boundary survive future
 * refactors. If this test fails, a participant-role Neon user has
 * become able to authenticate as a facilitator. Treat it as a P0.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sqlQuery = vi.fn();
const getActiveGrantByNeonUserId = vi.fn();
const countActiveGrants = vi.fn();
const createGrant = vi.fn();
const getRuntimeStorageMode = vi.fn();

vi.mock("./auth/server", () => ({ auth: null }));

vi.mock("./neon-db", () => ({
  getNeonSql: () => ({ query: sqlQuery }),
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

const ADMIN_GRANT = {
  id: "grant-1",
  instanceId: "sample-studio-a",
  neonUserId: "user-1",
  role: "owner" as const,
  grantedAt: "2026-04-19T10:00:00.000Z",
  revokedAt: null,
};

async function importModule() {
  return import("./facilitator-session");
}

describe("privilege boundary", () => {
  const originalBaseUrl = process.env.NEON_AUTH_BASE_URL;
  const originalCookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEON_AUTH_BASE_URL = "https://auth.example.com";
    process.env.NEON_AUTH_COOKIE_SECRET = "secret-secret-secret-secret-32ch";
    getRuntimeStorageMode.mockReturnValue("neon");
    countActiveGrants.mockResolvedValue(1);
    createGrant.mockResolvedValue(null);
  });

  afterEach(() => {
    process.env.NEON_AUTH_BASE_URL = originalBaseUrl;
    process.env.NEON_AUTH_COOKIE_SECRET = originalCookieSecret;
  });

  describe("resolveFacilitatorGrant", () => {
    it("returns the grant when the underlying Neon user is admin-role", async () => {
      sqlQuery.mockResolvedValue([{ role: "admin" }]);
      getActiveGrantByNeonUserId.mockResolvedValue(ADMIN_GRANT);

      const { resolveFacilitatorGrant } = await importModule();
      await expect(resolveFacilitatorGrant("sample-studio-a", "user-1")).resolves.toEqual(ADMIN_GRANT);
    });

    it("REJECTS even with an active grant when the underlying user is participant-role", async () => {
      sqlQuery.mockResolvedValue([{ role: "participant" }]);
      getActiveGrantByNeonUserId.mockResolvedValue(ADMIN_GRANT);

      const { resolveFacilitatorGrant } = await importModule();
      await expect(resolveFacilitatorGrant("sample-studio-a", "user-1")).resolves.toBeNull();
      expect(getActiveGrantByNeonUserId).not.toHaveBeenCalled();
    });

    it("rejects when the user has no role recorded at all", async () => {
      sqlQuery.mockResolvedValue([]);
      getActiveGrantByNeonUserId.mockResolvedValue(ADMIN_GRANT);

      const { resolveFacilitatorGrant } = await importModule();
      await expect(resolveFacilitatorGrant("sample-studio-a", "user-1")).resolves.toBeNull();
    });

    it("rejects an empty/null role even when a grant exists", async () => {
      sqlQuery.mockResolvedValue([{ role: null }]);
      getActiveGrantByNeonUserId.mockResolvedValue(ADMIN_GRANT);

      const { resolveFacilitatorGrant } = await importModule();
      await expect(resolveFacilitatorGrant("sample-studio-a", "user-1")).resolves.toBeNull();
    });
  });

  describe("resolveFacilitatorGrantWithBootstrap", () => {
    it("returns the grant when admin-role + grant exists", async () => {
      sqlQuery.mockResolvedValue([{ role: "admin" }]);
      getActiveGrantByNeonUserId.mockResolvedValue(ADMIN_GRANT);

      const { resolveFacilitatorGrantWithBootstrap } = await importModule();
      const result = await resolveFacilitatorGrantWithBootstrap("sample-studio-a", "user-1");
      expect(result).toEqual({ grant: ADMIN_GRANT, autoBootstrapped: false });
    });

    it("REJECTS a participant-role user with a stale grant", async () => {
      sqlQuery.mockResolvedValue([{ role: "participant" }]);
      getActiveGrantByNeonUserId.mockResolvedValue(ADMIN_GRANT);

      const { resolveFacilitatorGrantWithBootstrap } = await importModule();
      const result = await resolveFacilitatorGrantWithBootstrap("sample-studio-a", "user-1");
      expect(result).toEqual({ grant: null, autoBootstrapped: false });
      expect(getActiveGrantByNeonUserId).not.toHaveBeenCalled();
      expect(createGrant).not.toHaveBeenCalled();
    });

    it("REJECTS a participant-role user attempting to bootstrap on an empty instance", async () => {
      sqlQuery.mockResolvedValue([{ role: "participant" }]);
      getActiveGrantByNeonUserId.mockResolvedValue(null);
      countActiveGrants.mockResolvedValue(0);

      const { resolveFacilitatorGrantWithBootstrap } = await importModule();
      const result = await resolveFacilitatorGrantWithBootstrap("sample-studio-a", "user-1");
      expect(result).toEqual({ grant: null, autoBootstrapped: false });
      expect(createGrant).not.toHaveBeenCalled();
    });

    it("bootstraps a fresh instance when the user is admin-role and no grants exist", async () => {
      sqlQuery.mockResolvedValue([{ role: "admin" }]);
      getActiveGrantByNeonUserId.mockResolvedValue(null);
      countActiveGrants.mockResolvedValue(0);
      createGrant.mockResolvedValue(ADMIN_GRANT);

      const { resolveFacilitatorGrantWithBootstrap } = await importModule();
      const result = await resolveFacilitatorGrantWithBootstrap("sample-studio-a", "user-1");
      expect(result).toEqual({ grant: ADMIN_GRANT, autoBootstrapped: true });
      expect(createGrant).toHaveBeenCalledWith("sample-studio-a", "user-1", "owner");
    });
  });
});
