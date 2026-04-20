import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookies = vi.fn();

vi.mock("next/headers", () => ({
  cookies,
}));

describe("neon-auth-proxy signOut", () => {
  const originalFetch = globalThis.fetch;
  const originalBaseUrl = process.env.NEON_AUTH_BASE_URL;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEON_AUTH_BASE_URL = "https://auth.example.com";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalBaseUrl === undefined) {
      delete process.env.NEON_AUTH_BASE_URL;
    } else {
      process.env.NEON_AUTH_BASE_URL = originalBaseUrl;
    }
  });

  it("clears local Neon auth cookies even when the upstream sign-out fails", async () => {
    const set = vi.fn();
    cookies.mockResolvedValue({
      getAll: () => [
        { name: "__Secure-neon-auth.session_token", value: "session-token" },
        { name: "__Secure-neon-auth.local.session_data", value: "session-data" },
        { name: "harness_event_session", value: "participant-session" },
      ],
      set,
    });
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "upstream unavailable" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    ) as typeof globalThis.fetch;

    const { signOut } = await import("./neon-auth-proxy");
    const result = await signOut();

    expect(result).toEqual({ ok: false });
    expect(set).toHaveBeenCalledWith(
      "__Secure-neon-auth.session_token",
      "",
      expect.objectContaining({ expires: new Date(0), maxAge: 0, path: "/" }),
    );
    expect(set).toHaveBeenCalledWith(
      "__Secure-neon-auth.local.session_data",
      "",
      expect.objectContaining({ expires: new Date(0), maxAge: 0, path: "/" }),
    );
    expect(set).not.toHaveBeenCalledWith(
      "harness_event_session",
      expect.anything(),
      expect.anything(),
    );
  });

  it("forwards upstream cookie clears before forcing local Neon cookie cleanup", async () => {
    const set = vi.fn();
    cookies.mockResolvedValue({
      getAll: () => [
        { name: "__Secure-neon-auth.session_token", value: "session-token" },
        { name: "__Secure-neon-auth.local.session_data", value: "session-data" },
      ],
      set,
    });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        getSetCookie: () => [
          "__Secure-neon-auth.session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        ],
      },
    }) as typeof globalThis.fetch;

    const { signOut } = await import("./neon-auth-proxy");
    const result = await signOut();

    expect(result).toEqual({ ok: true });
    expect(set).toHaveBeenCalledWith(
      "__Secure-neon-auth.session_token",
      "",
      expect.objectContaining({ httpOnly: true, maxAge: 0, path: "/", sameSite: "lax", secure: true }),
    );
    expect(set).toHaveBeenCalledWith(
      "__Secure-neon-auth.local.session_data",
      "",
      expect.objectContaining({ expires: new Date(0), maxAge: 0, path: "/" }),
    );
  });
});
