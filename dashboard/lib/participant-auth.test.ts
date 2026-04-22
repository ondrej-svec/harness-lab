import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const proxySetUserPassword = vi.fn();
const proxyRevokeUserSessions = vi.fn();
const proxyRequestPasswordReset = vi.fn();
const sqlQuery = vi.fn();
const getRuntimeStorageMode = vi.fn();
const adminCreateParticipantUser = vi.fn();
const findParticipantUserForRecovery = vi.fn();
const setParticipantPasswordViaResetToken = vi.fn();

vi.mock("./auth/neon-auth-proxy", () => ({
  admin: {
    setUserPassword: proxySetUserPassword,
    revokeUserSessions: proxyRevokeUserSessions,
  },
  requestPasswordReset: proxyRequestPasswordReset,
}));

vi.mock("./auth/admin-create-user", () => ({
  adminCreateParticipantUser,
  findParticipantUserForRecovery,
}));

vi.mock("./auth/server-set-password", () => ({
  setParticipantPasswordViaResetToken,
}));

vi.mock("./neon-db", () => ({
  getNeonSql: () => ({ query: sqlQuery }),
}));

vi.mock("./runtime-storage", () => ({
  getRuntimeStorageMode,
}));

function importParticipantAuth() {
  return import("./participant-auth");
}

