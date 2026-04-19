import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import { assertSafeInstanceId } from "./safe-instance-id";
import type {
  TeamCompositionHistoryEvent,
  TeamCompositionHistoryRepository,
  WorkshopInstanceId,
} from "./runtime-contracts";

type StoredTeamCompositionHistory = {
  version: 1;
  events: TeamCompositionHistoryEvent[];
};

function createEmptyStore(): StoredTeamCompositionHistory {
  return { version: 1, events: [] };
}

const fileHistoryWriteQueues = new Map<string, Promise<void>>();

function isNodeErrorWithCode(
  error: unknown,
  code: string,
): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === code;
}

async function withFileHistoryWriteLock<T>(
  historyPath: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = fileHistoryWriteQueues.get(historyPath) ?? Promise.resolve();
  let releaseCurrent!: () => void;
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });
  const tail = previous.then(
    () => current,
    () => current,
  );
  fileHistoryWriteQueues.set(historyPath, tail);
  await previous;

  try {
    return await operation();
  } finally {
    releaseCurrent();
    if (fileHistoryWriteQueues.get(historyPath) === tail) {
      fileHistoryWriteQueues.delete(historyPath);
    }
  }
}

export class FileTeamCompositionHistoryRepository
  implements TeamCompositionHistoryRepository
{
  private readonly dataDir =
    process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getHistoryPath(instanceId: WorkshopInstanceId) {
    assertSafeInstanceId(instanceId);
    return path.join(this.dataDir, instanceId, "team-composition-history.json");
  }

  private async ensureFileAtPath(historyPath: string) {
    await mkdir(path.dirname(historyPath), { recursive: true });
    try {
      await readFile(historyPath, "utf8");
    } catch (error) {
      if (!isNodeErrorWithCode(error, "ENOENT")) {
        throw error;
      }

      try {
        await writeFile(
          historyPath,
          `${JSON.stringify(createEmptyStore(), null, 2)}\n`,
          { flag: "wx" },
        );
      } catch (writeError) {
        if (!isNodeErrorWithCode(writeError, "EEXIST")) {
          throw writeError;
        }
      }
    }
  }

  async list(instanceId: WorkshopInstanceId): Promise<TeamCompositionHistoryEvent[]> {
    const historyPath = this.getHistoryPath(instanceId);
    await this.ensureFileAtPath(historyPath);
    const raw = await readFile(historyPath, "utf8");
    const parsed = JSON.parse(raw) as StoredTeamCompositionHistory;
    const events = Array.isArray(parsed.events) ? parsed.events : [];
    return [...events].sort((left, right) => left.capturedAt.localeCompare(right.capturedAt));
  }

  async append(instanceId: WorkshopInstanceId, event: TeamCompositionHistoryEvent): Promise<void> {
    const historyPath = this.getHistoryPath(instanceId);
    await withFileHistoryWriteLock(historyPath, async () => {
      await this.ensureFileAtPath(historyPath);
      const raw = await readFile(historyPath, "utf8");
      const parsed = JSON.parse(raw) as StoredTeamCompositionHistory;
      const events = Array.isArray(parsed.events) ? parsed.events : [];
      const next: StoredTeamCompositionHistory = {
        version: 1,
        events: [...events, event],
      };
      const tempPath = `${historyPath}.${randomUUID()}.tmp`;
      await writeFile(tempPath, `${JSON.stringify(next, null, 2)}\n`);
      await rename(tempPath, historyPath);
    });
  }
}

type TeamCompositionHistoryRow = {
  id: string;
  instance_id: string;
  event_type: TeamCompositionHistoryEvent["eventType"];
  participant_id: string | null;
  from_team_id: string | null;
  to_team_id: string | null;
  captured_at: string;
  actor_kind: TeamCompositionHistoryEvent["actorKind"];
  note: string | null;
  rotation_id: string | null;
};

function rowToEvent(row: TeamCompositionHistoryRow): TeamCompositionHistoryEvent {
  return {
    id: row.id,
    instanceId: row.instance_id,
    eventType: row.event_type,
    participantId: row.participant_id,
    fromTeamId: row.from_team_id,
    toTeamId: row.to_team_id,
    capturedAt: row.captured_at,
    actorKind: row.actor_kind,
    note: row.note,
    rotationId: row.rotation_id,
  };
}

export class NeonTeamCompositionHistoryRepository
  implements TeamCompositionHistoryRepository
{
  async list(instanceId: WorkshopInstanceId): Promise<TeamCompositionHistoryEvent[]> {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT
          id,
          instance_id,
          event_type,
          participant_id,
          from_team_id,
          to_team_id,
          captured_at,
          actor_kind,
          note,
          rotation_id
        FROM team_composition_history
        WHERE instance_id = $1
        ORDER BY captured_at ASC
      `,
      [instanceId],
    )) as TeamCompositionHistoryRow[];

    return rows.map(rowToEvent);
  }

  async append(instanceId: WorkshopInstanceId, event: TeamCompositionHistoryEvent): Promise<void> {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO team_composition_history
          (
            id,
            instance_id,
            event_type,
            participant_id,
            from_team_id,
            to_team_id,
            captured_at,
            actor_kind,
            note,
            rotation_id
          )
        VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8, $9, $10)
      `,
      [
        event.id,
        instanceId,
        event.eventType,
        event.participantId,
        event.fromTeamId,
        event.toTeamId,
        event.capturedAt,
        event.actorKind,
        event.note ?? null,
        event.rotationId ?? null,
      ],
    );
  }
}

let overrideRepository: TeamCompositionHistoryRepository | null = null;

export function getTeamCompositionHistoryRepository(): TeamCompositionHistoryRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon"
    ? new NeonTeamCompositionHistoryRepository()
    : new FileTeamCompositionHistoryRepository();
}

export function setTeamCompositionHistoryRepositoryForTests(
  repository: TeamCompositionHistoryRepository | null,
) {
  overrideRepository = repository;
}
