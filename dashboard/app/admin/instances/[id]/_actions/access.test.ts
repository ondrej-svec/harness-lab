import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requireFacilitatorActionAccess = vi.fn();
const getFacilitatorSession = vi.fn();
const auditAppend = vi.fn();
const getActiveAccess = vi.fn();
const decryptEventCodeForReveal = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/facilitator-access", () => ({
  requireFacilitatorActionAccess,
}));

vi.mock("@/lib/facilitator-session", () => ({
  getFacilitatorSession,
}));

vi.mock("@/lib/audit-log-repository", () => ({
  getAuditLogRepository: () => ({ append: auditAppend }),
}));

vi.mock("@/lib/event-code-reveal-crypto", () => ({
  decryptEventCodeForReveal,
}));

vi.mock("@/lib/participant-event-access-repository", () => ({
  getParticipantEventAccessRepository: () => ({
    getActiveAccess,
  }),
}));

// Unused by the reveal path but imported at module top.
vi.mock("@/lib/instance-grant-repository", () => ({
  getInstanceGrantRepository: () => ({
    getActiveGrantByNeonUserId: vi.fn(),
    createGrant: vi.fn(),
    revokeGrant: vi.fn(),
  }),
}));

vi.mock("@/lib/neon-db", () => ({
  getNeonSql: vi.fn(),
}));

vi.mock("@/lib/workshop-instance-repository", () => ({
  getWorkshopInstanceRepository: () => ({
    getInstance: vi.fn(),
    updateInstance: vi.fn(),
  }),
}));

vi.mock("@/lib/participant-access-management", () => ({
  issueParticipantEventAccess: vi.fn(),
}));

vi.mock("@/lib/admin-page-view-model", () => ({
  buildAdminHref: () => "/admin",
  readActionState: () => ({ lang: "en", section: "run", instanceId: "inst-a" }),
}));

describe("revealParticipantEventCodeAction", () => {
  beforeEach(() => {
    vi.resetModules();
    requireFacilitatorActionAccess.mockReset().mockResolvedValue(undefined);
    getFacilitatorSession.mockReset().mockResolvedValue({ neonUserId: "user-42" });
    auditAppend.mockReset().mockResolvedValue(undefined);
    getActiveAccess.mockReset();
    decryptEventCodeForReveal.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns plaintext and audits success when ciphertext decrypts", async () => {
    getActiveAccess.mockResolvedValue({
      id: "pea-1",
      instanceId: "inst-a",
      version: 3,
      codeHash: "abcdef0123456789",
      codeCiphertext: "v1:nonce.ct.tag",
      expiresAt: "2026-05-01T00:00:00.000Z",
      revokedAt: null,
    });
    decryptEventCodeForReveal.mockReturnValue("ember3-canvas7-focus2");

    const mod = await import("./access");
    const result = await mod.revealParticipantEventCodeAction("inst-a");

    expect(result).toEqual({ ok: true, plaintext: "ember3-canvas7-focus2" });
    expect(auditAppend).toHaveBeenCalledTimes(1);
    const record = auditAppend.mock.calls[0][0];
    expect(record).toMatchObject({
      instanceId: "inst-a",
      actorKind: "facilitator",
      action: "participant_event_access_revealed",
      result: "success",
    });
    expect(record.metadata).toMatchObject({
      actorNeonUserId: "user-42",
      codeId: "abcdef012345",
      version: 3,
    });
    // Plaintext must never leak into audit metadata.
    expect(JSON.stringify(record.metadata)).not.toContain("ember3");
  });

  it("audits failure when the row has no ciphertext", async () => {
    getActiveAccess.mockResolvedValue({
      id: "pea-2",
      instanceId: "inst-a",
      version: 1,
      codeHash: "deadbeef00000000",
      codeCiphertext: null,
      expiresAt: "2026-05-01T00:00:00.000Z",
      revokedAt: null,
    });

    const mod = await import("./access");
    const result = await mod.revealParticipantEventCodeAction("inst-a");

    expect(result).toEqual({ ok: false, reason: "not-revealable" });
    expect(auditAppend.mock.calls[0][0]).toMatchObject({
      result: "failure",
      metadata: expect.objectContaining({ reason: "not-revealable", codeId: "deadbeef0000" }),
    });
    expect(decryptEventCodeForReveal).not.toHaveBeenCalled();
  });

  it("audits failure when decrypt returns null (tampered ciphertext)", async () => {
    getActiveAccess.mockResolvedValue({
      id: "pea-3",
      instanceId: "inst-a",
      version: 2,
      codeHash: "0123456789abcdef",
      codeCiphertext: "v1:tampered",
      expiresAt: "2026-05-01T00:00:00.000Z",
      revokedAt: null,
    });
    decryptEventCodeForReveal.mockReturnValue(null);

    const mod = await import("./access");
    const result = await mod.revealParticipantEventCodeAction("inst-a");

    expect(result).toEqual({ ok: false, reason: "decrypt-failed" });
    expect(auditAppend.mock.calls[0][0]).toMatchObject({
      result: "failure",
      metadata: expect.objectContaining({ reason: "decrypt-failed" }),
    });
  });

  it("audits failure when no active access row exists", async () => {
    getActiveAccess.mockResolvedValue(null);

    const mod = await import("./access");
    const result = await mod.revealParticipantEventCodeAction("inst-a");

    expect(result).toEqual({ ok: false, reason: "no-access" });
    expect(auditAppend.mock.calls[0][0]).toMatchObject({
      result: "failure",
      metadata: expect.objectContaining({ reason: "no-access" }),
    });
  });

  it("propagates rejections from the facilitator auth guard", async () => {
    requireFacilitatorActionAccess.mockRejectedValue(new Error("not authorised"));

    const mod = await import("./access");
    await expect(mod.revealParticipantEventCodeAction("inst-a")).rejects.toThrow("not authorised");
    expect(auditAppend).not.toHaveBeenCalled();
    expect(getActiveAccess).not.toHaveBeenCalled();
  });
});
