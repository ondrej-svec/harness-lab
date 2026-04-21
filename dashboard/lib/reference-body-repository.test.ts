import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileReferenceBodyRepository } from "./reference-body-repository";

describe("FileReferenceBodyRepository", () => {
  let tmpDir: string;
  let prevDataDir: string | undefined;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "reference-body-repo-"));
    prevDataDir = process.env.HARNESS_DATA_DIR;
    process.env.HARNESS_DATA_DIR = tmpDir;
  });

  afterEach(() => {
    if (prevDataDir === undefined) {
      delete process.env.HARNESS_DATA_DIR;
    } else {
      process.env.HARNESS_DATA_DIR = prevDataDir;
    }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeRepo() {
    return new FileReferenceBodyRepository();
  }

  it("returns null for an unknown (instance, item) pair", async () => {
    const repo = makeRepo();
    expect(await repo.get("inst-a", "unknown")).toBeNull();
  });

  it("upserts a new body and round-trips it", async () => {
    const repo = makeRepo();
    const record = await repo.upsert("inst-a", "kit", "# Hello");
    expect(record.body).toBe("# Hello");
    const read = await repo.get("inst-a", "kit");
    expect(read?.body).toBe("# Hello");
  });

  it("upsert replaces an existing body", async () => {
    const repo = makeRepo();
    await repo.upsert("inst-a", "kit", "# First");
    const updated = await repo.upsert("inst-a", "kit", "# Second");
    expect(updated.body).toBe("# Second");
    const read = await repo.get("inst-a", "kit");
    expect(read?.body).toBe("# Second");
  });

  it("delete removes the override and subsequent get returns null", async () => {
    const repo = makeRepo();
    await repo.upsert("inst-a", "kit", "# Body");
    await repo.delete("inst-a", "kit");
    expect(await repo.get("inst-a", "kit")).toBeNull();
  });

  it("delete is a no-op for unknown item", async () => {
    const repo = makeRepo();
    await expect(repo.delete("inst-a", "ghost")).resolves.toBeUndefined();
  });

  it("listForInstance returns bodies newest-first", async () => {
    const repo = makeRepo();
    await repo.upsert("inst-a", "older", "x");
    await new Promise((resolve) => setTimeout(resolve, 5));
    await repo.upsert("inst-a", "newer", "y");
    const rows = await repo.listForInstance("inst-a");
    expect(rows.map((r) => r.itemId)).toEqual(["newer", "older"]);
  });

  it("isolates bodies by instance id", async () => {
    const repo = makeRepo();
    await repo.upsert("inst-a", "kit", "a-body");
    await repo.upsert("inst-b", "kit", "b-body");
    expect((await repo.get("inst-a", "kit"))?.body).toBe("a-body");
    expect((await repo.get("inst-b", "kit"))?.body).toBe("b-body");
  });

  it("rejects unsafe instance ids", async () => {
    const repo = makeRepo();
    await expect(repo.upsert("../evil", "x", "body")).rejects.toThrow();
    await expect(repo.get("../evil", "x")).rejects.toThrow();
  });
});
