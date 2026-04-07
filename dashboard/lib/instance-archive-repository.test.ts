import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { seedWorkshopState } from "./workshop-data";
import type { InstanceArchiveRecord } from "./runtime-contracts";

const archive: InstanceArchiveRecord = {
  id: "archive-1",
  instanceId: "instance-a",
  archiveStatus: "ready",
  storageUri: null,
  createdAt: "2026-04-07T12:00:00.000Z",
  retentionUntil: "2026-04-10T12:00:00.000Z",
  notes: "Snapshot",
  payload: {
    archivedAt: "2026-04-07T12:00:00.000Z",
    reason: "manual",
    workshopState: seedWorkshopState,
    checkpoints: [],
    monitoringSnapshots: [],
    participantEventAccessVersion: null,
    participantSessions: [],
  },
};

describe("instance-archive-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-archives-"));
    process.env.HARNESS_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./instance-archive-repository");
    mod.setInstanceArchiveRepositoryForTests(null);
  });

  it("stores and prunes archives in file mode", async () => {
    const { FileInstanceArchiveRepository } = await import("./instance-archive-repository");
    const repository = new FileInstanceArchiveRepository();

    await repository.createArchive(archive);
    await repository.createArchive({ ...archive, id: "archive-2", retentionUntil: "2026-04-01T12:00:00.000Z" });
    await expect(repository.getLatestArchive("instance-a")).resolves.toMatchObject({ id: "archive-2" });

    await repository.deleteExpiredArchives("2026-04-07T12:30:00.000Z");
    await expect(repository.getLatestArchive("instance-a")).resolves.toMatchObject({ id: "archive-1" });
  });

  it("writes neon archive queries", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([
        {
          id: archive.id,
          instance_id: archive.instanceId,
          archive_status: archive.archiveStatus,
          storage_uri: archive.storageUri,
          retention_until: archive.retentionUntil,
          notes: archive.notes,
          payload: archive.payload,
          created_at: archive.createdAt,
        },
      ])
      .mockResolvedValueOnce(undefined);

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonInstanceArchiveRepository, getInstanceArchiveRepository } = await import("./instance-archive-repository");
    const repository = new NeonInstanceArchiveRepository();

    await repository.createArchive(archive);
    await expect(repository.getLatestArchive("instance-a")).resolves.toEqual(archive);
    await repository.deleteExpiredArchives("2026-04-07T12:30:00.000Z");
    expect(getInstanceArchiveRepository()).toBeInstanceOf(NeonInstanceArchiveRepository);
    expect(query).toHaveBeenCalled();
  });
});
