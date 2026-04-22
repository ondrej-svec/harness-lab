import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("health route", () => {
  const originalMode = process.env.HARNESS_STORAGE_MODE;
  const originalUrl = process.env.HARNESS_DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalMode === undefined) {
      delete process.env.HARNESS_STORAGE_MODE;
    } else {
      process.env.HARNESS_STORAGE_MODE = originalMode;
    }
    if (originalUrl === undefined) {
      delete process.env.HARNESS_DATABASE_URL;
    } else {
      process.env.HARNESS_DATABASE_URL = originalUrl;
    }
    vi.doUnmock("@/lib/neon-db");
  });

  it("returns ok in file mode without a DB ping", async () => {
    delete process.env.HARNESS_STORAGE_MODE;

    const pingSpy = vi.fn();
    vi.doMock("@/lib/neon-db", () => ({
      getNeonSql: () => pingSpy,
    }));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, mode: "file" });
    expect(typeof body.ts).toBe("string");
    expect(pingSpy).not.toHaveBeenCalled();
  });

  it("returns ok in neon mode when the DB ping succeeds", async () => {
    process.env.HARNESS_STORAGE_MODE = "neon";
    process.env.HARNESS_DATABASE_URL = "postgres://example";

    const sqlTag = vi.fn(async () => [{ "?column?": 1 }]);
    vi.doMock("@/lib/neon-db", () => ({
      getNeonSql: () => sqlTag,
    }));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, mode: "neon" });
    expect(sqlTag).toHaveBeenCalledTimes(1);
  });

  it("returns 503 in neon mode when the DB ping fails", async () => {
    process.env.HARNESS_STORAGE_MODE = "neon";
    process.env.HARNESS_DATABASE_URL = "postgres://example";

    const sqlTag = vi.fn(async () => {
      throw new Error("connection refused");
    });
    vi.doMock("@/lib/neon-db", () => ({
      getNeonSql: () => sqlTag,
    }));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ ok: false, mode: "neon" });
  });

  it("returns 503 in neon mode when the DB URL is not configured", async () => {
    process.env.HARNESS_STORAGE_MODE = "neon";
    delete process.env.HARNESS_DATABASE_URL;

    vi.doMock("@/lib/neon-db", async () => await vi.importActual("@/lib/neon-db"));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ ok: false, mode: "neon" });
  });
});
