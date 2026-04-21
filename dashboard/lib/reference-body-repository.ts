import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import { assertSafeInstanceId } from "./safe-instance-id";

/**
 * Per-instance Markdown body override for a hosted reference item.
 * Only set in the sidecar table `workshop_reference_bodies` when a
 * facilitator has pushed a custom body for this (instance, item) pair.
 * Null return from `get` means "use the compiled-default body from
 * dashboard/lib/generated/reference-*.json".
 */
export type ReferenceBodyRecord = {
  instanceId: string;
  itemId: string;
  body: string;
  updatedAt: string;
};

export interface ReferenceBodyRepository {
  get(instanceId: string, itemId: string): Promise<ReferenceBodyRecord | null>;
  upsert(instanceId: string, itemId: string, body: string): Promise<ReferenceBodyRecord>;
  delete(instanceId: string, itemId: string): Promise<void>;
  listForInstance(instanceId: string): Promise<ReferenceBodyRecord[]>;
}

type StoredReferenceBodies = {
  version: 1;
  bodies: ReferenceBodyRecord[];
};

function createEmptyStore(): StoredReferenceBodies {
  return { version: 1, bodies: [] };
}

// ---------------------------------------------------------------------------
// File-backed implementation
// ---------------------------------------------------------------------------

export class FileReferenceBodyRepository implements ReferenceBodyRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getPath(instanceId: string) {
    assertSafeInstanceId(instanceId);
    return path.join(this.dataDir, instanceId, "reference-bodies.json");
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

  private async readStore(instanceId: string): Promise<StoredReferenceBodies> {
    await this.ensureFile(instanceId);
    const raw = await readFile(this.getPath(instanceId), "utf8");
    return JSON.parse(raw) as StoredReferenceBodies;
  }

  private async writeStore(instanceId: string, store: StoredReferenceBodies): Promise<void> {
    const filePath = this.getPath(instanceId);
    const tempPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify(store, null, 2));
    await rename(tempPath, filePath);
  }

  async get(instanceId: string, itemId: string): Promise<ReferenceBodyRecord | null> {
    const store = await this.readStore(instanceId);
    return store.bodies.find((row) => row.itemId === itemId) ?? null;
  }

  async upsert(instanceId: string, itemId: string, body: string): Promise<ReferenceBodyRecord> {
    const store = await this.readStore(instanceId);
    const updatedAt = new Date().toISOString();
    const record: ReferenceBodyRecord = { instanceId, itemId, body, updatedAt };
    const existingIndex = store.bodies.findIndex((row) => row.itemId === itemId);
    if (existingIndex >= 0) {
      store.bodies[existingIndex] = record;
    } else {
      store.bodies.push(record);
    }
    await this.writeStore(instanceId, store);
    return record;
  }

  async delete(instanceId: string, itemId: string): Promise<void> {
    const store = await this.readStore(instanceId);
    const nextBodies = store.bodies.filter((row) => row.itemId !== itemId);
    if (nextBodies.length === store.bodies.length) {
      return;
    }
    await this.writeStore(instanceId, { ...store, bodies: nextBodies });
  }

  async listForInstance(instanceId: string): Promise<ReferenceBodyRecord[]> {
    const store = await this.readStore(instanceId);
    return [...store.bodies].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

// ---------------------------------------------------------------------------
// Neon-backed implementation
// ---------------------------------------------------------------------------

type NeonRow = {
  instance_id: string;
  item_id: string;
  body: string;
  updated_at: string;
};

function mapNeonRow(row: NeonRow): ReferenceBodyRecord {
  return {
    instanceId: row.instance_id,
    itemId: row.item_id,
    body: row.body,
    updatedAt: row.updated_at,
  };
}

export class NeonReferenceBodyRepository implements ReferenceBodyRepository {
  async get(instanceId: string, itemId: string): Promise<ReferenceBodyRecord | null> {
    assertSafeInstanceId(instanceId);
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT instance_id, item_id, body, updated_at
        FROM workshop_reference_bodies
        WHERE instance_id = $1 AND item_id = $2
        LIMIT 1
      `,
      [instanceId, itemId],
    )) as NeonRow[];
    const row = rows[0];
    return row ? mapNeonRow(row) : null;
  }

  async upsert(instanceId: string, itemId: string, body: string): Promise<ReferenceBodyRecord> {
    assertSafeInstanceId(instanceId);
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        INSERT INTO workshop_reference_bodies (instance_id, item_id, body, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (instance_id, item_id) DO UPDATE
          SET body = EXCLUDED.body, updated_at = NOW()
        RETURNING instance_id, item_id, body, updated_at
      `,
      [instanceId, itemId, body],
    )) as NeonRow[];
    const row = rows[0];
    if (!row) {
      throw new Error(`upsert for (${instanceId}, ${itemId}) returned no row`);
    }
    return mapNeonRow(row);
  }

  async delete(instanceId: string, itemId: string): Promise<void> {
    assertSafeInstanceId(instanceId);
    const sql = getNeonSql();
    await sql.query(
      `DELETE FROM workshop_reference_bodies WHERE instance_id = $1 AND item_id = $2`,
      [instanceId, itemId],
    );
  }

  async listForInstance(instanceId: string): Promise<ReferenceBodyRecord[]> {
    assertSafeInstanceId(instanceId);
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT instance_id, item_id, body, updated_at
        FROM workshop_reference_bodies
        WHERE instance_id = $1
        ORDER BY updated_at DESC
      `,
      [instanceId],
    )) as NeonRow[];
    return rows.map(mapNeonRow);
  }
}

// ---------------------------------------------------------------------------
// Repository resolution
// ---------------------------------------------------------------------------

let overrideRepository: ReferenceBodyRepository | null = null;

export function getReferenceBodyRepository(): ReferenceBodyRepository {
  if (overrideRepository) {
    return overrideRepository;
  }
  return getRuntimeStorageMode() === "neon"
    ? new NeonReferenceBodyRepository()
    : new FileReferenceBodyRepository();
}

export function setReferenceBodyRepositoryForTests(repository: ReferenceBodyRepository | null) {
  overrideRepository = repository;
}
