import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireFacilitatorRequest = vi.fn();
const findParticipant = vi.fn();
const issueResetCode = vi.fn();
const appendAudit = vi.fn();

vi.mock("@/lib/facilitator-access", () => ({
  requireFacilitatorRequest,
}));

vi.mock("@/lib/participant-repository", () => ({
  getParticipantRepository: () => ({
    findParticipant,
  }),
}));

vi.mock("@/lib/participant-reset-codes", () => ({
  issueResetCode,
}));

vi.mock("@/lib/audit-log-repository", () => ({
  getAuditLogRepository: () => ({
    append: appendAudit,
  }),
}));

function makeParticipant(overrides: Partial<{ id: string; neonUserId: string | null; archivedAt: string | null }> = {}) {
  return {
    id: "p-1",
    instanceId: "i-1",
    displayName: "Jana Nováková",
    email: null,
    emailOptIn: false,
    tag: null,
    createdAt: "2026-04-22T00:00:00.000Z",
    updatedAt: "2026-04-22T00:00:00.000Z",
    archivedAt: null,
    neonUserId: "neon-u-1",
    neonUserLinkedAt: "2026-04-22T00:00:00.000Z",
    hasPassword: true,
    ...overrides,
  };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/admin/participants/p-1/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const context = { params: Promise.resolve({ id: "p-1" }) };

describe("POST /api/admin/participants/[id]/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireFacilitatorRequest.mockResolvedValue(null);
    findParticipant.mockResolvedValue(makeParticipant());
    issueResetCode.mockReturnValue({
      code: "lantern3-context5-focus2",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns the 3-word code on the happy path", async () => {
    const { POST } = await import("@/app/api/admin/participants/[id]/reset-password/route");
    const res = await POST(makeRequest({ instanceId: "i-1" }), context);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; resetCode: string; participantId: string };
    expect(body.ok).toBe(true);
    expect(body.resetCode).toBe("lantern3-context5-focus2");
    expect(body.participantId).toBe("p-1");
    // Should NOT leak plaintext password in the old field name.
    expect(body).not.toHaveProperty("temporaryPassword");
  });

  it("issues the code scoped to the participant + instance + neonUserId", async () => {
    const { POST } = await import("@/app/api/admin/participants/[id]/reset-password/route");
    await POST(makeRequest({ instanceId: "i-1" }), context);
    expect(issueResetCode).toHaveBeenCalledWith({
      participantId: "p-1",
      instanceId: "i-1",
      neonUserId: "neon-u-1",
    });
  });

  it("writes an audit log entry on success", async () => {
    const { POST } = await import("@/app/api/admin/participants/[id]/reset-password/route");
    await POST(makeRequest({ instanceId: "i-1" }), context);
    expect(appendAudit).toHaveBeenCalledOnce();
    const entry = appendAudit.mock.calls[0]?.[0];
    expect(entry.action).toBe("participant_password_reset");
    expect(entry.result).toBe("success");
    expect(entry.metadata).toMatchObject({ participantId: "p-1", flow: "reset_code_issued" });
  });

  it("returns 400 when instanceId is missing from the body", async () => {
    const { POST } = await import("@/app/api/admin/participants/[id]/reset-password/route");
    const res = await POST(makeRequest({}), context);
    expect(res.status).toBe(400);
  });

  it("returns 404 when the participant is not found", async () => {
    findParticipant.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/admin/participants/[id]/reset-password/route");
    const res = await POST(makeRequest({ instanceId: "i-1" }), context);
    expect(res.status).toBe(404);
  });

  it("returns 404 when the participant is archived", async () => {
    findParticipant.mockResolvedValueOnce(makeParticipant({ archivedAt: "2026-04-01T00:00:00.000Z" }));
    const { POST } = await import("@/app/api/admin/participants/[id]/reset-password/route");
    const res = await POST(makeRequest({ instanceId: "i-1" }), context);
    expect(res.status).toBe(404);
  });

  it("returns 409 when the participant has no Neon Auth account to reset", async () => {
    findParticipant.mockResolvedValueOnce(makeParticipant({ neonUserId: null }));
    const { POST } = await import("@/app/api/admin/participants/[id]/reset-password/route");
    const res = await POST(makeRequest({ instanceId: "i-1" }), context);
    expect(res.status).toBe(409);
  });

  it("propagates a facilitator-auth denial from requireFacilitatorRequest", async () => {
    requireFacilitatorRequest.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 403 }),
    );
    const { POST } = await import("@/app/api/admin/participants/[id]/reset-password/route");
    const res = await POST(makeRequest({ instanceId: "i-1" }), context);
    expect(res.status).toBe(403);
  });
});
