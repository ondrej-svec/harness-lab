import { beforeEach, describe, expect, it, vi } from "vitest";

const requireFacilitatorRequest = vi.fn();
const getFacilitatorSession = vi.fn();
const revokeGrant = vi.fn();
const appendAudit = vi.fn();

vi.mock("@/lib/facilitator-access", () => ({
  requireFacilitatorRequest,
}));

vi.mock("@/lib/facilitator-session", () => ({
  getFacilitatorSession,
}));

vi.mock("@/lib/instance-grant-repository", () => ({
  getInstanceGrantRepository: () => ({
    revokeGrant,
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

const routeModulePromise = import("@/app/api/admin/facilitators/[id]/route");

describe("admin facilitator revoke route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireFacilitatorRequest.mockResolvedValue(null);
  });

  it("rejects non-owner revocation requests", async () => {
    const { DELETE } = await routeModulePromise;
    getFacilitatorSession.mockResolvedValue({
      neonUserId: "operator-user",
      grant: { id: "grant-operator", role: "operator" },
    });

    const response = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "grant-target" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "owner role required" });
  });

  it("prevents owners from revoking their own grant", async () => {
    const { DELETE } = await routeModulePromise;
    getFacilitatorSession.mockResolvedValue({
      neonUserId: "owner-user",
      grant: { id: "grant-owner", role: "owner" },
    });

    const response = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "grant-owner" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "cannot revoke your own grant" });
  });

  it("revokes the target grant and writes an audit record", async () => {
    const { DELETE } = await routeModulePromise;
    getFacilitatorSession.mockResolvedValue({
      neonUserId: "owner-user",
      grant: { id: "grant-owner", role: "owner" },
    });

    const response = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "grant-target" }),
    });

    expect(revokeGrant).toHaveBeenCalledWith("grant-target");
    expect(appendAudit).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
