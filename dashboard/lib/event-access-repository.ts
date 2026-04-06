import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { ParticipantSessionRepository, ParticipantSessionRecord } from "./runtime-contracts";

type StoredParticipantSessions = {
  sessions: ParticipantSessionRecord[];
};

export type EventAccessRepository = ParticipantSessionRepository;

class FileEventAccessRepository implements EventAccessRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getSessionsPath(instanceId: string) {
    return process.env.HARNESS_EVENT_ACCESS_PATH ?? path.join(this.dataDir, instanceId, "participant-sessions.json");
  }

  private async ensureFile(instanceId: string) {
    const sessionsPath = this.getSessionsPath(instanceId);
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(sessionsPath), { recursive: true });
    try {
      await readFile(sessionsPath, "utf8");
    } catch {
      await writeFile(sessionsPath, JSON.stringify({ sessions: [] satisfies ParticipantSessionRecord[] }, null, 2));
    }
  }

  async getSessions(instanceId: string) {
    const sessionsPath = this.getSessionsPath(instanceId);
    await this.ensureFile(instanceId);
    const raw = await readFile(sessionsPath, "utf8");
    const parsed = JSON.parse(raw) as StoredParticipantSessions;
    return parsed.sessions;
  }

  async saveSessions(instanceId: string, sessions: ParticipantSessionRecord[]) {
    const sessionsPath = this.getSessionsPath(instanceId);
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(sessionsPath), { recursive: true });
    const tempPath = `${sessionsPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ sessions }, null, 2));
    await rename(tempPath, sessionsPath);
  }
}

class NeonEventAccessRepository implements EventAccessRepository {
  async getSessions(instanceId: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT token_hash, instance_id, created_at, expires_at, last_validated_at, absolute_expires_at
        FROM participant_sessions
        WHERE instance_id = $1
        ORDER BY created_at ASC
      `,
      [instanceId],
    )) as {
      token_hash: string;
      instance_id: string;
      created_at: string;
      expires_at: string;
      last_validated_at: string;
      absolute_expires_at: string;
    }[];

    return rows.map((row) => ({
      tokenHash: row.token_hash,
      instanceId: row.instance_id,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      lastValidatedAt: row.last_validated_at,
      absoluteExpiresAt: row.absolute_expires_at,
    }));
  }

  async saveSessions(instanceId: string, sessions: ParticipantSessionRecord[]) {
    const sql = getNeonSql();

    await sql`DELETE FROM participant_sessions WHERE instance_id = ${instanceId}`;

    if (sessions.length === 0) {
      return;
    }

    await sql.transaction(
      sessions.map((session) => sql`
        INSERT INTO participant_sessions (token_hash, instance_id, created_at, expires_at, last_validated_at, absolute_expires_at)
        VALUES (
          ${session.tokenHash},
          ${instanceId},
          ${session.createdAt}::timestamptz,
          ${session.expiresAt}::timestamptz,
          ${session.lastValidatedAt}::timestamptz,
          ${session.absoluteExpiresAt}::timestamptz
        )
      `),
    );
  }
}

export function getEventAccessRepository(): EventAccessRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon" ? new NeonEventAccessRepository() : new FileEventAccessRepository();
}

let overrideRepository: EventAccessRepository | null = null;

export function setEventAccessRepositoryForTests(repository: EventAccessRepository | null) {
  overrideRepository = repository;
}
