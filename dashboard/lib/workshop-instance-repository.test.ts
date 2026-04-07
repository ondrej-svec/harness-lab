import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleWorkshopInstances } from "./workshop-data";

describe("workshop-instance-repository", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(async () => {
    const mod = await import("./workshop-instance-repository");
    mod.setWorkshopInstanceRepositoryForTests(null);
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

  it("honors a test override repository", async () => {
    const mod = await import("./workshop-instance-repository");
    const override = {
      getDefaultInstanceId: vi.fn().mockResolvedValue("custom"),
      getInstance: vi.fn().mockResolvedValue({ id: "custom" }),
      listInstances: vi.fn().mockResolvedValue([{ id: "custom" }]),
    };
    mod.setWorkshopInstanceRepositoryForTests(override);

    const repository = mod.getWorkshopInstanceRepository();
    await expect(repository.getDefaultInstanceId()).resolves.toBe("custom");
    await expect(repository.listInstances()).resolves.toEqual([{ id: "custom" }]);
  });
});
