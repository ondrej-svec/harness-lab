import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const headers = vi.fn();
const redirect = vi.fn();
const getCliSessionFromBearerToken = vi.fn();
const parseBearerToken = vi.fn();
const hasValidRequestCredentials = vi.fn();
const hasValidSession = vi.fn();
const hasFacilitatorPlatformAccess = vi.fn();
const resolveFacilitatorGrantWithBootstrap = vi.fn();
const getInstance = vi.fn();
const getRuntimeStorageMode = vi.fn();
const requireTrustedActionOrigin = vi.fn();

vi.mock("next/headers", () => ({
  headers,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("./facilitator-cli-auth-repository", () => ({
  getCliSessionFromBearerToken,
  parseBearerToken,
}));

vi.mock("./facilitator-auth-service", () => ({
  getFacilitatorAuthService: () => ({
    hasValidRequestCredentials,
    hasValidSession,
  }),
}));

vi.mock("./facilitator-session", () => ({
  hasFacilitatorPlatformAccess,
  resolveFacilitatorGrantWithBootstrap,
}));

vi.mock("./workshop-instance-repository", () => ({
  getWorkshopInstanceRepository: () => ({
    getInstance,
  }),
}));

vi.mock("./runtime-storage", () => ({
  getRuntimeStorageMode,
}));

vi.mock("./request-integrity", async () => {
  const actual = await vi.importActual<typeof import("./request-integrity")>("./request-integrity");
  return {
    ...actual,
    requireTrustedActionOrigin,
  };
});

function importFacilitatorAccessModule() {
  return import("./facilitator-access");
}

describe("facilitator-access", () => {
  const originalBaseUrl = process.env.NEON_AUTH_BASE_URL;
  const originalCookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.NEON_AUTH_BASE_URL;
    delete process.env.NEON_AUTH_COOKIE_SECRET;
    getRuntimeStorageMode.mockReturnValue("file");
    headers.mockResolvedValue(new Headers());
    hasValidRequestCredentials.mockResolvedValue(true);
    hasValidSession.mockResolvedValue(true);
    hasFacilitatorPlatformAccess.mockResolvedValue(false);
    resolveFacilitatorGrantWithBootstrap.mockResolvedValue({ grant: { id: "grant-1", role: "owner" } });
    parseBearerToken.mockReturnValue(null);
    getCliSessionFromBearerToken.mockResolvedValue(null);
    getInstance.mockImplementation(async (instanceId) => ({ id: instanceId }));
    requireTrustedActionOrigin.mockResolvedValue(true);
  });

  it("allows authorized file-mode requests when given an explicit instanceId", async () => {
    const { requireFacilitatorRequest } = await importFacilitatorAccessModule();
    const response = await requireFacilitatorRequest(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/facilitators", {
        headers: {
          authorization: "Basic abc",
        },
      }),
      "sample-studio-a",
    );

    expect(response).toBeNull();
    expect(hasValidRequestCredentials).toHaveBeenCalledWith({
      authorizationHeader: "Basic abc",
      instanceId: "sample-studio-a",
    });
  });

  it("returns 400 when no instanceId is provided and null is not passed", async () => {
    const { requireFacilitatorRequest } = await importFacilitatorAccessModule();
    const response = await requireFacilitatorRequest(
      new Request("http://localhost/api/anything"),
    );

    expect(response?.status).toBe(400);
    await expect(response?.json()).resolves.toEqual({ ok: false, error: "instanceId is required" });
  });

  it("rejects untrusted non-GET requests before auth checks", async () => {
    const { requireFacilitatorRequest } = await importFacilitatorAccessModule();
    const response = await requireFacilitatorRequest(
      new Request("http://localhost/api/admin/facilitators", {
        method: "POST",
        headers: {
          origin: "https://evil.example.com",
          host: "localhost",
        },
      }),
    );

    expect(response?.status).toBe(403);
    expect(hasValidRequestCredentials).not.toHaveBeenCalled();
  });

  it("uses cli bearer tokens in neon auth mode", async () => {
    const { requireFacilitatorRequest } = await importFacilitatorAccessModule();
    process.env.NEON_AUTH_BASE_URL = "https://auth.example.com";
    process.env.NEON_AUTH_COOKIE_SECRET = "secret-secret-secret-secret";
    getRuntimeStorageMode.mockReturnValue("neon");
    parseBearerToken.mockReturnValue("cli-token");
    getCliSessionFromBearerToken.mockResolvedValue({ tokenHash: "hash", neonUserId: "user-1" });

    const response = await requireFacilitatorRequest(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/facilitators", {
        headers: {
          authorization: "Bearer cli-token",
        },
      }),
      "sample-studio-a",
    );

    expect(response).toBeNull();
    expect(getCliSessionFromBearerToken).toHaveBeenCalledWith("cli-token");
    expect(resolveFacilitatorGrantWithBootstrap).toHaveBeenCalledWith("sample-studio-a", "user-1");
    expect(hasValidSession).not.toHaveBeenCalled();
  });

  it("denies platform-scoped cli bearer requests without platform access", async () => {
    const { requireFacilitatorRequest } = await importFacilitatorAccessModule();
    process.env.NEON_AUTH_BASE_URL = "https://auth.example.com";
    process.env.NEON_AUTH_COOKIE_SECRET = "secret-secret-secret-secret";
    getRuntimeStorageMode.mockReturnValue("neon");
    parseBearerToken.mockReturnValue("cli-token");
    getCliSessionFromBearerToken.mockResolvedValue({ tokenHash: "hash", neonUserId: "user-1" });
    hasFacilitatorPlatformAccess.mockResolvedValue(false);

    const response = await requireFacilitatorRequest(
      new Request("http://localhost/api/workshop/instances", {
        headers: {
          authorization: "Bearer cli-token",
        },
      }),
      null,
    );

    expect(response?.status).toBe(401);
    expect(hasFacilitatorPlatformAccess).toHaveBeenCalledWith("user-1");
  });

  it("returns an explicit not-found error when the target workshop does not exist", async () => {
    const { requireFacilitatorRequest } = await importFacilitatorAccessModule();
    getInstance.mockResolvedValueOnce(null);

    const response = await requireFacilitatorRequest(
      new Request("http://localhost/api/admin/facilitators/ghost"),
      "ghost-instance",
    );

    expect(response?.status).toBe(404);
    await expect(response?.json()).resolves.toEqual({ ok: false, error: "instance not found" });
    expect(hasValidRequestCredentials).not.toHaveBeenCalled();
  });

  it("falls back to session auth in neon mode without a cli token", async () => {
    const { requireFacilitatorRequest } = await importFacilitatorAccessModule();
    process.env.NEON_AUTH_BASE_URL = "https://auth.example.com";
    process.env.NEON_AUTH_COOKIE_SECRET = "secret-secret-secret-secret";
    getRuntimeStorageMode.mockReturnValue("neon");
    hasValidSession.mockResolvedValue(false);

    const response = await requireFacilitatorRequest(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/facilitators"),
      "sample-studio-a",
    );

    expect(response?.status).toBe(401);
    expect(hasValidSession).toHaveBeenCalledWith({ instanceId: "sample-studio-a" });
  });

  it("redirects page access to sign-in when file-mode credentials are missing", async () => {
    const { requireFacilitatorPageAccess } = await importFacilitatorAccessModule();
    headers.mockResolvedValue(new Headers());
    hasValidRequestCredentials.mockResolvedValue(false);

    await requireFacilitatorPageAccess("sample-studio-b");

    expect(redirect).toHaveBeenCalledWith("/admin/sign-in");
    expect(hasValidRequestCredentials).toHaveBeenCalledWith({
      authorizationHeader: null,
      instanceId: "sample-studio-b",
    });
  });

  it("checks trusted origin before server actions", async () => {
    const { requireFacilitatorActionAccess } = await importFacilitatorAccessModule();
    requireTrustedActionOrigin.mockResolvedValue(false);

    await requireFacilitatorActionAccess("sample-studio-a");

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("continues to page access when the action origin is trusted", async () => {
    const { requireFacilitatorActionAccess } = await importFacilitatorAccessModule();
    headers.mockResolvedValue(
      new Headers([["x-harness-authorization", "Basic forwarded"]]),
    );

    await requireFacilitatorActionAccess("sample-studio-a");

    expect(hasValidRequestCredentials).toHaveBeenCalledWith({
      authorizationHeader: "Basic forwarded",
      instanceId: "sample-studio-a",
    });
  });

  afterEach(() => {
    process.env.NEON_AUTH_BASE_URL = originalBaseUrl;
    process.env.NEON_AUTH_COOKIE_SECRET = originalCookieSecret;
  });
  it("throws when neon mode is selected without a complete auth config", async () => {
    const { requireFacilitatorRequest } = await importFacilitatorAccessModule();
    process.env.NEON_AUTH_BASE_URL = "https://auth.example.com";
    delete process.env.NEON_AUTH_COOKIE_SECRET;
    getRuntimeStorageMode.mockReturnValue("neon");

    await expect(
      requireFacilitatorRequest(
        new Request("http://localhost/api/workshop/instances/sample-studio-a/facilitators"),
        "sample-studio-a",
      ),
    ).rejects.toThrow(
      "NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET are required when HARNESS_STORAGE_MODE=neon",
    );
  });
});
