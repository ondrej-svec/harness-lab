import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { InstanceArchiveRecord, InstanceArchiveRepository } from "./runtime-contracts";

type StoredArchives = {
  items: InstanceArchiveRecord[];
};

class FileInstanceArchiveRepository implements InstanceArchiveRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getArchivePath(instanceId: string) {
    return path.join(this.dataDir, instanceId, "archives.json");
  }

  private async ensureFile(instanceId: string) {
    const archivePath = this.getArchivePath(instanceId);
    await mkdir(path.dirname(archivePath), { recursive: true });
    try {
      await readFile(archivePath, "utf8");
    } catch {
      await writeFile(archivePath, JSON.stringify({ items: [] satisfies InstanceArchiveRecord[] }, null, 2));
    }
  }

  private async listArchives(instanceId: string) {
    const archivePath = this.getArchivePath(instanceId);
    await this.ensureFile(instanceId);
    const raw = await readFile(archivePath, "utf8");
    return (JSON.parse(raw) as StoredArchives).items;
  }

  private async writeArchives(instanceId: string, items: InstanceArchiveRecord[]) {
    const archivePath = this.getArchivePath(instanceId);
    await mkdir(path.dirname(archivePath), { recursive: true });
    const tempPath = `${archivePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ items }, null, 2));
    await rename(tempPath, archivePath);
  }

  async createArchive(record: InstanceArchiveRecord) {
    const items = await this.listArchives(record.instanceId);
    await this.writeArchives(record.instanceId, [record, ...items]);
  }

  async getLatestArchive(instanceId: string) {
    const items = await this.listArchives(instanceId);
    return items[0] ?? null;
  }

  async deleteExpiredArchives(now: string) {
    const entries = await readdir(this.dataDir, { withFileTypes: true }).catch(() => []);
    const nowMs = Date.parse(now);

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const instanceId = entry.name;
      const items = await this.listArchives(instanceId).catch(() => []);
      await this.writeArchives(
        instanceId,
        items.filter((item) => !item.retentionUntil || Date.parse(item.retentionUntil) >= nowMs),
      );
    }
  }
}

class NeonInstanceArchiveRepository implements InstanceArchiveRepository {
  async createArchive(record: InstanceArchiveRecord) {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO instance_archives (
          id,
          instance_id,
          archive_status,
          storage_uri,
          retention_until,
          notes,
          payload,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5::timestamptz, $6, $7::jsonb, $8::timestamptz)
      `,
      [
        record.id,
        record.instanceId,
        record.archiveStatus,
        record.storageUri,
        record.retentionUntil,
        record.notes,
        JSON.stringify(record.payload),
        record.createdAt,
      ],
    );
  }

  async getLatestArchive(instanceId: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, instance_id, archive_status, storage_uri, retention_until, notes, payload, created_at
        FROM instance_archives
        WHERE instance_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [instanceId],
    )) as {
      id: string;
      instance_id: string;
      archive_status: InstanceArchiveRecord["archiveStatus"];
      storage_uri: string | null;
      retention_until: string | null;
      notes: string | null;
      payload: InstanceArchiveRecord["payload"];
      created_at: string;
    }[];

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      instanceId: row.instance_id,
      archiveStatus: row.archive_status,
      storageUri: row.storage_uri,
      retentionUntil: row.retention_until,
      notes: row.notes,
      payload: row.payload,
      createdAt: row.created_at,
    };
  }

  async deleteExpiredArchives(now: string) {
    const sql = getNeonSql();
    await sql.query(
      `
        DELETE FROM instance_archives
        WHERE retention_until IS NOT NULL
          AND retention_until < $1::timestamptz
      `,
      [now],
    );
  }
}

export function getInstanceArchiveRepository(): InstanceArchiveRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon"
    ? new NeonInstanceArchiveRepository()
    : new FileInstanceArchiveRepository();
}

let overrideRepository: InstanceArchiveRepository | null = null;

export function setInstanceArchiveRepositoryForTests(repository: InstanceArchiveRepository | null) {
  overrideRepository = repository;
}
