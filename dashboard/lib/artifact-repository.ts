import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import { assertSafeInstanceId } from "./safe-instance-id";

/**
 * Metadata row for a cohort-scoped artifact. The blob bytes live in
 * Vercel Blob (private mode) under `blobKey`; this record is what binds
 * them to a specific `instanceId`. Cross-cohort isolation is enforced
 * by always looking up via the composite `(instanceId, id)` — never by
 * `id` alone.
 */
export type ArtifactRecord = {
  instanceId: string;
  id: string;
  blobKey: string;
  contentType: string;
  filename: string;
  byteSize: number;
  label: string;
  description: string | null;
  uploadedAt: string;
};

export type CreateArtifactInput = {
  instanceId: string;
  id?: string;
  blobKey: string;
  contentType: string;
  filename: string;
  byteSize: number;
  label: string;
  description?: string | null;
  uploadedAt?: string;
};

export interface ArtifactRepository {
  create(input: CreateArtifactInput): Promise<ArtifactRecord>;
  get(instanceId: string, id: string): Promise<ArtifactRecord | null>;
  listForInstance(instanceId: string): Promise<ArtifactRecord[]>;
  delete(instanceId: string, id: string): Promise<void>;
}

/** Short URL-safe id used for artifactId. 16 chars from 12 random bytes. */
export function generateArtifactId(): string {
  return randomBytes(12).toString("base64url");
}

type StoredArtifacts = {
  version: 1;
  artifacts: ArtifactRecord[];
};

function createEmptyStore(): StoredArtifacts {
  return { version: 1, artifacts: [] };
}

// ---------------------------------------------------------------------------
// File-backed implementation
// ---------------------------------------------------------------------------

export class FileArtifactRepository implements ArtifactRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getPath(instanceId: string) {
    assertSafeInstanceId(instanceId);
    return path.join(this.dataDir, instanceId, "artifacts.json");
  }

  private async ensureFile(instanceId: string) {
    const filePath = this.getPath(instanceId);
    await mkdir(path.dirname(filePath), { recursive: true });
    try {
      await readFile(filePath, "utf8");
    } catch {
      await writeFile(filePath, JSON.stringify(createEmptyStore(), null, 2));
    }
  }

  private async readStore(instanceId: string): Promise<StoredArtifacts> {
    await this.ensureFile(instanceId);
    const raw = await readFile(this.getPath(instanceId), "utf8");
    return JSON.parse(raw) as StoredArtifacts;
  }

  private async writeStore(instanceId: string, store: StoredArtifacts): Promise<void> {
    const filePath = this.getPath(instanceId);
    const tempPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify(store, null, 2));
    await rename(tempPath, filePath);
  }

  async create(input: CreateArtifactInput): Promise<ArtifactRecord> {
    const store = await this.readStore(input.instanceId);
    const record: ArtifactRecord = {
      instanceId: input.instanceId,
      id: input.id ?? generateArtifactId(),
      blobKey: input.blobKey,
      contentType: input.contentType,
      filename: input.filename,
      byteSize: input.byteSize,
      label: input.label,
      description: input.description ?? null,
      uploadedAt: input.uploadedAt ?? new Date().toISOString(),
    };
    if (store.artifacts.some((row) => row.id === record.id)) {
      throw new Error(`artifact id collision for (${record.instanceId}, ${record.id})`);
    }
    store.artifacts.push(record);
    await this.writeStore(input.instanceId, store);
    return record;
  }

  async get(instanceId: string, id: string): Promise<ArtifactRecord | null> {
    const store = await this.readStore(instanceId);
    return store.artifacts.find((row) => row.id === id) ?? null;
  }

  async listForInstance(instanceId: string): Promise<ArtifactRecord[]> {
    const store = await this.readStore(instanceId);
    return [...store.artifacts].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  async delete(instanceId: string, id: string): Promise<void> {
    const store = await this.readStore(instanceId);
    const next = store.artifacts.filter((row) => row.id !== id);
    if (next.length === store.artifacts.length) {
      return;
    }
    await this.writeStore(instanceId, { ...store, artifacts: next });
  }
}

// ---------------------------------------------------------------------------
// Neon-backed implementation
// ---------------------------------------------------------------------------

type NeonRow = {
  instance_id: string;
  id: string;
  blob_key: string;
  content_type: string;
  filename: string;
  byte_size: number;
  label: string;
  description: string | null;
  uploaded_at: string;
};

function mapNeonRow(row: NeonRow): ArtifactRecord {
  return {
    instanceId: row.instance_id,
    id: row.id,
    blobKey: row.blob_key,
    contentType: row.content_type,
    filename: row.filename,
    byteSize: Number(row.byte_size),
    label: row.label,
    description: row.description,
    uploadedAt: row.uploaded_at,
  };
}

export class NeonArtifactRepository implements ArtifactRepository {
  async create(input: CreateArtifactInput): Promise<ArtifactRecord> {
    assertSafeInstanceId(input.instanceId);
    const id = input.id ?? generateArtifactId();
    const uploadedAt = input.uploadedAt ?? new Date().toISOString();
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        INSERT INTO workshop_artifacts (
          instance_id, id, blob_key, content_type, filename, byte_size,
          label, description, uploaded_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING instance_id, id, blob_key, content_type, filename,
                  byte_size, label, description, uploaded_at
      `,
      [
        input.instanceId,
        id,
        input.blobKey,
        input.contentType,
        input.filename,
        input.byteSize,
        input.label,
        input.description ?? null,
        uploadedAt,
      ],
    )) as NeonRow[];
    const row = rows[0];
    if (!row) {
      throw new Error(`insert for (${input.instanceId}, ${id}) returned no row`);
    }
    return mapNeonRow(row);
  }

  async get(instanceId: string, id: string): Promise<ArtifactRecord | null> {
    assertSafeInstanceId(instanceId);
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT instance_id, id, blob_key, content_type, filename,
               byte_size, label, description, uploaded_at
        FROM workshop_artifacts
        WHERE instance_id = $1 AND id = $2
        LIMIT 1
      `,
      [instanceId, id],
    )) as NeonRow[];
    const row = rows[0];
    return row ? mapNeonRow(row) : null;
  }

  async listForInstance(instanceId: string): Promise<ArtifactRecord[]> {
    assertSafeInstanceId(instanceId);
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT instance_id, id, blob_key, content_type, filename,
               byte_size, label, description, uploaded_at
        FROM workshop_artifacts
        WHERE instance_id = $1
        ORDER BY uploaded_at DESC
      `,
      [instanceId],
    )) as NeonRow[];
    return rows.map(mapNeonRow);
  }

  async delete(instanceId: string, id: string): Promise<void> {
    assertSafeInstanceId(instanceId);
    const sql = getNeonSql();
    await sql.query(
      `DELETE FROM workshop_artifacts WHERE instance_id = $1 AND id = $2`,
      [instanceId, id],
    );
  }
}

// ---------------------------------------------------------------------------
// Repository resolution
// ---------------------------------------------------------------------------

let overrideRepository: ArtifactRepository | null = null;

export function getArtifactRepository(): ArtifactRepository {
  if (overrideRepository) {
    return overrideRepository;
  }
  return getRuntimeStorageMode() === "neon"
    ? new NeonArtifactRepository()
    : new FileArtifactRepository();
}

export function setArtifactRepositoryForTests(repository: ArtifactRepository | null) {
  overrideRepository = repository;
}
