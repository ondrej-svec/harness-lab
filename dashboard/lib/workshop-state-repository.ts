import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { seedWorkshopState, type WorkshopState } from "./workshop-data";

export interface WorkshopStateRepository {
  getState(): Promise<WorkshopState>;
  saveState(state: WorkshopState): Promise<void>;
}

class FileWorkshopStateRepository implements WorkshopStateRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");
  private readonly statePath = process.env.HARNESS_STATE_PATH ?? path.join(this.dataDir, "workshop-state.json");

  private async ensureStateFile() {
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(this.statePath), { recursive: true });
    try {
      await readFile(this.statePath, "utf8");
    } catch {
      await writeFile(this.statePath, JSON.stringify(seedWorkshopState, null, 2));
    }
  }

  async getState() {
    await this.ensureStateFile();
    const raw = await readFile(this.statePath, "utf8");
    return JSON.parse(raw) as WorkshopState;
  }

  async saveState(state: WorkshopState) {
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(this.statePath), { recursive: true });
    const tempPath = `${this.statePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify(state, null, 2));
    await rename(tempPath, this.statePath);
  }
}

export function getWorkshopStateRepository(): WorkshopStateRepository {
  return overrideRepository ?? new FileWorkshopStateRepository();
}

let overrideRepository: WorkshopStateRepository | null = null;

export function setWorkshopStateRepositoryForTests(repository: WorkshopStateRepository | null) {
  overrideRepository = repository;
}
