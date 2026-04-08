import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { rm } from "node:fs/promises";
import { sampleWorkshopInstances } from "./workshop-data";

describe("workshop-instance-repository", () => {
  const originalInstancesPath = process.env.HARNESS_INSTANCES_PATH;
  const tempInstancesPath = path.join(process.cwd(), "data", "test-instances.json");

  beforeEach(() => {
    vi.resetModules();
    process.env.HARNESS_INSTANCES_PATH = tempInstancesPath;
  });

  afterEach(async () => {
    const mod = await import("./workshop-instance-repository");
    mod.setWorkshopInstanceRepositoryForTests(null);
    await rm(tempInstancesPath, { force: true });
    if (originalInstancesPath === undefined) {
      delete process.env.HARNESS_INSTANCES_PATH;
    } else {
      process.env.HARNESS_INSTANCES_PATH = originalInstancesPath;
    }
  });

  it("returns the sample repository by default", async () => {
    const mod = await import("./workshop-instance-repository");

    const repository = mod.getWorkshopInstanceRepository();
    await expect(repository.getDefaultInstanceId()).resolves.toBe("sample-studio-a");
    await expect(repository.getInstance("sample-studio-a")).resolves.toMatchObject({
      id: "sample-studio-a",
    });
    await expect(repository.getInstance("missing")).resolves.toBeNull();
    await expect(repository.listInstances()).resolves.toEqual(sampleWorkshopInstances);
  });

  it("creates, updates, and soft-removes instances in the file repository", async () => {
    const mod = await import("./workshop-instance-repository");
    const repository = new mod.FileWorkshopInstanceRepository();
    const instance = {
      ...sampleWorkshopInstances[0],
      id: "client-workshop-001",
      status: "created" as const,
    };

    await repository.createInstance(instance);
    await expect(repository.getInstance("client-workshop-001")).resolves.toMatchObject({
      id: "client-workshop-001",
      status: "created",
    });

    await repository.updateInstance("client-workshop-001", {
      ...instance,
      status: "prepared",
    });
    await expect(repository.getInstance("client-workshop-001")).resolves.toMatchObject({
      status: "prepared",
    });

    await repository.removeInstance("client-workshop-001", "2026-04-07T12:00:00.000Z");
    await expect(repository.listInstances()).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "client-workshop-001" })]),
    );
    await expect(repository.listInstances({ includeRemoved: true })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "client-workshop-001",
          status: "removed",
          removedAt: "2026-04-07T12:00:00.000Z",
        }),
      ]),
    );
  });

  it("honors a test override repository", async () => {
    const mod = await import("./workshop-instance-repository");
    const override = {
      getDefaultInstanceId: vi.fn().mockResolvedValue("custom"),
      getInstance: vi.fn().mockResolvedValue({ id: "custom" }),
      listInstances: vi.fn().mockResolvedValue([{ id: "custom" }]),
      createInstance: vi.fn(),
      updateInstance: vi.fn(),
      removeInstance: vi.fn(),
    };
    mod.setWorkshopInstanceRepositoryForTests(override);

    const repository = mod.getWorkshopInstanceRepository();
    await expect(repository.getDefaultInstanceId()).resolves.toBe("custom");
    await expect(repository.listInstances()).resolves.toEqual([{ id: "custom" }]);
  });

  it("falls back to the legacy Neon schema when lifecycle columns are missing", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "legacy-a",
          template_id: "blueprint-default",
          status: "prepared",
          blueprint_id: null,
          blueprint_version: null,
          imported_at: null,
          removed_at: null,
          workshop_meta: sampleWorkshopInstances[0].workshopMeta,
        },
      ])
      .mockResolvedValueOnce([{ id: "legacy-a" }]);

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonWorkshopInstanceRepository } = await import("./workshop-instance-repository");
    const repository = new NeonWorkshopInstanceRepository();

    await expect(repository.listInstances()).resolves.toEqual([
      expect.objectContaining({
        id: "legacy-a",
        blueprintId: sampleWorkshopInstances[0].blueprintId,
        blueprintVersion: sampleWorkshopInstances[0].blueprintVersion,
      }),
    ]);
    await expect(repository.getDefaultInstanceId()).resolves.toBe("legacy-a");
    expect(query.mock.calls[1]?.[0]).not.toContain("removed_at IS NULL");
    expect(query.mock.calls[1]?.[0]).toContain("NULL::text AS blueprint_id");
    expect(query.mock.calls[2]?.[0]).toContain("WHERE status <> 'removed'");
  });

  it("omits new lifecycle columns when writing to the legacy Neon schema", async () => {
    const query = vi.fn().mockResolvedValueOnce([]).mockResolvedValue(undefined);

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonWorkshopInstanceRepository } = await import("./workshop-instance-repository");
    const repository = new NeonWorkshopInstanceRepository();

    await repository.createInstance(sampleWorkshopInstances[0]);
    expect(query.mock.calls[1]?.[0]).not.toContain("blueprint_id");
    expect(query.mock.calls[1]?.[0]).not.toContain("imported_at");

    await repository.removeInstance(sampleWorkshopInstances[0].id, "2026-04-07T12:00:00.000Z");
    expect(query.mock.calls[2]?.[0]).not.toContain("removed_at = $2::timestamptz");
  });
});