describe("participant-auth", () => {
  const originalBaseUrl = process.env.NEON_AUTH_BASE_URL;
  const originalCookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEON_AUTH_BASE_URL = "https://auth.example.com";
    process.env.NEON_AUTH_COOKIE_SECRET = "secret-secret-secret-secret-32ch";
    getRuntimeStorageMode.mockReturnValue("neon");
  });

  afterEach(() => {
    process.env.NEON_AUTH_BASE_URL = originalBaseUrl;
    process.env.NEON_AUTH_COOKIE_SECRET = originalCookieSecret;
  });

  describe("createParticipantAccount", () => {
    it("chains admin-create + set-password and returns the new neon user id", async () => {
      adminCreateParticipantUser.mockResolvedValue({ ok: true, neonUserId: "user-abc" });
      setParticipantPasswordViaResetToken.mockResolvedValue({ ok: true });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "Jan@Acme.com",
        password: "passw0rd!",
        displayName: "Jan Novák",
      });

      expect(result).toEqual({ ok: true, neonUserId: "user-abc" });
      expect(adminCreateParticipantUser).toHaveBeenCalledWith({
        email: "jan@acme.com", // normalized
        name: "Jan Novák",
      });
      expect(setParticipantPasswordViaResetToken).toHaveBeenCalledWith({
        neonUserId: "user-abc",
        newPassword: "passw0rd!",
      });
    });

    it("surfaces email_taken when an existing user already has a password (real account)", async () => {
      adminCreateParticipantUser.mockResolvedValue({
        ok: false,
        reason: "email_taken",
        message: "User with email already exists",
      });
      findParticipantUserForRecovery.mockResolvedValue({
        neonUserId: "user-existing",
        hasPassword: true,
      });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "jan@acme.com",
        password: "passw0rd!",
        displayName: "Jan",
      });

      expect(result).toMatchObject({ ok: false, reason: "email_taken" });
      expect(setParticipantPasswordViaResetToken).not.toHaveBeenCalled();
    });

    it("recovers an orphan account (email_taken but no password set) by setting the caller's chosen password", async () => {
      adminCreateParticipantUser.mockResolvedValue({
        ok: false,
        reason: "email_taken",
        message: "User with email already exists",
      });
      findParticipantUserForRecovery.mockResolvedValue({
        neonUserId: "user-orphan",
        hasPassword: false,
      });
      setParticipantPasswordViaResetToken.mockResolvedValue({ ok: true });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "jan@acme.com",
        password: "passw0rd!",
        displayName: "Jan",
      });

      expect(result).toEqual({ ok: true, neonUserId: "user-orphan" });
      expect(setParticipantPasswordViaResetToken).toHaveBeenCalledWith({
        neonUserId: "user-orphan",
        newPassword: "passw0rd!",
      });
    });

    it("surfaces email_taken when the lookup can't find the user (signal-mismatch edge case)", async () => {
      adminCreateParticipantUser.mockResolvedValue({
        ok: false,
        reason: "email_taken",
        message: "User with email already exists",
      });
      findParticipantUserForRecovery.mockResolvedValue(null);
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "jan@acme.com",
        password: "passw0rd!",
        displayName: "Jan",
      });

      expect(result).toMatchObject({ ok: false, reason: "email_taken" });
      expect(setParticipantPasswordViaResetToken).not.toHaveBeenCalled();
    });

    it("propagates weak_password from the orphan recovery path", async () => {
      adminCreateParticipantUser.mockResolvedValue({
        ok: false,
        reason: "email_taken",
      });
      findParticipantUserForRecovery.mockResolvedValue({
        neonUserId: "user-orphan",
        hasPassword: false,
      });
      setParticipantPasswordViaResetToken.mockResolvedValue({ ok: false, reason: "weak_password" });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "jan@acme.com",
        password: "short",
        displayName: "Jan",
      });

      expect(result).toMatchObject({ ok: false, reason: "weak_password" });
    });

    it("propagates invalid_email from the control-plane create step", async () => {
      adminCreateParticipantUser.mockResolvedValue({ ok: false, reason: "invalid_email" });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "not-an-email",
        password: "passw0rd!",
        displayName: "Jan",
      });

      expect(result).toMatchObject({ ok: false, reason: "invalid_email" });
    });

    it("maps missing_credentials to 'unavailable' so the route returns a clean error", async () => {
      adminCreateParticipantUser.mockResolvedValue({
        ok: false,
        reason: "missing_credentials",
        message: "NEON_API_KEY missing",
      });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "jan@acme.com",
        password: "passw0rd!",
        displayName: "Jan",
      });

      expect(result).toMatchObject({ ok: false, reason: "unavailable" });
    });

    it("maps control-plane errors to 'unknown'", async () => {
      adminCreateParticipantUser.mockResolvedValue({
        ok: false,
        reason: "control_plane_error",
        message: "503 Service Unavailable",
      });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "jan@acme.com",
        password: "passw0rd!",
        displayName: "Jan",
      });

      expect(result).toMatchObject({ ok: false, reason: "unknown" });
    });

    it("propagates weak_password from the password-set step", async () => {
      adminCreateParticipantUser.mockResolvedValue({ ok: true, neonUserId: "user-pwd" });
      setParticipantPasswordViaResetToken.mockResolvedValue({ ok: false, reason: "weak_password" });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "jan@acme.com",
        password: "short",
        displayName: "Jan",
      });

      expect(result).toMatchObject({ ok: false, reason: "weak_password" });
    });

    it("classifies a reset_failed step as 'unknown' so the orphan row is caught on retry", async () => {
      adminCreateParticipantUser.mockResolvedValue({ ok: true, neonUserId: "user-orphan" });
      setParticipantPasswordViaResetToken.mockResolvedValue({
        ok: false,
        reason: "reset_failed",
        message: "INVALID_TOKEN",
      });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "jan@acme.com",
        password: "longenoughpwd",
        displayName: "Jan",
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.reason).toBe("unknown");
      expect(result.message).toContain("password-set-failed");
    });
  });

  describe("authenticateParticipant", () => {
    let originalFetch: typeof globalThis.fetch;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
      fetchMock = vi.fn();
      globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    function jsonResponse(body: unknown, status = 200): Response {
      return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });
    }

    it("signs in and returns the neon user id from the response body", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ user: { id: "user-xyz" } }));
      const { authenticateParticipant } = await importParticipantAuth();

      const result = await authenticateParticipant({
        email: "Jan@Acme.com",
        password: "passw0rd!",
      });

      expect(result).toEqual({ ok: true, neonUserId: "user-xyz" });
      const [, init] = fetchMock.mock.calls[0];
      expect(init.method).toBe("POST");
      expect(init.body).toBe(JSON.stringify({ email: "jan@acme.com", password: "passw0rd!" }));
      // Origin header is required to clear better-auth's CSRF check.
      expect(init.headers.origin).toMatch(/^https:\/\/auth\.example\.com$/);
    });

    it("classifies wrong-credentials when better-auth returns 401", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: "Invalid email or password" }, 401));
      const { authenticateParticipant } = await importParticipantAuth();

      const result = await authenticateParticipant({
        email: "jan@acme.com",
        password: "bad",
      });

      expect(result).toMatchObject({ ok: false, reason: "wrong_credentials" });
    });

    it("classifies rate-limit when better-auth returns 429", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: "Too many requests" }, 429));
      const { authenticateParticipant } = await importParticipantAuth();

      const result = await authenticateParticipant({
        email: "jan@acme.com",
        password: "bad",
      });

      expect(result).toMatchObject({ ok: false, reason: "rate_limited" });
    });

    it("guards against the race where signIn succeeds but the body has no user", async () => {
      fetchMock.mockResolvedValue(jsonResponse({}));
      const { authenticateParticipant } = await importParticipantAuth();

      const result = await authenticateParticipant({
        email: "jan@acme.com",
        password: "passw0rd!",
      });

      expect(result).toMatchObject({ ok: false, reason: "unknown" });
    });
  });

  describe("resetParticipantPasswordAsAdmin", () => {
    it("rotates the password and revokes existing sessions via the proxy", async () => {
      proxySetUserPassword.mockResolvedValue({ ok: true });
      proxyRevokeUserSessions.mockResolvedValue({ ok: true });
      const { resetParticipantPasswordAsAdmin } = await importParticipantAuth();

      const result = await resetParticipantPasswordAsAdmin({
        neonUserId: "user-1",
        newPassword: "lantern-relay-north",
      });

      expect(result).toEqual({ ok: true });
      expect(proxySetUserPassword).toHaveBeenCalledWith({
        userId: "user-1",
        newPassword: "lantern-relay-north",
      });
      expect(proxyRevokeUserSessions).toHaveBeenCalledWith({ userId: "user-1" });
    });

    it("propagates not_admin from the proxy without revoking sessions", async () => {
      proxySetUserPassword.mockResolvedValue({ ok: false, reason: "not_admin" });
      const { resetParticipantPasswordAsAdmin } = await importParticipantAuth();

      const result = await resetParticipantPasswordAsAdmin({
        neonUserId: "user-1",
        newPassword: "x",
      });

      expect(result).toMatchObject({ ok: false, reason: "not_admin" });
      expect(proxyRevokeUserSessions).not.toHaveBeenCalled();
    });

    it("propagates not_found when the user is gone", async () => {
      proxySetUserPassword.mockResolvedValue({ ok: false, reason: "not_found" });
      const { resetParticipantPasswordAsAdmin } = await importParticipantAuth();

      const result = await resetParticipantPasswordAsAdmin({
        neonUserId: "gone",
        newPassword: "x",
      });

      expect(result).toMatchObject({ ok: false, reason: "not_found" });
    });

    it("tolerates revoke failures — the password was already rotated", async () => {
      proxySetUserPassword.mockResolvedValue({ ok: true });
      proxyRevokeUserSessions.mockRejectedValue(new Error("revoke upstream flake"));
      const { resetParticipantPasswordAsAdmin } = await importParticipantAuth();

      const result = await resetParticipantPasswordAsAdmin({
        neonUserId: "user-1",
        newPassword: "ok",
      });

      expect(result).toEqual({ ok: true });
    });
  });

  describe("sendParticipantPasswordResetEmail", () => {
    it("calls the proxy with the normalized email + redirectTo", async () => {
      proxyRequestPasswordReset.mockResolvedValue({ ok: true });
      const { sendParticipantPasswordResetEmail } = await importParticipantAuth();

      const result = await sendParticipantPasswordResetEmail({
        email: "Jan@Acme.com",
        redirectTo: "https://example.test/participant/reset",
      });

      expect(result).toEqual({ ok: true });
      expect(proxyRequestPasswordReset).toHaveBeenCalledWith({
        email: "jan@acme.com",
        redirectTo: "https://example.test/participant/reset",
      });
    });

    it("surfaces proxy errors without crashing", async () => {
      proxyRequestPasswordReset.mockResolvedValue({ ok: false, error: "Email delivery failed" });
      const { sendParticipantPasswordResetEmail } = await importParticipantAuth();

      const result = await sendParticipantPasswordResetEmail({
        email: "jan@acme.com",
        redirectTo: "https://example.test/reset",
      });

      expect(result).toMatchObject({ ok: false, message: "Email delivery failed" });
    });
  });

  describe("isNeonUserParticipant", () => {
    it("returns true when the user row has role = 'participant'", async () => {
      sqlQuery.mockResolvedValue([{ role: "participant" }]);
      const { isNeonUserParticipant } = await importParticipantAuth();

      await expect(isNeonUserParticipant("user-1")).resolves.toBe(true);
    });

    it("returns false for admin users — prevents lateral privilege confusion", async () => {
      sqlQuery.mockResolvedValue([{ role: "admin" }]);
      const { isNeonUserParticipant } = await importParticipantAuth();

      await expect(isNeonUserParticipant("user-1")).resolves.toBe(false);
    });

    it("returns false when the user is not found", async () => {
      sqlQuery.mockResolvedValue([]);
      const { isNeonUserParticipant } = await importParticipantAuth();

      await expect(isNeonUserParticipant("missing")).resolves.toBe(false);
    });

    it("returns false outside Neon runtime mode — no SQL queries issued", async () => {
      getRuntimeStorageMode.mockReturnValue("file");
      const { isNeonUserParticipant } = await importParticipantAuth();

      await expect(isNeonUserParticipant("user-1")).resolves.toBe(false);
      expect(sqlQuery).not.toHaveBeenCalled();
    });
  });

  describe("configuration guards", () => {
    it("throws outside Neon runtime mode", async () => {
      getRuntimeStorageMode.mockReturnValue("file");
      const { createParticipantAccount } = await importParticipantAuth();

      await expect(
        createParticipantAccount({ email: "jan@acme.com", password: "x", displayName: "x" }),
      ).rejects.toThrow(/HARNESS_STORAGE_MODE=neon/);
    });
  });
});
