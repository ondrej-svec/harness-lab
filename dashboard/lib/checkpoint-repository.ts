import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { CheckpointRecord, CheckpointRepository } from "./runtime-contracts";

type StoredCheckpoints = {
  items: CheckpointRecord[];
};

export class FileCheckpointRepository implements CheckpointRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getCheckpointsPath(instanceId: string) {
    return path.join(this.dataDir, instanceId, "checkpoints.json");
  }

  private async ensureFile(instanceId: string) {
    const checkpointsPath = this.getCheckpointsPath(instanceId);
    await mkdir(path.dirname(checkpointsPath), { recursive: true });
    try {
      await readFile(checkpointsPath, "utf8");
    } catch {
      await writeFile(checkpointsPath, JSON.stringify({ items: [] satisfies CheckpointRecord[] }, null, 2));
    }
  }

  async listCheckpoints(instanceId: string) {
    const checkpointsPath = this.getCheckpointsPath(instanceId);
    await this.ensureFile(instanceId);
    const raw = await readFile(checkpointsPath, "utf8");
    return (JSON.parse(raw) as StoredCheckpoints).items;
  }

  async appendCheckpoint(instanceId: string, checkpoint: CheckpointRecord) {
    const checkpoints = await this.listCheckpoints(instanceId);
    await this.replaceCheckpoints(instanceId, [checkpoint, ...checkpoints].slice(0, 12));
  }

  async replaceCheckpoints(instanceId: string, checkpoints: CheckpointRecord[]) {
    const checkpointsPath = this.getCheckpointsPath(instanceId);
    await mkdir(path.dirname(checkpointsPath), { recursive: true });
    const tempPath = `${checkpointsPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ items: checkpoints }, null, 2));
    await rename(tempPath, checkpointsPath);
  }
}

export class NeonCheckpointRepository implements CheckpointRepository {
  async listCheckpoints(instanceId: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT payload
        FROM checkpoints
        WHERE instance_id = $1
        ORDER BY created_at DESC
        LIMIT 12
      `,
      [instanceId],
    )) as { payload: CheckpointRecord }[];

    return rows.map((row) => row.payload);
  }

  async appendCheckpoint(instanceId: string, checkpoint: CheckpointRecord) {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO checkpoints (id, instance_id, team_id, payload, created_at)
        VALUES ($1, $2, $3, $4::jsonb, NOW())
      `,
      [checkpoint.id, instanceId, checkpoint.teamId, JSON.stringify(checkpoint)],
    );
  }

  async replaceCheckpoints(instanceId: string, checkpoints: CheckpointRecord[]) {
    const sql = getNeonSql();
    await sql.query("DELETE FROM checkpoints WHERE instance_id = $1", [instanceId]);

    for (const checkpoint of checkpoints) {
      await this.appendCheckpoint(instanceId, checkpoint);
    }
  }
}

export function getCheckpointRepository(): CheckpointRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon" ? new NeonCheckpointRepository() : new FileCheckpointRepository();
}

let overrideRepository: CheckpointRepository | null = null;

export function setCheckpointRepositoryForTests(repository: CheckpointRepository | null) {
  overrideRepository = repository;
}
