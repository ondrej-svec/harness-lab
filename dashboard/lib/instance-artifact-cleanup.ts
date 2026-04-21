import { getArtifactRepository } from "./artifact-repository";
import { getBlobStorage } from "./blob-storage";

/**
 * Remove every cohort-scoped artifact (DB row + blob bytes) for an
 * instance. Use this before or after any **hard** delete of a
 * `workshop_instances` row — the FK cascades the DB rows, but blob
 * storage has no cross-row cascade semantics, so leaks accumulate
 * otherwise.
 *
 * Soft-remove (`removeWorkshopInstance`) intentionally does **not**
 * call this: the row is still present, an archive has been created,
 * and a later restore flow can still surface the artifacts. Only fire
 * this when the row is about to disappear (or has already gone) for good.
 *
 * The call order is:
 *   1. Snapshot blob keys from the repository while the instance still exists.
 *   2. Caller performs the hard delete (DB cascade removes
 *      `workshop_artifacts` rows).
 *   3. Caller invokes the returned callback, or we immediately delete
 *      the blobs — the hook runs delete with best-effort per-key error
 *      handling so one bad key does not leak the rest.
 *
 * Per-blob delete errors are logged but do not throw — the DB is the
 * source of truth for "what still exists"; a dangling blob key is
 * recoverable by a later cleanup sweep.
 */
export async function deleteInstanceArtifactsAndBlobs(instanceId: string): Promise<{
  removedCount: number;
  blobDeleteErrors: number;
}> {
  const repo = getArtifactRepository();
  const storage = getBlobStorage();

  const artifacts = await repo.listForInstance(instanceId);
  let blobDeleteErrors = 0;

  for (const artifact of artifacts) {
    try {
      await storage.delete(artifact.blobKey);
    } catch (err) {
      blobDeleteErrors += 1;
      console.error("[instance-artifact-cleanup] blob delete failed", {
        instanceId,
        artifactId: artifact.id,
        blobKey: artifact.blobKey,
        err,
      });
    }
    // Row delete is idempotent; if the DB FK has already cascaded
    // (caller hard-deleted the instance row first), this is a no-op.
    try {
      await repo.delete(instanceId, artifact.id);
    } catch (err) {
      // Treat as benign — the row is already gone or the instance
      // deletion cascaded. Log for visibility.
      console.warn("[instance-artifact-cleanup] row delete noop/failed", {
        instanceId,
        artifactId: artifact.id,
        err,
      });
    }
  }

  return { removedCount: artifacts.length, blobDeleteErrors };
}
