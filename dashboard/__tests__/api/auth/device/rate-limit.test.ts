import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const startDeviceAuthorization = vi.fn();
const pollDeviceAuthorization = vi.fn();

vi.mock("@/lib/auth/server", () => ({
  get auth() {
    return {};
  },
}));

vi.mock("@/lib/facilitator-cli-auth-repository", () => ({
  startDeviceAuthorization,
  pollDeviceAuthorization,
}));

async function resetRateLimiter() {
  const mod = await import("@/lib/device-auth-rate-limit");
  mod.resetDeviceAuthRateLimitForTests();
}

function makeRequest(path: string, body?: unknown) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": "10.0.0.1",
    "user-agent": "vitest",
  };
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("device auth rate limiting", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetRateLimiter();
    startDeviceAuthorization.mockResolvedValue({ ok: true, deviceCode: "device-code" });
  });

  afterEach(async () => {
    await resetRateLimiter();
  });

  it("returns 429 from /start after 5 failures from the same fingerprint", async () => {
    const { POST } = await import("@/app/api/auth/device/start/route");

    // Each call throws from startDeviceAuthorization → records a failure.
    startDeviceAuthorization.mockRejectedValue(new Error("upstream"));
    for (let i = 0; i < 5; i += 1) {
      await expect(async () =>
        POST(makeRequest("/api/auth/device/start")),
      ).rejects.toThrow(/upstream/);
    }

    const sixth = await POST(makeRequest("/api/auth/device/start"));
    expect(sixth.status).toBe(429);
    await expect(sixth.json()).resolves.toEqual({ error: "rate_limited" });
  });

  it("returns 429 from /poll after 5 invalid device codes from the same fingerprint", async () => {
    const { POST } = await import("@/app/api/auth/device/poll/route");
    pollDeviceAuthorization.mockResolvedValue({ status: "invalid_device_code" });

    for (let i = 0; i < 5; i += 1) {
      const res = await POST(makeRequest("/api/auth/device/poll", { deviceCode: "bad" }));
      expect(res.status).toBe(400);
    }

    const sixth = await POST(makeRequest("/api/auth/device/poll", { deviceCode: "bad" }));
    expect(sixth.status).toBe(429);
  });

  it("does not count `authorization_pending` as a failure", async () => {
    const { POST } = await import("@/app/api/auth/device/poll/route");
    pollDeviceAuthorization.mockResolvedValue({
      status: "authorization_pending",
      intervalSeconds: 5,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    for (let i = 0; i < 10; i += 1) {
      const res = await POST(makeRequest("/api/auth/device/poll", { deviceCode: "pending" }));
      expect(res.status).toBe(200);
    }
  });

  it("tracks fingerprints separately", async () => {
    const { POST } = await import("@/app/api/auth/device/poll/route");
    pollDeviceAuthorization.mockResolvedValue({ status: "invalid_device_code" });

    function requestFromIp(ip: string) {
      return new Request("http://localhost/api/auth/device/poll", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": ip,
          "user-agent": "vitest",
        },
        body: JSON.stringify({ deviceCode: "bad" }),
      });
    }

    for (let i = 0; i < 5; i += 1) await POST(requestFromIp("10.0.0.1"));
    const blocked = await POST(requestFromIp("10.0.0.1"));
    expect(blocked.status).toBe(429);

    // A different IP still has full budget.
    const fresh = await POST(requestFromIp("10.0.0.2"));
    expect(fresh.status).toBe(400);
  });
});
