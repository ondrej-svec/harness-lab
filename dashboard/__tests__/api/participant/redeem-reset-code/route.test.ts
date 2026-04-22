import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const consumeResetCode = vi.fn();
const setParticipantPasswordViaResetToken = vi.fn();
const revokeUserSessions = vi.fn();
const appendAudit = vi.fn();

vi.mock("@/lib/participant-reset-codes", () => ({
  consumeResetCode,
}));

vi.mock("@/lib/auth/server-set-password", () => ({
  setParticipantPasswordViaResetToken,
}));

vi.mock("@/lib/auth/neon-auth-proxy", () => ({
  admin: {
    revokeUserSessions,
  },
}));

vi.mock("@/lib/audit-log-repository", () => ({
  getAuditLogRepository: () => ({
    append: appendAudit,
  }),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/participant/redeem-reset-code", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      host: "localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/participant/redeem-reset-code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeResetCode.mockReturnValue({
      ok: true,
      participantId: "p-1",
      instanceId: "i-1",
      neonUserId: "neon-u-1",
    });
    setParticipantPasswordViaResetToken.mockResolvedValue({ ok: true });
    revokeUserSessions.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns 200 + participantId on happy path and sets the participant's chosen password", async () => {
    const { POST } = await import("@/app/api/participant/redeem-reset-code/route");
    const res = await POST(makeRequest({ code: "lantern3-context5-focus2", newPassword: "my-new-passw0rd" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; participantId: string; instanceId: string };
    expect(body).toEqual({ ok: true, participantId: "p-1", instanceId: "i-1" });
    expect(consumeResetCode).toHaveBeenCalledWith("lantern3-context5-focus2");
    expect(setParticipantPasswordViaResetToken).toHaveBeenCalledWith({
      neonUserId: "neon-u-1",
      newPassword: "my-new-passw0rd",
    });
  });

  it("revokes stale sessions after a successful redeem", async () => {
    const { POST } = await import("@/app/api/participant/redeem-reset-code/route");
    await POST(makeRequest({ code: "lantern3-context5-focus2", newPassword: "my-new-passw0rd" }));
    expect(revokeUserSessions).toHaveBeenCalledWith({ userId: "neon-u-1" });
  });

  it("writes a success audit entry", async () => {
    const { POST } = await import("@/app/api/participant/redeem-reset-code/route");
    await POST(makeRequest({ code: "lantern3-context5-focus2", newPassword: "my-new-passw0rd" }));
    expect(appendAudit).toHaveBeenCalledOnce();
    const entry = appendAudit.mock.calls[0]?.[0];
    expect(entry.action).toBe("participant_password_reset_redeem");
    expect(entry.result).toBe("success");
  });

  it("returns 400 for weak passwords before consuming the code", async () => {
    const { POST } = await import("@/app/api/participant/redeem-reset-code/route");
    const res = await POST(makeRequest({ code: "lantern3-context5-focus2", newPassword: "short" }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("weak_password");
    expect(consumeResetCode).not.toHaveBeenCalled();
  });

  it("returns 400 when the code is missing from the body", async () => {
    const { POST } = await import("@/app/api/participant/redeem-reset-code/route");
    const res = await POST(makeRequest({ newPassword: "my-new-passw0rd" }));
    expect(res.status).toBe(400);
    expect(consumeResetCode).not.toHaveBeenCalled();
  });

  it("returns 401 with reason=unknown for a code that was never issued (or already consumed)", async () => {
    consumeResetCode.mockReturnValueOnce({ ok: false, reason: "unknown" });
    const { POST } = await import("@/app/api/participant/redeem-reset-code/route");
    const res = await POST(makeRequest({ code: "never-real-code", newPassword: "my-new-passw0rd" }));
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unknown");
    expect(setParticipantPasswordViaResetToken).not.toHaveBeenCalled();
  });

  it("returns 401 with reason=expired for a code that timed out", async () => {
    consumeResetCode.mockReturnValueOnce({ ok: false, reason: "expired" });
    const { POST } = await import("@/app/api/participant/redeem-reset-code/route");
    const res = await POST(makeRequest({ code: "expired-code", newPassword: "my-new-passw0rd" }));
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("expired");
  });

  it("writes a failure audit entry and returns 500 if the password set fails downstream", async () => {
    setParticipantPasswordViaResetToken.mockResolvedValueOnce({
      ok: false,
      reason: "reset_failed",
      message: "neon auth returned 500",
    });
    const { POST } = await import("@/app/api/participant/redeem-reset-code/route");
    const res = await POST(makeRequest({ code: "lantern3-context5-focus2", newPassword: "my-new-passw0rd" }));
    expect(res.status).toBe(500);
    expect(appendAudit).toHaveBeenCalledOnce();
    const entry = appendAudit.mock.calls[0]?.[0];
    expect(entry.result).toBe("failure");
  });

  it("rejects requests from an untrusted origin", async () => {
    const request = new Request("http://localhost:3000/api/participant/redeem-reset-code", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://evil.example",
        host: "localhost:3000",
      },
      body: JSON.stringify({ code: "x", newPassword: "my-new-passw0rd" }),
    });
    const { POST } = await import("@/app/api/participant/redeem-reset-code/route");
    const res = await POST(request);
    expect([400, 403]).toContain(res.status);
    expect(consumeResetCode).not.toHaveBeenCalled();
  });
});
