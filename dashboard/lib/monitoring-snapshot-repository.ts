import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { MonitoringSnapshotRepository } from "./runtime-contracts";

type StoredMonitoringSnapshots = {
  items: Awaited<ReturnType<MonitoringSnapshotRepository["getSnapshots"]>>;
};

class FileMonitoringSnapshotRepository implements MonitoringSnapshotRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getMonitoringPath(instanceId: string) {
    return path.join(this.dataDir, instanceId, "monitoring-snapshots.json");
  }

  private async ensureFile(instanceId: string) {
    const monitoringPath = this.getMonitoringPath(instanceId);
    await mkdir(path.dirname(monitoringPath), { recursive: true });
    try {
      await readFile(monitoringPath, "utf8");
    } catch {
      await writeFile(monitoringPath, JSON.stringify({ items: [] }, null, 2));
    }
  }

  async getSnapshots(instanceId: string) {
    const monitoringPath = this.getMonitoringPath(instanceId);
    await this.ensureFile(instanceId);
    const raw = await readFile(monitoringPath, "utf8");
    return (JSON.parse(raw) as StoredMonitoringSnapshots).items;
  }

  async replaceSnapshots(instanceId: string, snapshots: Awaited<ReturnType<MonitoringSnapshotRepository["getSnapshots"]>>) {
    const monitoringPath = this.getMonitoringPath(instanceId);
    await mkdir(path.dirname(monitoringPath), { recursive: true });
    const tempPath = `${monitoringPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ items: snapshots }, null, 2));
    await rename(tempPath, monitoringPath);
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    void olderThan;
    await this.ensureFile(instanceId);
  }
}

class NeonMonitoringSnapshotRepository implements MonitoringSnapshotRepository {
  async getSnapshots(instanceId: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT payload
        FROM monitoring_snapshots
        WHERE instance_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [instanceId],
    )) as { payload: Awaited<ReturnType<MonitoringSnapshotRepository["getSnapshots"]>> }[];

    return rows[0]?.payload ?? [];
  }

  async replaceSnapshots(instanceId: string, snapshots: Awaited<ReturnType<MonitoringSnapshotRepository["getSnapshots"]>>) {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO monitoring_snapshots (id, instance_id, payload, created_at)
        VALUES ($1, $2, $3::jsonb, NOW())
      `,
      [`monitoring-${randomUUID()}`, instanceId, JSON.stringify(snapshots)],
    );
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    const sql = getNeonSql();
    await sql.query(
      `
        DELETE FROM monitoring_snapshots
        WHERE instance_id = $1
          AND created_at < $2::timestamptz
      `,
      [instanceId, olderThan],
    );
  }
}

export function getMonitoringSnapshotRepository(): MonitoringSnapshotRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon"
    ? new NeonMonitoringSnapshotRepository()
    : new FileMonitoringSnapshotRepository();
}

let overrideRepository: MonitoringSnapshotRepository | null = null;

export function setMonitoringSnapshotRepositoryForTests(repository: MonitoringSnapshotRepository | null) {
  overrideRepository = repository;
}
