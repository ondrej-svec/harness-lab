import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createUser = vi.fn();
const signInEmail = vi.fn();
const getSession = vi.fn();
const requestPasswordReset = vi.fn();
const sqlQuery = vi.fn();
const getRuntimeStorageMode = vi.fn();

vi.mock("./auth/server", () => ({
  auth: {
    admin: { createUser },
    signIn: { email: signInEmail },
    getSession,
    requestPasswordReset,
  },
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
    it("creates a participant-role user and returns the neon user id", async () => {
      createUser.mockResolvedValue({ data: { user: { id: "user-abc" } } });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "Jan@Acme.com",
        password: "passw0rd!",
        displayName: "Jan Novák",
      });

      expect(result).toEqual({ ok: true, neonUserId: "user-abc" });
      expect(createUser).toHaveBeenCalledWith({
        email: "jan@acme.com", // normalized
        password: "passw0rd!",
        name: "Jan Novák",
        role: "participant",
      });
    });

    it("classifies email-taken errors from the underlying SDK", async () => {
      createUser.mockResolvedValue({ error: { message: "User with email already exists" } });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "jan@acme.com",
        password: "passw0rd!",
        displayName: "Jan",
      });

      expect(result).toMatchObject({ ok: false, reason: "email_taken" });
    });

    it("classifies weak-password errors", async () => {
      createUser.mockResolvedValue({ error: { message: "Password too short" } });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "jan@acme.com",
        password: "abc",
        displayName: "Jan",
      });

      expect(result).toMatchObject({ ok: false, reason: "weak_password" });
    });

    it("classifies invalid-email errors", async () => {
      createUser.mockResolvedValue({ error: { message: "Invalid email format" } });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "not-an-email",
        password: "passw0rd!",
        displayName: "Jan",
      });

      expect(result).toMatchObject({ ok: false, reason: "invalid_email" });
    });

    it("falls back to 'unknown' for unrecognized SDK errors", async () => {
      createUser.mockResolvedValue({ error: { message: "Upstream timeout" } });
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "jan@acme.com",
        password: "passw0rd!",
        displayName: "Jan",
      });

      expect(result).toMatchObject({ ok: false, reason: "unknown" });
    });

    it("surfaces thrown exceptions as classified failures", async () => {
      createUser.mockRejectedValue(new Error("Network down"));
      const { createParticipantAccount } = await importParticipantAuth();

      const result = await createParticipantAccount({
        email: "jan@acme.com",
        password: "passw0rd!",
        displayName: "Jan",
      });

      expect(result).toMatchObject({ ok: false, reason: "unknown", message: "Network down" });
    });
  });

  describe("authenticateParticipant", () => {
    it("signs in and returns the neon user id from the new session", async () => {
      signInEmail.mockResolvedValue({ data: {} });
      getSession.mockResolvedValue({ data: { user: { id: "user-xyz" } } });
      const { authenticateParticipant } = await importParticipantAuth();

      const result = await authenticateParticipant({
        email: "Jan@Acme.com",
        password: "passw0rd!",
      });

      expect(result).toEqual({ ok: true, neonUserId: "user-xyz" });
      expect(signInEmail).toHaveBeenCalledWith({ email: "jan@acme.com", password: "passw0rd!" });
    });

    it("classifies wrong-credentials from the SDK", async () => {
      signInEmail.mockResolvedValue({ error: { message: "Invalid email or password" } });
      const { authenticateParticipant } = await importParticipantAuth();

      const result = await authenticateParticipant({
        email: "jan@acme.com",
        password: "bad",
      });

      expect(result).toMatchObject({ ok: false, reason: "wrong_credentials" });
    });

    it("classifies rate-limit from the SDK", async () => {
      signInEmail.mockResolvedValue({ error: { message: "Too many requests" } });
      const { authenticateParticipant } = await importParticipantAuth();

      const result = await authenticateParticipant({
        email: "jan@acme.com",
        password: "bad",
      });

      expect(result).toMatchObject({ ok: false, reason: "rate_limited" });
    });

    it("guards against the race where signIn succeeds but no session exists", async () => {
      signInEmail.mockResolvedValue({ data: {} });
      getSession.mockResolvedValue({ data: null });
      const { authenticateParticipant } = await importParticipantAuth();

      const result = await authenticateParticipant({
        email: "jan@acme.com",
        password: "passw0rd!",
      });

      expect(result).toMatchObject({ ok: false, reason: "unknown" });
    });
  });

  describe("sendParticipantPasswordResetEmail", () => {
    it("calls requestPasswordReset with the normalized email + redirectTo", async () => {
      requestPasswordReset.mockResolvedValue({ data: {} });
      const { sendParticipantPasswordResetEmail } = await importParticipantAuth();

      const result = await sendParticipantPasswordResetEmail({
        email: "Jan@Acme.com",
        redirectTo: "https://example.test/participant/reset",
      });

      expect(result).toEqual({ ok: true });
      expect(requestPasswordReset).toHaveBeenCalledWith({
        email: "jan@acme.com",
        redirectTo: "https://example.test/participant/reset",
      });
    });

    it("surfaces SDK errors without crashing", async () => {
      requestPasswordReset.mockResolvedValue({ error: { message: "Email delivery failed" } });
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
