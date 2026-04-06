import { describe, expect, it } from "vitest";
import { decodeBasicAuthHeader, isProtectedPath } from "./admin-auth";

function encodeBasicAuth(value: string) {
  return `Basic ${Buffer.from(value).toString("base64")}`;
}

describe("admin-auth", () => {
  it("protects admin routes, monitoring, challenge completions, and non-GET write APIs", () => {
    expect(isProtectedPath("/admin", "GET")).toBe(true);
    expect(isProtectedPath("/admin/settings", "GET")).toBe(true);
    expect(isProtectedPath("/admin/sign-in", "GET")).toBe(true);
    expect(isProtectedPath("/api/admin/teams", "POST")).toBe(true);
    expect(isProtectedPath("/api/monitoring", "GET")).toBe(true);
    expect(isProtectedPath("/api/challenges/agents-md/complete", "POST")).toBe(true);
    expect(isProtectedPath("/api/agenda", "PATCH")).toBe(true);
    expect(isProtectedPath("/api/workshop", "POST")).toBe(true);
    expect(isProtectedPath("/api/workshop/archive", "POST")).toBe(true);
  });

  it("keeps participant-safe reads unprotected", () => {
    expect(isProtectedPath("/", "GET")).toBe(false);
    expect(isProtectedPath("/api/agenda", "GET")).toBe(false);
    expect(isProtectedPath("/api/teams", "GET")).toBe(false);
    expect(isProtectedPath("/api/event-context/core", "GET")).toBe(false);
    expect(isProtectedPath("/api/challenges", "GET")).toBe(false);
  });

  it("decodes a valid basic auth header (file-mode fallback)", () => {
    expect(decodeBasicAuthHeader(encodeBasicAuth("facilitator:secret"))).toEqual({
      username: "facilitator",
      password: "secret",
    });
  });

  it("rejects malformed basic auth headers", () => {
    expect(decodeBasicAuthHeader(null)).toBeNull();
    expect(decodeBasicAuthHeader("Bearer token")).toBeNull();
    expect(decodeBasicAuthHeader("Basic !!!not-base64!!!")).toBeNull();
    expect(decodeBasicAuthHeader(encodeBasicAuth("missing-separator"))).toBeNull();
  });
});
