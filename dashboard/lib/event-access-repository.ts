import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export type ParticipantSessionRecord = {
  token: string;
  createdAt: string;
  expiresAt: string;
  lastValidatedAt: string;
};

type StoredParticipantSessions = {
  sessions: ParticipantSessionRecord[];
};

export interface EventAccessRepository {
  getSessions(): Promise<ParticipantSessionRecord[]>;
  saveSessions(sessions: ParticipantSessionRecord[]): Promise<void>;
}

class FileEventAccessRepository implements EventAccessRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");
  private readonly sessionsPath =
    process.env.HARNESS_EVENT_ACCESS_PATH ?? path.join(this.dataDir, "participant-sessions.json");

  private async ensureFile() {
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(this.sessionsPath), { recursive: true });
    try {
      await readFile(this.sessionsPath, "utf8");
    } catch {
      await writeFile(this.sessionsPath, JSON.stringify({ sessions: [] satisfies ParticipantSessionRecord[] }, null, 2));
    }
  }

  async getSessions() {
    await this.ensureFile();
    const raw = await readFile(this.sessionsPath, "utf8");
    const parsed = JSON.parse(raw) as StoredParticipantSessions;
    return parsed.sessions;
  }

  async saveSessions(sessions: ParticipantSessionRecord[]) {
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(this.sessionsPath), { recursive: true });
    const tempPath = `${this.sessionsPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ sessions }, null, 2));
    await rename(tempPath, this.sessionsPath);
  }
}

export function getEventAccessRepository(): EventAccessRepository {
  return overrideRepository ?? new FileEventAccessRepository();
}

let overrideRepository: EventAccessRepository | null = null;

export function setEventAccessRepositoryForTests(repository: EventAccessRepository | null) {
  overrideRepository = repository;
}
