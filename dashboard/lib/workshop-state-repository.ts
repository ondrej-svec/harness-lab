import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { createWorkshopStateFromInstance, seedWorkshopState, type WorkshopState } from "./workshop-data";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { RuntimeWorkshopStateRepository } from "./runtime-contracts";
import { getWorkshopInstanceRepository } from "./workshop-instance-repository";

export type WorkshopStateRepository = RuntimeWorkshopStateRepository;

export class FileWorkshopStateRepository implements WorkshopStateRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getStatePath(instanceId: string) {
    return process.env.HARNESS_STATE_PATH ?? path.join(this.dataDir, instanceId, "workshop-state.json");
  }

  private async ensureStateFile(instanceId: string) {
    const statePath = this.getStatePath(instanceId);
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(statePath), { recursive: true });
    try {
      await readFile(statePath, "utf8");
    } catch {
      await writeFile(
        statePath,
        JSON.stringify({ ...seedWorkshopState, workshopId: instanceId }, null, 2),
      );
    }
  }

  async getState(instanceId: string) {
    const statePath = this.getStatePath(instanceId);
    await this.ensureStateFile(instanceId);
    const raw = await readFile(statePath, "utf8");
    return JSON.parse(raw) as WorkshopState;
  }

  async saveState(instanceId: string, state: WorkshopState) {
    const statePath = this.getStatePath(instanceId);
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(statePath), { recursive: true });
    const tempPath = `${statePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify(state, null, 2));
    await rename(tempPath, statePath);
  }
}

export class NeonWorkshopStateRepository implements WorkshopStateRepository {
  private async ensureInstance(instanceId: string) {
    const sql = getNeonSql();
    const existing = (await sql.query("SELECT id FROM workshop_instances WHERE id = $1 LIMIT 1", [
      instanceId,
    ])) as { id: string }[];

    if (existing.length > 0) {
      return;
    }

    const instance = await getWorkshopInstanceRepository().getInstance(instanceId);
    const state = instance ? createWorkshopStateFromInstance(instance) : { ...seedWorkshopState, workshopId: instanceId };

    await sql`
      INSERT INTO workshop_instances (id, template_id, workshop_meta, workshop_state)
      VALUES (
        ${state.workshopId},
        ${instance?.templateId ?? seedWorkshopState.workshopId},
        ${JSON.stringify(state.workshopMeta)}::jsonb,
        ${JSON.stringify(state)}::jsonb
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  async getState(instanceId: string) {
    const sql = getNeonSql();
    await this.ensureInstance(instanceId);
    const rows = (await sql.query(
      "SELECT workshop_state FROM workshop_instances WHERE id = $1 LIMIT 1",
      [instanceId],
    )) as { workshop_state: WorkshopState }[];

    return rows[0]?.workshop_state ?? { ...seedWorkshopState, workshopId: instanceId };
  }

  async saveState(instanceId: string, state: WorkshopState) {
    const sql = getNeonSql();
    await this.ensureInstance(instanceId);
    await sql`
      UPDATE workshop_instances
      SET workshop_meta = ${JSON.stringify(state.workshopMeta)}::jsonb,
          workshop_state = ${JSON.stringify(state)}::jsonb,
          updated_at = NOW()
      WHERE id = ${instanceId}
    `;
  }
}

export function getWorkshopStateRepository(): WorkshopStateRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon" ? new NeonWorkshopStateRepository() : new FileWorkshopStateRepository();
}

let overrideRepository: WorkshopStateRepository | null = null;

export function setWorkshopStateRepositoryForTests(repository: WorkshopStateRepository | null) {
  overrideRepository = repository;
}
