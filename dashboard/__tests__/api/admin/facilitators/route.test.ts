import { beforeEach, describe, expect, it, vi } from "vitest";

const requireFacilitatorRequest = vi.fn();
const getFacilitatorSession = vi.fn();
const listActiveGrants = vi.fn();
const getActiveGrantByNeonUserId = vi.fn();
const createGrant = vi.fn();
const appendAudit = vi.fn();
const query = vi.fn();
const getRuntimeStorageMode = vi.fn();

vi.mock("@/lib/facilitator-access", () => ({
  requireFacilitatorRequest,
}));

vi.mock("@/lib/facilitator-session", () => ({
  getFacilitatorSession,
}));

vi.mock("@/lib/instance-grant-repository", () => ({
  getInstanceGrantRepository: () => ({
    listActiveGrants,
    getActiveGrantByNeonUserId,
    createGrant,
  }),
}));

vi.mock("@/lib/audit-log-repository", () => ({
  getAuditLogRepository: () => ({
    append: appendAudit,
  }),
}));

vi.mock("@/lib/instance-context", () => ({
  getCurrentWorkshopInstanceId: () => "sample-studio-a",
}));

vi.mock("@/lib/neon-db", () => ({
  getNeonSql: () => ({
    query,
  }),
}));

vi.mock("@/lib/runtime-storage", () => ({
  getRuntimeStorageMode,
}));

const routeModulePromise = import("@/app/api/admin/facilitators/route");

describe("admin facilitators route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireFacilitatorRequest.mockResolvedValue(null);
    getRuntimeStorageMode.mockReturnValue("neon");
    getFacilitatorSession.mockResolvedValue({
      neonUserId: "owner-user",
      grant: { id: "grant-owner", role: "owner" },
    });
  });

  it("lists active grants for authorized facilitators", async () => {
    const { GET } = await routeModulePromise;
    listActiveGrants.mockResolvedValue([{ id: "grant-1" }]);

    const response = await GET(new Request("http://localhost/api/admin/facilitators"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, grants: [{ id: "grant-1" }] });
  });

  it("rejects grant creation for non-owners", async () => {
    const { POST } = await routeModulePromise;
    getFacilitatorSession.mockResolvedValue({
      neonUserId: "operator-user",
      grant: { id: "grant-operator", role: "operator" },
    });

    const response = await POST(
      new Request("http://localhost/api/admin/facilitators", {
        method: "POST",
        body: JSON.stringify({ email: "new@example.com", role: "owner" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "owner role required" });
  });

  it("validates required email and role payload fields", async () => {
    const { POST } = await routeModulePromise;

    const response = await POST(
      new Request("http://localhost/api/admin/facilitators", {
        method: "POST",
        body: JSON.stringify({ email: "", role: "admin" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "email and role (owner|operator|observer) required",
    });
  });

  it("requires neon runtime mode for grant management", async () => {
    const { POST } = await routeModulePromise;
    getRuntimeStorageMode.mockReturnValue("file");

    const response = await POST(
      new Request("http://localhost/api/admin/facilitators", {
        method: "POST",
        body: JSON.stringify({ email: "new@example.com", role: "observer" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "grant management requires neon mode",
    });
  });

  it("returns 404 when the neon auth user cannot be found", async () => {
    const { POST } = await routeModulePromise;
    query.mockResolvedValue([]);

    const response = await POST(
      new Request("http://localhost/api/admin/facilitators", {
        method: "POST",
        body: JSON.stringify({ email: "missing@example.com", role: "observer" }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "no Neon Auth user found with that email — they must sign up first",
    });
  });

  it("returns 409 when a facilitator already has a grant", async () => {
    const { POST } = await routeModulePromise;
    query.mockResolvedValue([{ id: "user-2", name: "Dana", email: "dana@example.com" }]);
    getActiveGrantByNeonUserId.mockResolvedValue({ id: "existing-grant" });

    const response = await POST(
      new Request("http://localhost/api/admin/facilitators", {
        method: "POST",
        body: JSON.stringify({ email: "dana@example.com", role: "observer" }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "facilitator already has an active grant on this instance",
    });
  });

  it("creates a grant and writes an audit record for a valid owner request", async () => {
    const { POST } = await routeModulePromise;
    query.mockResolvedValue([{ id: "user-3", name: "Jana", email: "jana@example.com" }]);
    getActiveGrantByNeonUserId.mockResolvedValue(null);
    createGrant.mockResolvedValue({ id: "grant-new", role: "operator" });

    const response = await POST(
      new Request("http://localhost/api/admin/facilitators", {
        method: "POST",
        body: JSON.stringify({ email: "jana@example.com", role: "operator" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(createGrant).toHaveBeenCalledWith("sample-studio-a", "user-3", "operator");
    expect(appendAudit).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      grant: {
        id: "grant-new",
        neonUserId: "user-3",
        role: "operator",
        userName: "Jana",
        userEmail: "jana@example.com",
      },
    });
  });
});
