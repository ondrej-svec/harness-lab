import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { RotationSignal, RotationSignalRepository, WorkshopInstanceId } from "./runtime-contracts";

type StoredRotationSignals = {
  version: 1;
  signals: RotationSignal[];
};

function createEmptyStore(): StoredRotationSignals {
  return { version: 1, signals: [] };
}

export class FileRotationSignalRepository implements RotationSignalRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getSignalPath(instanceId: WorkshopInstanceId) {
    return path.join(this.dataDir, instanceId, "rotation-signals.json");
  }

  private async ensureFile(instanceId: WorkshopInstanceId) {
    const signalPath = this.getSignalPath(instanceId);
    await mkdir(path.dirname(signalPath), { recursive: true });
    try {
      await readFile(signalPath, "utf8");
    } catch {
      await writeFile(signalPath, `${JSON.stringify(createEmptyStore(), null, 2)}\n`);
    }
  }

  async list(instanceId: WorkshopInstanceId): Promise<RotationSignal[]> {
    const signalPath = this.getSignalPath(instanceId);
    await this.ensureFile(instanceId);
    const raw = await readFile(signalPath, "utf8");
    const parsed = JSON.parse(raw) as StoredRotationSignals;
    const signals = Array.isArray(parsed.signals) ? parsed.signals : [];
    return [...signals].sort((left, right) => left.capturedAt.localeCompare(right.capturedAt));
  }

  async append(instanceId: WorkshopInstanceId, signal: RotationSignal): Promise<void> {
    await this.ensureFile(instanceId);
    const signalPath = this.getSignalPath(instanceId);
    const raw = await readFile(signalPath, "utf8");
    const parsed = JSON.parse(raw) as StoredRotationSignals;
    const signals = Array.isArray(parsed.signals) ? parsed.signals : [];
    const next: StoredRotationSignals = {
      version: 1,
      signals: [...signals, signal],
    };
    const tempPath = `${signalPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(next, null, 2)}\n`);
    await rename(tempPath, signalPath);
  }
}

export class NeonRotationSignalRepository implements RotationSignalRepository {
  async list(instanceId: WorkshopInstanceId): Promise<RotationSignal[]> {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, instance_id, captured_at, captured_by, team_id, tags, free_text, artifact_paths
        FROM rotation_signals
        WHERE instance_id = $1
        ORDER BY captured_at ASC
      `,
      [instanceId],
    )) as Array<{
      id: string;
      instance_id: string;
      captured_at: string;
      captured_by: RotationSignal["capturedBy"];
      team_id: string | null;
      tags: string[] | null;
      free_text: string;
      artifact_paths: string[] | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      instanceId: row.instance_id,
      capturedAt: row.captured_at,
      capturedBy: row.captured_by,
      teamId: row.team_id ?? undefined,
      tags: row.tags ?? [],
      freeText: row.free_text,
      artifactPaths: row.artifact_paths ?? undefined,
    }));
  }

  async append(instanceId: WorkshopInstanceId, signal: RotationSignal): Promise<void> {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO rotation_signals
          (id, instance_id, captured_at, captured_by, team_id, tags, free_text, artifact_paths)
        VALUES ($1, $2, $3::timestamptz, $4, $5, $6::jsonb, $7, $8::jsonb)
      `,
      [
        signal.id,
        instanceId,
        signal.capturedAt,
        signal.capturedBy,
        signal.teamId ?? null,
        JSON.stringify(signal.tags),
        signal.freeText,
        signal.artifactPaths ? JSON.stringify(signal.artifactPaths) : null,
      ],
    );
  }
}

let overrideRepository: RotationSignalRepository | null = null;

export function getRotationSignalRepository(): RotationSignalRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon"
    ? new NeonRotationSignalRepository()
    : new FileRotationSignalRepository();
}

export function setRotationSignalRepositoryForTests(repository: RotationSignalRepository | null) {
  overrideRepository = repository;
}
