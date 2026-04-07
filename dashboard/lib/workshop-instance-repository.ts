import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { WorkshopInstanceRepository } from "./runtime-contracts";
import { createWorkshopInstanceRecord, sampleWorkshopInstances, type WorkshopInstanceRecord } from "./workshop-data";

type StoredInstances = {
  items: WorkshopInstanceRecord[];
};

export class FileWorkshopInstanceRepository implements WorkshopInstanceRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");
  private readonly filePath = process.env.HARNESS_INSTANCES_PATH ?? path.join(this.dataDir, "instances.json");

  private async ensureFile() {
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await readFile(this.filePath, "utf8");
    } catch {
      await writeFile(
        this.filePath,
        JSON.stringify({ items: sampleWorkshopInstances } satisfies StoredInstances, null, 2),
      );
    }
  }

  private async readItems() {
    await this.ensureFile();
    const raw = await readFile(this.filePath, "utf8");
    return (JSON.parse(raw) as StoredInstances).items.map((item) => createWorkshopInstanceRecord(item));
  }

  private async writeItems(items: WorkshopInstanceRecord[]) {
    const tempPath = `${this.filePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ items }, null, 2));
    await rename(tempPath, this.filePath);
  }

  async getDefaultInstanceId() {
    const active = await this.listInstances();
    return active[0]?.id ?? sampleWorkshopInstances[0]?.id ?? "sample-studio-a";
  }

  async getInstance(instanceId: string) {
    const items = await this.readItems();
    return items.find((instance) => instance.id === instanceId) ?? null;
  }

  async listInstances(options?: { includeRemoved?: boolean }) {
    const items = await this.readItems();
    return options?.includeRemoved ? items : items.filter((instance) => !instance.removedAt && instance.status !== "removed");
  }

  async createInstance(instance: WorkshopInstanceRecord) {
    const items = await this.readItems();
    const existing = items.find((item) => item.id === instance.id);
    if (existing) {
      return existing;
    }

    items.push(createWorkshopInstanceRecord(instance));
    await this.writeItems(items);
    return instance;
  }

  async updateInstance(instanceId: string, instance: WorkshopInstanceRecord) {
    const items = await this.readItems();
    const nextItems = items.some((item) => item.id === instanceId)
      ? items.map((item) => (item.id === instanceId ? createWorkshopInstanceRecord(instance) : item))
      : [...items, createWorkshopInstanceRecord(instance)];
    await this.writeItems(nextItems);
    return instance;
  }

  async removeInstance(instanceId: string, removedAt: string) {
    const items = await this.readItems();
    const nextItems = items.map((item) =>
      item.id === instanceId
        ? {
            ...item,
            status: "removed" as const,
            removedAt,
          }
        : item,
    );
    await this.writeItems(nextItems);
  }
}

export class NeonWorkshopInstanceRepository implements WorkshopInstanceRepository {
  async getDefaultInstanceId() {
    const rows = await this.listInstances();
    return rows[0]?.id ?? sampleWorkshopInstances[0]?.id ?? "sample-studio-a";
  }

  async getInstance(instanceId: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, template_id, status, blueprint_id, blueprint_version, imported_at, removed_at, workshop_meta
        FROM workshop_instances
        WHERE id = $1
        LIMIT 1
      `,
      [instanceId],
    )) as InstanceRow[];

    return rows[0] ? mapInstanceRow(rows[0]) : null;
  }

  async listInstances(options?: { includeRemoved?: boolean }) {
    const sql = getNeonSql();
    const includeRemoved = options?.includeRemoved ?? false;
    const rows = (await sql.query(
      `
        SELECT id, template_id, status, blueprint_id, blueprint_version, imported_at, removed_at, workshop_meta
        FROM workshop_instances
        ${includeRemoved ? "" : "WHERE removed_at IS NULL AND status <> 'removed'"}
        ORDER BY id ASC
      `,
    )) as InstanceRow[];

    return rows.map(mapInstanceRow);
  }

  async createInstance(instance: WorkshopInstanceRecord) {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO workshop_instances (
          id, template_id, workshop_meta, workshop_state, status, blueprint_id, blueprint_version, imported_at, removed_at, created_at, updated_at
        )
        VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8::timestamptz, $9::timestamptz, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `,
      [
        instance.id,
        instance.templateId,
        JSON.stringify(instance.workshopMeta),
        JSON.stringify({}),
        instance.status,
        instance.blueprintId,
        instance.blueprintVersion,
        instance.importedAt,
        instance.removedAt,
      ],
    );
    return instance;
  }

  async updateInstance(instanceId: string, instance: WorkshopInstanceRecord) {
    const sql = getNeonSql();
    await sql.query(
      `
        UPDATE workshop_instances
        SET template_id = $2,
            workshop_meta = $3::jsonb,
            status = $4,
            blueprint_id = $5,
            blueprint_version = $6,
            imported_at = $7::timestamptz,
            removed_at = $8::timestamptz,
            updated_at = NOW()
        WHERE id = $1
      `,
      [
        instanceId,
        instance.templateId,
        JSON.stringify(instance.workshopMeta),
        instance.status,
        instance.blueprintId,
        instance.blueprintVersion,
        instance.importedAt,
        instance.removedAt,
      ],
    );
    return instance;
  }

  async removeInstance(instanceId: string, removedAt: string) {
    const sql = getNeonSql();
    await sql.query(
      `
        UPDATE workshop_instances
        SET status = 'removed',
            removed_at = $2::timestamptz,
            updated_at = NOW()
        WHERE id = $1
      `,
      [instanceId, removedAt],
    );
  }
}

type InstanceRow = {
  id: string;
  template_id: string;
  status: WorkshopInstanceRecord["status"];
  blueprint_id: string | null;
  blueprint_version: number | null;
  imported_at: string | null;
  removed_at: string | null;
  workshop_meta: WorkshopInstanceRecord["workshopMeta"];
};

function mapInstanceRow(row: InstanceRow) {
  return createWorkshopInstanceRecord({
    id: row.id,
    templateId: row.template_id,
    status: row.status,
    blueprintId: row.blueprint_id ?? undefined,
    blueprintVersion: row.blueprint_version ?? undefined,
    importedAt: row.imported_at ?? undefined,
    removedAt: row.removed_at,
    workshopMeta: row.workshop_meta,
  });
}

export function getWorkshopInstanceRepository(): WorkshopInstanceRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon" ? new NeonWorkshopInstanceRepository() : new FileWorkshopInstanceRepository();
}

let overrideRepository: WorkshopInstanceRepository | null = null;

export function setWorkshopInstanceRepositoryForTests(repository: WorkshopInstanceRepository | null) {
  overrideRepository = repository;
}
