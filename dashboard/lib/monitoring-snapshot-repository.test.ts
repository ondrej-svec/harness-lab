import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

const snapshots = [{ teamId: "t1", agentsFile: true, skillsCount: 2, commitsLast30Min: 4, testsVisible: 1 }];

describe("monitoring-snapshot-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-monitoring-"));
    process.env.HARNESS_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./monitoring-snapshot-repository");
    mod.setMonitoringSnapshotRepositoryForTests(null);
  });

  it("stores snapshots in file mode", async () => {
    const { FileMonitoringSnapshotRepository } = await import("./monitoring-snapshot-repository");
    const repository = new FileMonitoringSnapshotRepository();

    await expect(repository.getSnapshots("instance-a")).resolves.toEqual([]);
    await repository.replaceSnapshots("instance-a", snapshots);
    await expect(repository.getSnapshots("instance-a")).resolves.toEqual(snapshots);
    await repository.deleteOlderThan("instance-a", "2026-04-07T12:00:00.000Z");
    await expect(repository.getSnapshots("instance-a")).resolves.toEqual(snapshots);
  });

  it("writes neon monitoring queries", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([{ payload: snapshots }])
      .mockResolvedValue(undefined)
      .mockResolvedValue(undefined);

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonMonitoringSnapshotRepository, getMonitoringSnapshotRepository } = await import("./monitoring-snapshot-repository");
    const repository = new NeonMonitoringSnapshotRepository();

    await expect(repository.getSnapshots("instance-a")).resolves.toEqual(snapshots);
    await repository.replaceSnapshots("instance-a", snapshots);
    await repository.deleteOlderThan("instance-a", "2026-04-07T12:00:00.000Z");
    expect(getMonitoringSnapshotRepository()).toBeInstanceOf(NeonMonitoringSnapshotRepository);
    expect(query).toHaveBeenCalled();
  });
});
