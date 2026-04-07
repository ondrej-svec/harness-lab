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
});
