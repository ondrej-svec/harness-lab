import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileBlobStorage } from "./blob-storage";

describe("FileBlobStorage", () => {
  let tmpDir: string;
  let prevDataDir: string | undefined;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "blob-storage-"));
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

  async function collectStream(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const reader = stream.getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  }

  it("upload writes bytes and returns a canonical blob key", async () => {
    const storage = new FileBlobStorage();
    const data = Buffer.from("<html>hi</html>", "utf8");
    const result = await storage.upload({
      instanceId: "inst-a",
      artifactId: "abc123",
      filename: "Case Study.html",
      contentType: "text/html",
      data,
    });
    expect(result.blobKey).toBe("artifacts/inst-a/abc123/case-study.html");
    expect(result.byteSize).toBe(data.byteLength);
  });

  it("stream reads back the uploaded bytes", async () => {
    const storage = new FileBlobStorage();
    const data = Buffer.from("bytes on disk", "utf8");
    const { blobKey } = await storage.upload({
      instanceId: "inst-a",
      artifactId: "xyz",
      filename: "file.html",
      contentType: "text/html",
      data,
    });
    const { stream, byteSize } = await storage.stream(blobKey);
    const roundtrip = await collectStream(stream);
    expect(roundtrip.equals(data)).toBe(true);
    expect(byteSize).toBe(data.byteLength);
  });

  it("delete removes the file; subsequent stream throws", async () => {
    const storage = new FileBlobStorage();
    const { blobKey } = await storage.upload({
      instanceId: "inst-a",
      artifactId: "xyz",
      filename: "file.html",
      contentType: "text/html",
      data: Buffer.from("x"),
    });
    await storage.delete(blobKey);
    await expect(storage.stream(blobKey)).rejects.toThrow();
  });

  it("delete is a no-op for a missing key", async () => {
    const storage = new FileBlobStorage();
    await expect(storage.delete("artifacts/inst-a/missing/file.html")).resolves.toBeUndefined();
  });

  it("rejects path traversal in blob key", async () => {
    const storage = new FileBlobStorage();
    await expect(storage.stream("../../../etc/passwd")).rejects.toThrow(/unsafe/);
    await expect(storage.delete("../outside")).rejects.toThrow(/unsafe/);
  });

  it("rejects an unsafe instance id on upload", async () => {
    const storage = new FileBlobStorage();
    await expect(
      storage.upload({
        instanceId: "../evil",
        artifactId: "x",
        filename: "a.html",
        contentType: "text/html",
        data: Buffer.from("x"),
      }),
    ).rejects.toThrow();
  });
});
