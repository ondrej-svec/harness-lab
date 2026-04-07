import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { AuditLogRecord, AuditLogRepository } from "./runtime-contracts";

type StoredAuditLog = {
  items: AuditLogRecord[];
};

export class FileAuditLogRepository implements AuditLogRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");
  private readonly logPath = process.env.HARNESS_AUDIT_LOG_PATH ?? path.join(this.dataDir, "audit-log.json");

  private async ensureFile() {
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(this.logPath), { recursive: true });
    try {
      await readFile(this.logPath, "utf8");
    } catch {
      await writeFile(this.logPath, JSON.stringify({ items: [] satisfies AuditLogRecord[] }, null, 2));
    }
  }

  async append(record: AuditLogRecord) {
    await this.ensureFile();
    const raw = await readFile(this.logPath, "utf8");
    const parsed = JSON.parse(raw) as StoredAuditLog;
    const tempPath = `${this.logPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ items: [...parsed.items, record] }, null, 2));
    await rename(tempPath, this.logPath);
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    await this.ensureFile();
    const raw = await readFile(this.logPath, "utf8");
    const parsed = JSON.parse(raw) as StoredAuditLog;
    const olderThanMs = Date.parse(olderThan);
    const tempPath = `${this.logPath}.${randomUUID()}.tmp`;
    await writeFile(
      tempPath,
      JSON.stringify(
        {
          items: parsed.items.filter(
            (item) => item.instanceId !== instanceId || Date.parse(item.createdAt) >= olderThanMs,
          ),
        },
        null,
        2,
      ),
    );
    await rename(tempPath, this.logPath);
  }
}

export class NeonAuditLogRepository implements AuditLogRepository {
  async append(record: AuditLogRecord) {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO audit_log (id, instance_id, actor_kind, action, result, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::timestamptz)
      `,
      [
        record.id,
        record.instanceId,
        record.actorKind,
        record.action,
        record.result,
        JSON.stringify(record.metadata ?? null),
        record.createdAt,
      ],
    );
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    const sql = getNeonSql();
    await sql.query(
      `
        DELETE FROM audit_log
        WHERE instance_id = $1
          AND created_at < $2::timestamptz
      `,
      [instanceId, olderThan],
    );
  }
}

export function getAuditLogRepository(): AuditLogRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon" ? new NeonAuditLogRepository() : new FileAuditLogRepository();
}

let overrideRepository: AuditLogRepository | null = null;

export function setAuditLogRepositoryForTests(repository: AuditLogRepository | null) {
  overrideRepository = repository;
}
