import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { del, get, put } from "@vercel/blob";
import { buildArtifactBlobKey } from "./artifact-filename";
import { getRuntimeStorageMode } from "./runtime-storage";
import { assertSafeInstanceId } from "./safe-instance-id";

/**
 * Thin wrapper around the bytes side of artifact storage. The metadata
 * lives in `workshop_artifacts` (see `artifact-repository.ts`); this
 * module only owns the blob put/get/delete path.
 *
 * Dual-mode:
 * - `neon`: Vercel Blob in private mode. Access requires the token
 *   configured via `BLOB_READ_WRITE_TOKEN`.
 * - `file`: bytes are written under `HARNESS_DATA_DIR/<blobKey>` for
 *   local dev parity. No token required.
 *
 * The blob key shape is the same in both modes so the DB row is stable
 * across them.
 */

export type UploadArtifactInput = {
  instanceId: string;
  artifactId: string;
  filename: string;
  contentType: string;
  data: Buffer;
};

export type UploadArtifactResult = {
  blobKey: string;
  byteSize: number;
};

export type StreamArtifactResult = {
  stream: ReadableStream<Uint8Array>;
  byteSize: number;
  contentType: string;
};

export interface BlobStorage {
  upload(input: UploadArtifactInput): Promise<UploadArtifactResult>;
  stream(blobKey: string): Promise<StreamArtifactResult>;
  delete(blobKey: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// File-backed implementation (local dev + file storage mode)
// ---------------------------------------------------------------------------

function fileModeRoot(): string {
  return process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");
}

function resolveFilePath(blobKey: string): string {
  // blobKey is always the canonical `artifacts/<instanceId>/<id>/<filename>`
  // shape; rejecting absolute paths and `..` guards against a rogue
  // DB row from escaping HARNESS_DATA_DIR in file mode.
  if (path.isAbsolute(blobKey) || blobKey.includes("..")) {
    throw new Error(`unsafe blob key rejected: ${blobKey}`);
  }
  return path.join(fileModeRoot(), blobKey);
}

export class FileBlobStorage implements BlobStorage {
  async upload(input: UploadArtifactInput): Promise<UploadArtifactResult> {
    assertSafeInstanceId(input.instanceId);
    const blobKey = buildArtifactBlobKey(input.instanceId, input.artifactId, input.filename);
    const target = resolveFilePath(blobKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.data);
    return { blobKey, byteSize: input.data.byteLength };
  }

  async stream(blobKey: string): Promise<StreamArtifactResult> {
    const target = resolveFilePath(blobKey);
    const stat1 = await stat(target);
    const nodeStream = createReadStream(target);
    // Readable.toWeb returns a ReadableStream<Uint8Array> matching the
    // fetch Response contract.
    const stream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
    return {
      stream,
      byteSize: stat1.size,
      contentType: "application/octet-stream",
    };
  }

  async delete(blobKey: string): Promise<void> {
    const target = resolveFilePath(blobKey);
    try {
      await unlink(target);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") {
        throw err;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Vercel-Blob-backed implementation
// ---------------------------------------------------------------------------

export class VercelBlobStorage implements BlobStorage {
  async upload(input: UploadArtifactInput): Promise<UploadArtifactResult> {
    assertSafeInstanceId(input.instanceId);
    const blobKey = buildArtifactBlobKey(input.instanceId, input.artifactId, input.filename);
    const result = await put(blobKey, input.data, {
      access: "private",
      contentType: input.contentType,
      // Avoid Vercel adding a random suffix to preserve filename stability.
      addRandomSuffix: false,
      // Allow overwrite so a retried upload for the same artifactId is idempotent.
      allowOverwrite: true,
    });
    return { blobKey: result.pathname, byteSize: input.data.byteLength };
  }

  async stream(blobKey: string): Promise<StreamArtifactResult> {
    const result = await get(blobKey, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error(`blob not found: ${blobKey}`);
    }
    return {
      stream: result.stream,
      byteSize: result.blob.size,
      contentType: result.blob.contentType,
    };
  }

  async delete(blobKey: string): Promise<void> {
    await del(blobKey);
  }
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

let overrideStorage: BlobStorage | null = null;

export function getBlobStorage(): BlobStorage {
  if (overrideStorage) {
    return overrideStorage;
  }
  return getRuntimeStorageMode() === "neon" ? new VercelBlobStorage() : new FileBlobStorage();
}

export function setBlobStorageForTests(storage: BlobStorage | null) {
  overrideStorage = storage;
}
