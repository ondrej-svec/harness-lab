import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/workshop/instances/[id]/artifacts/route";
import { DELETE } from "@/app/api/workshop/instances/[id]/artifacts/[artifactId]/route";
import {
  setAuditLogRepositoryForTests,
  type AuditLogRepository,
} from "@/lib/audit-log-repository";
import {
  setFacilitatorAuthServiceForTests,
  type FacilitatorAuthService,
} from "@/lib/facilitator-auth-service";
import {
  FileArtifactRepository,
  setArtifactRepositoryForTests,
  type ArtifactRepository,
} from "@/lib/artifact-repository";
import {
  FileBlobStorage,
  setBlobStorageForTests,
  type BlobStorage,
} from "@/lib/blob-storage";
import { sampleWorkshopInstances } from "@/lib/workshop-data";
import { setWorkshopInstanceRepositoryForTests } from "@/lib/workshop-instance-repository";
import type { AuditLogRecord, WorkshopInstanceRepository } from "@/lib/runtime-contracts";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const INSTANCE_ID = "sample-studio-a";

class MemoryWorkshopInstanceRepository implements WorkshopInstanceRepository {
  constructor(private items = structuredClone(sampleWorkshopInstances)) {}
  async getDefaultInstanceId() {
    return this.items[0]?.id ?? INSTANCE_ID;
  }
  async getInstance(instanceId: string) {
    return structuredClone(this.items.find((item) => item.id === instanceId) ?? null);
  }
  async listInstances(options?: { includeRemoved?: boolean }) {
    const items = options?.includeRemoved
      ? this.items
      : this.items.filter((item) => !item.removedAt && item.status !== "removed");
    return structuredClone(items);
  }
  async createInstance(instance: (typeof sampleWorkshopInstances)[number]) {
    this.items.push(structuredClone(instance));
    return instance;
  }
  async updateInstance(
    instanceId: string,
    instance: (typeof sampleWorkshopInstances)[number],
  ) {
    this.items = this.items.map((item) =>
      item.id === instanceId ? structuredClone(instance) : item,
    );
    return instance;
  }
  async removeInstance(instanceId: string, removedAt: string) {
    this.items = this.items.map((item) =>
      item.id === instanceId
        ? { ...item, status: "removed" as const, removedAt }
        : item,
    );
  }
}

class CapturingAuditLogRepository implements AuditLogRepository {
  readonly records: AuditLogRecord[] = [];
  async append(record: AuditLogRecord) {
    this.records.push(record);
  }
  async deleteOlderThan() {}
}

class AllowFacilitatorAuthService implements FacilitatorAuthService {
  async hasValidRequestCredentials() {
    return true;
  }
  async hasValidSession() {
    return false;
  }
}

class DenyFacilitatorAuthService implements FacilitatorAuthService {
  async hasValidRequestCredentials() {
    return false;
  }
  async hasValidSession() {
    return false;
  }
}

function buildUploadRequest(options: {
  file?: File;
  label?: string;
  description?: string;
  omitFile?: boolean;
}) {
  const form = new FormData();
  if (!options.omitFile) {
    form.set(
      "file",
      options.file ??
        new File([new Uint8Array([0x3c, 0x68, 0x31, 0x3e])], "case-study.html", {
          type: "text/html",
        }),
    );
  }
  if (options.label !== undefined) form.set("label", options.label);
  if (options.description !== undefined) form.set("description", options.description);
  return new Request(`http://localhost/api/workshop/instances/${INSTANCE_ID}/artifacts`, {
    method: "POST",
    headers: { origin: "http://localhost" },
    body: form,
  });
}

function buildDeleteRequest(instanceId: string, artifactId: string) {
  return new Request(
    `http://localhost/api/workshop/instances/${instanceId}/artifacts/${artifactId}`,
    {
      method: "DELETE",
      headers: { origin: "http://localhost" },
    },
  );
}

