import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { seedWorkshopState } from "./workshop-data";

describe("workshop-state-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-state-"));
    process.env.HARNESS_DATA_DIR = tempDir;
    delete process.env.HARNESS_STATE_PATH;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    delete process.env.HARNESS_STATE_PATH;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./workshop-state-repository");
    mod.setWorkshopStateRepositoryForTests(null);
  });

  it("creates and persists workshop state in file mode", async () => {
    const { FileWorkshopStateRepository } = await import("./workshop-state-repository");
    const repository = new FileWorkshopStateRepository();

    const initial = await repository.getState("instance-a");
    expect(initial).toMatchObject({ workshopId: "instance-a" });

    const updated = {
      ...initial,
      workshopMeta: {
        ...initial.workshopMeta,
        title: "Updated",
      },
    };
    await repository.saveState("instance-a", updated);

    await expect(repository.getState("instance-a")).resolves.toMatchObject({
      workshopMeta: { title: "Updated" },
    });
  });

  it("prefers an override repository", async () => {
    const mod = await import("./workshop-state-repository");
    const override = {
      getState: vi.fn().mockResolvedValue(seedWorkshopState),
      saveState: vi.fn().mockResolvedValue(undefined),
    };
    mod.setWorkshopStateRepositoryForTests(override);

    expect(mod.getWorkshopStateRepository()).toBe(override);
  });

  it("hydrates a missing neon instance from the workshop instance repository", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ workshop_state: { ...seedWorkshopState, workshopId: "neon-a" } }]);
    const sqlTag = vi.fn().mockResolvedValue(undefined);
    const sql = Object.assign(sqlTag, { query });

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => sql,
    }));
    vi.doMock("./workshop-instance-repository", () => ({
      getWorkshopInstanceRepository: () => ({
        getInstance: vi.fn().mockResolvedValue({
          id: "neon-a",
          templateId: "sample-lab-d",
          workshopMeta: { title: "Harness Lab" },
        }),
      }),
    }));

    const { NeonWorkshopStateRepository } = await import("./workshop-state-repository");
    const repository = new NeonWorkshopStateRepository();

    await expect(repository.getState("neon-a")).resolves.toMatchObject({ workshopId: "neon-a" });
    expect(query).toHaveBeenCalledTimes(2);
    expect(sqlTag).toHaveBeenCalled();
  });

  it("updates workshop state in neon mode", async () => {
    const query = vi.fn().mockResolvedValue([{ id: "neon-a" }]);
    const sqlTag = vi.fn().mockResolvedValue(undefined);
    const sql = Object.assign(sqlTag, { query });

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => sql,
    }));
    vi.doMock("./workshop-instance-repository", () => ({
      getWorkshopInstanceRepository: () => ({
        getInstance: vi.fn(),
      }),
    }));

    const { NeonWorkshopStateRepository } = await import("./workshop-state-repository");
    const repository = new NeonWorkshopStateRepository();
    const state = { ...seedWorkshopState, workshopId: "neon-a" };

    await repository.saveState("neon-a", state);

    expect(sqlTag).toHaveBeenCalled();
  });
});
