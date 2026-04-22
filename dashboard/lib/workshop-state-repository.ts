import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { createWorkshopStateFromInstance, seedWorkshopState, type WorkshopState } from "./workshop-data";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { RuntimeWorkshopStateRepository } from "./runtime-contracts";
import { parseWorkshopStateShape } from "./schemas/workshop-state-schema";
import { getWorkshopInstanceRepository } from "./workshop-instance-repository";

export type WorkshopStateRepository = RuntimeWorkshopStateRepository;

export class WorkshopStateConflictError extends Error {
  constructor(instanceId: string) {
    super(`workshop state changed before save completed for instance '${instanceId}'`);
    this.name = "WorkshopStateConflictError";
  }
}

export function isWorkshopStateConflictError(error: unknown): error is WorkshopStateConflictError {
  return error instanceof WorkshopStateConflictError;
}

function withStateVersion(state: WorkshopState, fallbackVersion = 1): WorkshopState {
  return {
    ...state,
    version: state.version ?? fallbackVersion,
  };
}

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
      const instance = await getWorkshopInstanceRepository().getInstance(instanceId);
      const seededState =
        instanceId === seedWorkshopState.workshopId
          ? { ...seedWorkshopState, workshopId: instanceId }
          : instance
            ? createWorkshopStateFromInstance(instance)
            : { ...seedWorkshopState, workshopId: instanceId };
      await writeFile(
        statePath,
        JSON.stringify(seededState, null, 2),
      );
    }
  }

  async getState(instanceId: string) {
    const statePath = this.getStatePath(instanceId);
    await this.ensureStateFile(instanceId);
    const raw = await readFile(statePath, "utf8");
    return withStateVersion(JSON.parse(raw) as WorkshopState);
  }

  async saveState(instanceId: string, state: WorkshopState, options?: { expectedVersion?: number }) {
    const statePath = this.getStatePath(instanceId);
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(statePath), { recursive: true });
    await this.ensureStateFile(instanceId);
    const current = withStateVersion(JSON.parse(await readFile(statePath, "utf8")) as WorkshopState);
    if (
      typeof options?.expectedVersion === "number" &&
      current.version !== options.expectedVersion
    ) {
      throw new WorkshopStateConflictError(instanceId);
    }
    const tempPath = `${statePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify(withStateVersion(state), null, 2));
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
      INSERT INTO workshop_instances (id, template_id, workshop_meta, workshop_state, state_version)
      VALUES (
        ${state.workshopId},
        ${instance?.templateId ?? seedWorkshopState.workshopId},
        ${JSON.stringify(state.workshopMeta)}::jsonb,
        ${JSON.stringify(withStateVersion(state))}::jsonb,
        1
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  async getState(instanceId: string) {
    const sql = getNeonSql();
    await this.ensureInstance(instanceId);
    const rows = (await sql.query(
      "SELECT workshop_state, state_version FROM workshop_instances WHERE id = $1 LIMIT 1",
      [instanceId],
    )) as { workshop_state: unknown; state_version: number }[];

    const row = rows[0];
    if (!row) {
      return { ...seedWorkshopState, workshopId: instanceId };
    }

    // Shape guard: alert on structural drift (e.g. column-level
    // corruption, unexpected top-level shape). Field-level defaults
    // for legacy rows continue to be filled in by
    // normalizeStoredWorkshopState in workshop-store.ts.
    const shapeChecked = parseWorkshopStateShape(row.workshop_state, { instanceId });
    if (!shapeChecked) {
      return { ...seedWorkshopState, workshopId: instanceId };
    }

    return {
      ...(shapeChecked as WorkshopState),
      version: row.state_version ?? (shapeChecked as WorkshopState).version ?? 1,
    };
  }

  async saveState(instanceId: string, state: WorkshopState, options?: { expectedVersion?: number }) {
    const sql = getNeonSql();
    await this.ensureInstance(instanceId);
    if (typeof options?.expectedVersion === "number") {
      const rows = (await sql.query(
        `
          UPDATE workshop_instances
          SET workshop_meta = $1::jsonb,
              workshop_state = $2::jsonb,
              state_version = $3,
              updated_at = NOW()
          WHERE id = $4
            AND state_version = $5
          RETURNING state_version
        `,
        [
          JSON.stringify(state.workshopMeta),
          JSON.stringify(withStateVersion(state)),
          state.version ?? options.expectedVersion + 1,
          instanceId,
          options.expectedVersion,
        ],
      )) as { state_version: number }[];

      if (rows.length === 0) {
        throw new WorkshopStateConflictError(instanceId);
      }
      return;
    }

    await sql.query(
      `
        UPDATE workshop_instances
        SET workshop_meta = $1::jsonb,
            workshop_state = $2::jsonb,
            state_version = $3,
            updated_at = NOW()
        WHERE id = $4
      `,
      [
        JSON.stringify(state.workshopMeta),
        JSON.stringify(withStateVersion(state)),
        state.version ?? 1,
        instanceId,
      ],
    );
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
