import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BlueprintConflictError,
  BlueprintNotFoundError,
  FileBlueprintRepository,
} from "./blueprint-repository";

describe("FileBlueprintRepository", () => {
  let tmpDir: string;
  let prevDataDir: string | undefined;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "blueprint-repo-"));
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
    return new FileBlueprintRepository();
  }

  function baseBody(overrides: Record<string, unknown> = {}) {
    return {
      schemaVersion: 1,
      name: "test",
      language: "en",
      teamMode: true,
      title: "Test Workshop",
      phases: [],
      ...overrides,
    };
  }

  it("seeds harness-lab-default on first access", async () => {
    const repo = makeRepo();
    const list = await repo.list();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("harness-lab-default");
    expect(list[0].language).toBe("en");
    expect(list[0].teamMode).toBe(true);
    expect((list[0].body.phases as unknown[]).length).toBeGreaterThan(0);
  });

  it("returns null for an unknown id", async () => {
    const repo = makeRepo();
    expect(await repo.get("does-not-exist")).toBeNull();
  });

  it("creates a new blueprint with version 1", async () => {
    const repo = makeRepo();
    const created = await repo.put({
      id: "half-day",
      name: "Half day",
      body: baseBody({ name: "half-day" }),
      language: "en",
      teamMode: false,
    });
    expect(created.version).toBe(1);
    expect(created.teamMode).toBe(false);
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(created.updatedAt).toEqual(created.createdAt);

    const read = await repo.get("half-day");
    expect(read).toEqual(created);
  });

  it("derives language and teamMode from body when not passed explicitly", async () => {
    const repo = makeRepo();
    const created = await repo.put({
      id: "cs-default",
      body: baseBody({ language: "cs", teamMode: false }),
    });
    expect(created.language).toBe("cs");
    expect(created.teamMode).toBe(false);
  });

  it("bumps version on upsert", async () => {
    const repo = makeRepo();
    const first = await repo.put({ id: "x", body: baseBody() });
    expect(first.version).toBe(1);
    const second = await repo.put({
      id: "x",
      body: baseBody({ title: "Updated" }),
    });
    expect(second.version).toBe(2);
    expect((second.body as { title: string }).title).toBe("Updated");
  });

  it("respects expectedVersion for optimistic concurrency", async () => {
    const repo = makeRepo();
    await repo.put({ id: "x", body: baseBody() });
    await expect(
      repo.put({
        id: "x",
        body: baseBody({ title: "stale" }),
        expectedVersion: 999,
      }),
    ).rejects.toBeInstanceOf(BlueprintConflictError);
  });

  it("deletes a blueprint idempotently", async () => {
    const repo = makeRepo();
    await repo.put({ id: "rm-me", body: baseBody() });
    await repo.delete("rm-me");
    expect(await repo.get("rm-me")).toBeNull();
    await expect(repo.delete("rm-me")).resolves.not.toThrow();
  });

  it("forks an existing blueprint into a new id", async () => {
    const repo = makeRepo();
    const forked = await repo.fork("harness-lab-default", "cs-default", "cs-default");
    expect(forked.id).toBe("cs-default");
    expect(forked.version).toBe(1);
    expect((forked.body as { phases: unknown[] }).phases).toEqual(
      (await repo.get("harness-lab-default"))!.body.phases,
    );
  });

  it("rejects fork when target id already exists", async () => {
    const repo = makeRepo();
    await repo.put({ id: "cs-default", body: baseBody() });
    await expect(
      repo.fork("harness-lab-default", "cs-default"),
    ).rejects.toThrow(/already exists/);
  });

  it("rejects fork when source is missing", async () => {
    const repo = makeRepo();
    await expect(repo.fork("does-not-exist", "new-one")).rejects.toBeInstanceOf(
      BlueprintNotFoundError,
    );
  });

  it("list returns blueprints sorted by id", async () => {
    const repo = makeRepo();
    await repo.put({ id: "zeta", body: baseBody() });
    await repo.put({ id: "alpha", body: baseBody() });
    const list = await repo.list();
    const ids = list.map((b) => b.id);
    expect(ids).toEqual(["alpha", "harness-lab-default", "zeta"]);
  });
});
