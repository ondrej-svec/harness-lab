import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileArtifactRepository, generateArtifactId } from "./artifact-repository";

describe("FileArtifactRepository", () => {
  let tmpDir: string;
  let prevDataDir: string | undefined;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "artifact-repo-"));
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
    return new FileArtifactRepository();
  }

  function baseInput(overrides: Partial<Parameters<FileArtifactRepository["create"]>[0]> = {}) {
    return {
      instanceId: "inst-a",
      blobKey: "artifacts/inst-a/xyz/file.html",
      contentType: "text/html",
      filename: "file.html",
      byteSize: 1024,
      label: "Case study",
      ...overrides,
    };
  }

  it("returns null for an unknown (instance, id) pair", async () => {
    const repo = makeRepo();
    expect(await repo.get("inst-a", "missing")).toBeNull();
  });

  it("creates an artifact with a generated id and round-trips it", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseInput());
    expect(created.id).toBeTruthy();
    expect(created.id).toHaveLength(16);
    expect(created.description).toBeNull();
    expect(created.uploadedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const read = await repo.get("inst-a", created.id);
    expect(read).toEqual(created);
  });

  it("accepts an explicit id + description + uploadedAt on create", async () => {
    const repo = makeRepo();
    const created = await repo.create(
      baseInput({ id: "fixed-id", description: "desc", uploadedAt: "2026-04-21T10:00:00.000Z" }),
    );
    expect(created.id).toBe("fixed-id");
    expect(created.description).toBe("desc");
    expect(created.uploadedAt).toBe("2026-04-21T10:00:00.000Z");
  });

  it("rejects duplicate id within the same instance", async () => {
    const repo = makeRepo();
    await repo.create(baseInput({ id: "dup" }));
    await expect(repo.create(baseInput({ id: "dup" }))).rejects.toThrow(/collision/);
  });

  it("isolates artifacts by instance id", async () => {
    const repo = makeRepo();
    const a = await repo.create(baseInput({ instanceId: "inst-a", label: "A" }));
    const b = await repo.create(baseInput({ instanceId: "inst-b", label: "B" }));

    expect(await repo.get("inst-a", a.id)).not.toBeNull();
    // Cross-cohort lookup — the a.id must not resolve under inst-b.
    expect(await repo.get("inst-b", a.id)).toBeNull();
    expect(await repo.get("inst-a", b.id)).toBeNull();
  });

  it("listForInstance returns artifacts newest-first and only for the given instance", async () => {
    const repo = makeRepo();
    const older = await repo.create(
      baseInput({ label: "older", uploadedAt: "2026-04-20T10:00:00.000Z" }),
    );
    const newer = await repo.create(
      baseInput({ label: "newer", uploadedAt: "2026-04-21T10:00:00.000Z" }),
    );
    await repo.create(baseInput({ instanceId: "inst-b", label: "other-cohort" }));

    const rows = await repo.listForInstance("inst-a");
    expect(rows.map((r) => r.id)).toEqual([newer.id, older.id]);
    expect(rows.map((r) => r.label)).toEqual(["newer", "older"]);
  });

  it("delete removes the artifact; subsequent get returns null", async () => {
    const repo = makeRepo();
    const created = await repo.create(baseInput());
    await repo.delete("inst-a", created.id);
    expect(await repo.get("inst-a", created.id)).toBeNull();
  });

  it("delete is a no-op for unknown id", async () => {
    const repo = makeRepo();
    await expect(repo.delete("inst-a", "ghost")).resolves.toBeUndefined();
  });

  it("rejects unsafe instance ids", async () => {
    const repo = makeRepo();
    await expect(repo.create(baseInput({ instanceId: "../evil" }))).rejects.toThrow();
    await expect(repo.get("../evil", "x")).rejects.toThrow();
    await expect(repo.listForInstance("../evil")).rejects.toThrow();
    await expect(repo.delete("../evil", "x")).rejects.toThrow();
  });
});

describe("generateArtifactId", () => {
  it("returns a 16-char url-safe string", () => {
    for (let i = 0; i < 10; i += 1) {
      const id = generateArtifactId();
      expect(id).toHaveLength(16);
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("is unlikely to collide", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      seen.add(generateArtifactId());
    }
    expect(seen.size).toBe(1000);
  });
});