describe("workshop instance artifacts API", () => {
  let tmpDir: string;
  let prevDataDir: string | undefined;
  let auditLog: CapturingAuditLogRepository;
  let artifactRepo: ArtifactRepository;
  let blobStorage: BlobStorage;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "artifacts-api-"));
    prevDataDir = process.env.HARNESS_DATA_DIR;
    process.env.HARNESS_DATA_DIR = tmpDir;

    auditLog = new CapturingAuditLogRepository();
    artifactRepo = new FileArtifactRepository();
    blobStorage = new FileBlobStorage();

    setWorkshopInstanceRepositoryForTests(new MemoryWorkshopInstanceRepository());
    setAuditLogRepositoryForTests(auditLog);
    setArtifactRepositoryForTests(artifactRepo);
    setBlobStorageForTests(blobStorage);
    setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());
  });

  afterEach(() => {
    setWorkshopInstanceRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    setArtifactRepositoryForTests(null);
    setBlobStorageForTests(null);
    setFacilitatorAuthServiceForTests(null);
    if (prevDataDir === undefined) {
      delete process.env.HARNESS_DATA_DIR;
    } else {
      process.env.HARNESS_DATA_DIR = prevDataDir;
    }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("POST", () => {
    it("uploads a valid HTML artifact, stores bytes + row, emits audit", async () => {
      const response = await POST(
        buildUploadRequest({ label: "Case study", description: "Cohort viz" }),
        { params: Promise.resolve({ id: INSTANCE_ID }) },
      );
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.artifact.label).toBe("Case study");
      expect(body.artifact.description).toBe("Cohort viz");
      expect(body.artifact.contentType).toBe("text/html");
      expect(body.artifact.filename).toBe("case-study.html");
      expect(body.artifact.byteSize).toBeGreaterThan(0);
      expect(body.artifact.id).toHaveLength(16);
      expect(body.artifact.blobKey).toBeUndefined(); // never returned to clients

      const stored = await artifactRepo.get(INSTANCE_ID, body.artifact.id);
      expect(stored?.blobKey).toBe(
        `artifacts/${INSTANCE_ID}/${body.artifact.id}/case-study.html`,
      );

      expect(auditLog.records).toHaveLength(1);
      expect(auditLog.records[0]?.action).toBe("instance_artifact_uploaded");
    });

    it("rejects a request missing the file field with 400", async () => {
      const response = await POST(
        buildUploadRequest({ label: "x", omitFile: true }),
        { params: Promise.resolve({ id: INSTANCE_ID }) },
      );
      expect(response.status).toBe(400);
    });

    it("rejects a request missing the label field with 400", async () => {
      const response = await POST(buildUploadRequest({}), {
        params: Promise.resolve({ id: INSTANCE_ID }),
      });
      expect(response.status).toBe(400);
    });

    it("rejects an unsupported content type with 400", async () => {
      const response = await POST(
        buildUploadRequest({
          file: new File([new Uint8Array(10)], "evil.zip", { type: "application/zip" }),
          label: "x",
        }),
        { params: Promise.resolve({ id: INSTANCE_ID }) },
      );
      expect(response.status).toBe(400);
    });

    it("rejects oversized upload with 413", async () => {
      process.env.ARTIFACT_MAX_BYTES = "10";
      try {
        const response = await POST(
          buildUploadRequest({
            file: new File([new Uint8Array(100)], "big.html", { type: "text/html" }),
            label: "x",
          }),
          { params: Promise.resolve({ id: INSTANCE_ID }) },
        );
        expect(response.status).toBe(413);
      } finally {
        delete process.env.ARTIFACT_MAX_BYTES;
      }
    });

    it("404s when the target instance does not exist", async () => {
      const response = await POST(buildUploadRequest({ label: "x" }), {
        params: Promise.resolve({ id: "ghost" }),
      });
      expect(response.status).toBe(404);
    });

    it("rejects unauthenticated requests", async () => {
      setFacilitatorAuthServiceForTests(new DenyFacilitatorAuthService());
      const response = await POST(buildUploadRequest({ label: "x" }), {
        params: Promise.resolve({ id: INSTANCE_ID }),
      });
      expect([401, 403]).toContain(response.status);
    });
  });

  describe("GET", () => {
    it("returns an empty list before any upload", async () => {
      const response = await GET(
        new Request(`http://localhost/api/workshop/instances/${INSTANCE_ID}/artifacts`),
        { params: Promise.resolve({ id: INSTANCE_ID }) },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ ok: true, artifacts: [] });
    });

    it("returns uploaded artifacts (blobKey is hidden)", async () => {
      await POST(buildUploadRequest({ label: "Case study" }), {
        params: Promise.resolve({ id: INSTANCE_ID }),
      });
      const response = await GET(
        new Request(`http://localhost/api/workshop/instances/${INSTANCE_ID}/artifacts`),
        { params: Promise.resolve({ id: INSTANCE_ID }) },
      );
      const body = await response.json();
      expect(body.artifacts).toHaveLength(1);
      expect(body.artifacts[0].label).toBe("Case study");
      expect(body.artifacts[0].blobKey).toBeUndefined();
    });
  });

  describe("DELETE", () => {
    it("removes the artifact and its blob", async () => {
      const upload = await POST(buildUploadRequest({ label: "Case study" }), {
        params: Promise.resolve({ id: INSTANCE_ID }),
      });
      const uploaded = await upload.json();
      const artifactId = uploaded.artifact.id;

      const response = await DELETE(
        buildDeleteRequest(INSTANCE_ID, artifactId),
        { params: Promise.resolve({ id: INSTANCE_ID, artifactId }) },
      );
      expect(response.status).toBe(200);
      expect(await artifactRepo.get(INSTANCE_ID, artifactId)).toBeNull();
      // Blob delete is best-effort but should have succeeded for file mode.
      await expect(
        blobStorage.stream(`artifacts/${INSTANCE_ID}/${artifactId}/case-study.html`),
      ).rejects.toThrow();

      expect(auditLog.records.some((r) => r.action === "instance_artifact_removed")).toBe(true);
    });

    it("404s when the artifactId does not belong to this instance", async () => {
      const response = await DELETE(
        buildDeleteRequest(INSTANCE_ID, "nonexistent"),
        { params: Promise.resolve({ id: INSTANCE_ID, artifactId: "nonexistent" }) },
      );
      expect(response.status).toBe(404);
    });

    it("404s on cross-instance delete — cohort isolation", async () => {
      // Create an artifact under INSTANCE_ID, then try to delete it via a
      // different instance's path. The composite (instanceId, artifactId)
      // lookup must refuse to match, preventing cross-cohort mutation.
      const upload = await POST(buildUploadRequest({ label: "A" }), {
        params: Promise.resolve({ id: INSTANCE_ID }),
      });
      const { artifact } = await upload.json();

      // sampleWorkshopInstances has at least two instances; pick a
      // different one to stand in as the "other cohort" path.
      const other = sampleWorkshopInstances.find((x) => x.id !== INSTANCE_ID);
      expect(other).toBeTruthy();
      const response = await DELETE(
        buildDeleteRequest(other!.id, artifact.id),
        { params: Promise.resolve({ id: other!.id, artifactId: artifact.id }) },
      );
      expect(response.status).toBe(404);

      // Original instance's artifact must still exist.
      expect(await artifactRepo.get(INSTANCE_ID, artifact.id)).not.toBeNull();
    });
  });
});
