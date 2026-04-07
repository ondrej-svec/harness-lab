import { beforeEach, describe, expect, it, vi } from "vitest";

const startDeviceAuthorization = vi.fn();
const pollDeviceAuthorization = vi.fn();
const approveDeviceAuthorizationForCurrentSession = vi.fn();
const denyDeviceAuthorization = vi.fn();
const getCliSessionFromBearerToken = vi.fn();
const revokeCliSessionFromBearerToken = vi.fn();
const parseBearerToken = vi.fn();

let authMock: Record<string, unknown> | null;

vi.mock("@/lib/auth/server", () => ({
  get auth() {
    return authMock;
  },
}));

vi.mock("@/lib/facilitator-cli-auth-repository", () => ({
  startDeviceAuthorization,
  pollDeviceAuthorization,
  approveDeviceAuthorizationForCurrentSession,
  denyDeviceAuthorization,
  getCliSessionFromBearerToken,
  revokeCliSessionFromBearerToken,
  parseBearerToken,
}));

describe("device auth route edges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    authMock = {};
    startDeviceAuthorization.mockResolvedValue({ ok: true, deviceCode: "device-code" });
    pollDeviceAuthorization.mockResolvedValue({ status: "authorized" });
    approveDeviceAuthorizationForCurrentSession.mockResolvedValue({ ok: true });
    denyDeviceAuthorization.mockResolvedValue({ ok: true });
    getCliSessionFromBearerToken.mockResolvedValue({ id: "session-1" });
    revokeCliSessionFromBearerToken.mockResolvedValue({ ok: true });
    parseBearerToken.mockReturnValue("bearer-token");
  });

  it("returns 503 from start when device auth is unavailable", async () => {
    authMock = null;
    const { POST } = await import("@/app/api/auth/device/start/route");

    const response = await POST(new Request("http://localhost/api/auth/device/start", { method: "POST" }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "device_auth_unavailable" });
  });

  it("returns 400 from poll when the device code is missing", async () => {
    const { POST } = await import("@/app/api/auth/device/poll/route");

    const response = await POST(
      new Request("http://localhost/api/auth/device/poll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "deviceCode is required" });
  });

  it("returns 400 from poll for invalid device codes", async () => {
    pollDeviceAuthorization.mockResolvedValue({ status: "invalid_device_code" });
    const { POST } = await import("@/app/api/auth/device/poll/route");

    const response = await POST(
      new Request("http://localhost/api/auth/device/poll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceCode: "bad-device" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ status: "invalid_device_code" });
  });

  it("returns 400 from approve when the user code is missing", async () => {
    const { POST } = await import("@/app/api/auth/device/approve/route");

    const response = await POST(
      new Request("http://localhost/api/auth/device/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "userCode is required" });
  });

  it("returns 401 from approve when the repository rejects the user code", async () => {
    approveDeviceAuthorizationForCurrentSession.mockResolvedValue({ ok: false, error: "invalid_user_code" });
    const { POST } = await import("@/app/api/auth/device/approve/route");

    const response = await POST(
      new Request("http://localhost/api/auth/device/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userCode: "ABCD-EFGH" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "invalid_user_code" });
  });

  it("returns 400 from deny when the user code is missing", async () => {
    const { POST } = await import("@/app/api/auth/device/deny/route");

    const response = await POST(
      new Request("http://localhost/api/auth/device/deny", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "userCode is required" });
  });

  it("returns 404 from deny when the repository cannot find the code", async () => {
    denyDeviceAuthorization.mockResolvedValue({ ok: false, error: "unknown_user_code" });
    const { POST } = await import("@/app/api/auth/device/deny/route");

    const response = await POST(
      new Request("http://localhost/api/auth/device/deny", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userCode: "ABCD-EFGH" }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "unknown_user_code" });
  });

  it("returns 401 from session when the bearer token is missing", async () => {
    parseBearerToken.mockReturnValue(null);
    const { GET } = await import("@/app/api/auth/device/session/route");

    const response = await GET(new Request("http://localhost/api/auth/device/session"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "bearer_token_required" });
  });

  it("returns 401 from session when the CLI session is invalid", async () => {
    getCliSessionFromBearerToken.mockResolvedValue(null);
    const { GET } = await import("@/app/api/auth/device/session/route");

    const response = await GET(
      new Request("http://localhost/api/auth/device/session", {
        headers: { authorization: "Bearer bearer-token" },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "invalid_session" });
  });

  it("returns 401 from logout when the bearer token is missing", async () => {
    parseBearerToken.mockReturnValue(null);
    const { POST } = await import("@/app/api/auth/device/logout/route");

    const response = await POST(new Request("http://localhost/api/auth/device/logout", { method: "POST" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "bearer_token_required" });
  });
});
