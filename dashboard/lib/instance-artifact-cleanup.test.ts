import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  FileArtifactRepository,
  setArtifactRepositoryForTests,
} from "./artifact-repository";
import { FileBlobStorage, setBlobStorageForTests } from "./blob-storage";
import { deleteInstanceArtifactsAndBlobs } from "./instance-artifact-cleanup";

describe("deleteInstanceArtifactsAndBlobs", () => {
  let tmpDir: string;
  let prevDataDir: string | undefined;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "instance-cleanup-"));
    prevDataDir = process.env.HARNESS_DATA_DIR;
    process.env.HARNESS_DATA_DIR = tmpDir;
    setArtifactRepositoryForTests(new FileArtifactRepository());
    setBlobStorageForTests(new FileBlobStorage());
  });

  afterEach(() => {
    setArtifactRepositoryForTests(null);
    setBlobStorageForTests(null);
    if (prevDataDir === undefined) {
      delete process.env.HARNESS_DATA_DIR;
    } else {
      process.env.HARNESS_DATA_DIR = prevDataDir;
    }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  async function seedArtifact(instanceId: string, label: string) {
    const storage = new FileBlobStorage();
    const repo = new FileArtifactRepository();
    const { blobKey, byteSize } = await storage.upload({
      instanceId,
      artifactId: label.toLowerCase().replace(/\s+/g, "-"),
      filename: `${label}.html`,
      contentType: "text/html",
      data: Buffer.from(`<html>${label}</html>`),
    });
    return repo.create({
      instanceId,
      id: label.toLowerCase().replace(/\s+/g, "-"),
      blobKey,
      filename: `${label}.html`,
      contentType: "text/html",
      byteSize,
      label,
    });
  }

  it("returns zero counts when there are no artifacts", async () => {
    const result = await deleteInstanceArtifactsAndBlobs("inst-empty");
    expect(result).toEqual({ removedCount: 0, blobDeleteErrors: 0 });
  });

  it("removes all artifact rows and blob files for an instance", async () => {
    const a = await seedArtifact("inst-a", "alpha");
    const b = await seedArtifact("inst-a", "beta");
    // Artifact under a different instance that must NOT be touched.
    const otherCohort = await seedArtifact("inst-b", "gamma");

    const result = await deleteInstanceArtifactsAndBlobs("inst-a");
    expect(result.removedCount).toBe(2);
    expect(result.blobDeleteErrors).toBe(0);

    const repo = new FileArtifactRepository();
    expect(await repo.listForInstance("inst-a")).toEqual([]);
    expect(await repo.get("inst-a", a.id)).toBeNull();
    expect(await repo.get("inst-a", b.id)).toBeNull();

    // Cross-cohort protection: other instance's artifact survived.
    expect(await repo.get("inst-b", otherCohort.id)).not.toBeNull();

    const storage = new FileBlobStorage();
    await expect(storage.stream(a.blobKey)).rejects.toThrow();
    await expect(storage.stream(b.blobKey)).rejects.toThrow();
    await expect(storage.stream(otherCohort.blobKey)).resolves.toBeDefined();
  });

  it("treats an already-missing blob as a soft failure and continues", async () => {
    const a = await seedArtifact("inst-a", "alpha");
    // Manually delete the blob first so the hook encounters a missing
    // key. In file mode, delete() is idempotent — expect no errors.
    await new FileBlobStorage().delete(a.blobKey);

    const result = await deleteInstanceArtifactsAndBlobs("inst-a");
    expect(result.removedCount).toBe(1);
    // FileBlobStorage.delete swallows ENOENT, so this stays 0.
    expect(result.blobDeleteErrors).toBe(0);
  });
});
