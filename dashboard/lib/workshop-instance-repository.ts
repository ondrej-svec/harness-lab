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
  private columnSupportPromise: Promise<WorkshopInstanceColumnSupport> | null = null;

  private async getColumnSupport() {
    if (!this.columnSupportPromise) {
      this.columnSupportPromise = loadWorkshopInstanceColumnSupport();
    }

    return this.columnSupportPromise;
  }

  async getDefaultInstanceId() {
    const sql = getNeonSql();
    const columnSupport = await this.getColumnSupport();
    const rows = (await sql.query(
      `
        SELECT id
        FROM workshop_instances
        ${buildActiveInstanceFilter(columnSupport, false)}
        ORDER BY id ASC
        LIMIT 1
      `,
    )) as Array<{ id: string }>;

    return rows[0]?.id ?? sampleWorkshopInstances[0]?.id ?? "sample-studio-a";
  }

  async getInstance(instanceId: string) {
    const sql = getNeonSql();
    const columnSupport = await this.getColumnSupport();
    const rows = (await sql.query(
      `
        SELECT ${buildInstanceSelectList(columnSupport)}
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
    const columnSupport = await this.getColumnSupport();
    const rows = (await sql.query(
      `
        SELECT ${buildInstanceSelectList(columnSupport)}
        FROM workshop_instances
        ${buildActiveInstanceFilter(columnSupport, includeRemoved)}
        ORDER BY id ASC
      `,
    )) as InstanceRow[];

    return rows.map(mapInstanceRow);
  }

  async createInstance(instance: WorkshopInstanceRecord) {
    const sql = getNeonSql();
    const columnSupport = await this.getColumnSupport();
    const { text, values } = buildCreateInstanceQuery(instance, columnSupport);

    await sql.query(text, values);
    return instance;
  }

  async updateInstance(instanceId: string, instance: WorkshopInstanceRecord) {
    const sql = getNeonSql();
    const columnSupport = await this.getColumnSupport();
    const { text, values } = buildUpdateInstanceQuery(instanceId, instance, columnSupport);

    await sql.query(text, values);
    return instance;
  }

  async removeInstance(instanceId: string, removedAt: string) {
    const sql = getNeonSql();
    const columnSupport = await this.getColumnSupport();
    const { text, values } = buildRemoveInstanceQuery(instanceId, removedAt, columnSupport);

    await sql.query(text, values);
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

type WorkshopInstanceColumnSupport = {
  blueprintId: boolean;
  blueprintVersion: boolean;
  importedAt: boolean;
  removedAt: boolean;
};

async function loadWorkshopInstanceColumnSupport(): Promise<WorkshopInstanceColumnSupport> {
  const sql = getNeonSql();
  const rows = (await sql.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'workshop_instances'
        AND column_name IN ('blueprint_id', 'blueprint_version', 'imported_at', 'removed_at')
    `,
  )) as Array<{ column_name: string }>;
  const columns = new Set(rows.map((row) => row.column_name));

  return {
    blueprintId: columns.has("blueprint_id"),
    blueprintVersion: columns.has("blueprint_version"),
    importedAt: columns.has("imported_at"),
    removedAt: columns.has("removed_at"),
  };
}

function buildInstanceSelectList(columnSupport: WorkshopInstanceColumnSupport) {
  return [
    "id",
    "template_id",
    "status",
    columnSupport.blueprintId ? "blueprint_id" : "NULL::text AS blueprint_id",
    columnSupport.blueprintVersion ? "blueprint_version" : "NULL::integer AS blueprint_version",
    columnSupport.importedAt ? "imported_at" : "NULL::timestamptz AS imported_at",
    columnSupport.removedAt ? "removed_at" : "NULL::timestamptz AS removed_at",
    "workshop_meta",
  ].join(", ");
}

function buildActiveInstanceFilter(columnSupport: WorkshopInstanceColumnSupport, includeRemoved: boolean) {
  if (includeRemoved) {
    return "";
  }

  return columnSupport.removedAt ? "WHERE removed_at IS NULL AND status <> 'removed'" : "WHERE status <> 'removed'";
}

function buildCreateInstanceQuery(instance: WorkshopInstanceRecord, columnSupport: WorkshopInstanceColumnSupport) {
  const columns = ["id", "template_id", "workshop_meta", "workshop_state", "status"];
  const placeholders = ["$1", "$2", "$3::jsonb", "$4::jsonb", "$5"];
  const values: Array<string | number | null> = [
    instance.id,
    instance.templateId,
    JSON.stringify(instance.workshopMeta),
    JSON.stringify({}),
    instance.status,
  ];
  let nextIndex = 6;

  if (columnSupport.blueprintId) {
    columns.push("blueprint_id");
    placeholders.push(`$${nextIndex}`);
    values.push(instance.blueprintId);
    nextIndex += 1;
  }

  if (columnSupport.blueprintVersion) {
    columns.push("blueprint_version");
    placeholders.push(`$${nextIndex}`);
    values.push(instance.blueprintVersion);
    nextIndex += 1;
  }

  if (columnSupport.importedAt) {
    columns.push("imported_at");
    placeholders.push(`$${nextIndex}::timestamptz`);
    values.push(instance.importedAt);
    nextIndex += 1;
  }

  if (columnSupport.removedAt) {
    columns.push("removed_at");
    placeholders.push(`$${nextIndex}::timestamptz`);
    values.push(instance.removedAt);
  }

  return {
    text: `
      INSERT INTO workshop_instances (
        ${columns.join(", ")}, created_at, updated_at
      )
      VALUES (${placeholders.join(", ")}, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `,
    values,
  };
}

function buildUpdateInstanceQuery(
  instanceId: string,
  instance: WorkshopInstanceRecord,
  columnSupport: WorkshopInstanceColumnSupport,
) {
  const values: Array<string | number | null> = [
    instanceId,
    instance.templateId,
    JSON.stringify(instance.workshopMeta),
    instance.status,
  ];
  const assignments = ["template_id = $2", "workshop_meta = $3::jsonb", "status = $4"];
  let nextIndex = 5;

  if (columnSupport.blueprintId) {
    assignments.push(`blueprint_id = $${nextIndex}`);
    values.push(instance.blueprintId);
    nextIndex += 1;
  }

  if (columnSupport.blueprintVersion) {
    assignments.push(`blueprint_version = $${nextIndex}`);
    values.push(instance.blueprintVersion);
    nextIndex += 1;
  }

  if (columnSupport.importedAt) {
    assignments.push(`imported_at = $${nextIndex}::timestamptz`);
    values.push(instance.importedAt);
    nextIndex += 1;
  }

  if (columnSupport.removedAt) {
    assignments.push(`removed_at = $${nextIndex}::timestamptz`);
    values.push(instance.removedAt);
  }

  assignments.push("updated_at = NOW()");

  return {
    text: `
      UPDATE workshop_instances
      SET ${assignments.join(",\n          ")}
      WHERE id = $1
    `,
    values,
  };
}

function buildRemoveInstanceQuery(
  instanceId: string,
  removedAt: string,
  columnSupport: WorkshopInstanceColumnSupport,
) {
  const assignments = ["status = 'removed'"];
  const values: Array<string | null> = [instanceId];

  if (columnSupport.removedAt) {
    assignments.push("removed_at = $2::timestamptz");
    values.push(removedAt);
  }

  assignments.push("updated_at = NOW()");

  return {
    text: `
      UPDATE workshop_instances
      SET ${assignments.join(",\n          ")}
      WHERE id = $1
    `,
    values,
  };
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
