import { beforeEach, describe, expect, it, vi } from "vitest";

const headers = vi.fn();

vi.mock("next/headers", () => ({
  headers,
}));

const requestIntegrityModulePromise = import("./request-integrity");

describe("request-integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trusts matching origin and host headers", async () => {
    const { isTrustedOrigin } = await requestIntegrityModulePromise;

    expect(
      isTrustedOrigin({
        originHeader: "https://example.com",
        hostHeader: "example.com",
      }),
    ).toBe(true);
  });

  it("uses the forwarded host when present", async () => {
    const { isTrustedOrigin } = await requestIntegrityModulePromise;

    expect(
      isTrustedOrigin({
        originHeader: "https://public.example.com",
        hostHeader: "internal.example.local",
        forwardedHostHeader: "public.example.com",
      }),
    ).toBe(true);
  });

  it("falls back to the request url host when host headers are missing", async () => {
    const { isTrustedOrigin } = await requestIntegrityModulePromise;

    expect(
      isTrustedOrigin({
        originHeader: "https://preview.example.com",
        hostHeader: null,
        requestUrl: "https://preview.example.com/api/admin",
      }),
    ).toBe(true);
  });

  it("rejects malformed or missing origin data", async () => {
    const { isTrustedOrigin, untrustedOriginResponse } = await requestIntegrityModulePromise;

    expect(
      isTrustedOrigin({
        originHeader: "not-a-url",
        hostHeader: "example.com",
      }),
    ).toBe(false);
    expect(
      isTrustedOrigin({
        originHeader: null,
        hostHeader: "example.com",
      }),
    ).toBe(false);
    expect(untrustedOriginResponse().status).toBe(403);
  });

  it("requires a trusted origin from request headers for server actions", async () => {
    const { requireTrustedActionOrigin } = await requestIntegrityModulePromise;
    headers.mockResolvedValue(
      new Headers([
        ["origin", "https://example.com"],
        ["host", "example.com"],
      ]),
    );

    await expect(requireTrustedActionOrigin()).resolves.toBe(true);

    headers.mockResolvedValue(
      new Headers([
        ["origin", "https://evil.example.com"],
        ["host", "example.com"],
      ]),
    );

    await expect(requireTrustedActionOrigin()).resolves.toBe(false);
  });
});
