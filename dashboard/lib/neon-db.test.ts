import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("neon-db", () => {
  const originalHarness = process.env.HARNESS_DATABASE_URL;
  const originalDatabase = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.HARNESS_DATABASE_URL;
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    process.env.HARNESS_DATABASE_URL = originalHarness;
    process.env.DATABASE_URL = originalDatabase;
  });

  it("throws when no connection string is configured", async () => {
    const { getNeonSql } = await import("./neon-db");

    expect(() => getNeonSql()).toThrow("HARNESS_DATABASE_URL or DATABASE_URL is required");
  });

  it("prefers HARNESS_DATABASE_URL over DATABASE_URL", async () => {
    const neon = vi.fn().mockReturnValue("sql-client");
    process.env.HARNESS_DATABASE_URL = "postgres://harness";
    process.env.DATABASE_URL = "postgres://database";

    vi.doMock("@neondatabase/serverless", () => ({ neon }));
    const { getNeonSql } = await import("./neon-db");

    expect(getNeonSql()).toBe("sql-client");
    expect(neon).toHaveBeenCalledWith("postgres://harness");
  });
});
