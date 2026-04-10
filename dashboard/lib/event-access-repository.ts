import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { ParticipantSessionRepository, ParticipantSessionRecord } from "./runtime-contracts";

type StoredParticipantSessions = {
  sessions: ParticipantSessionRecord[];
};

export type EventAccessRepository = ParticipantSessionRepository;

export class FileEventAccessRepository implements EventAccessRepository {
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

  async listSessions(instanceId: string) {
    const sessionsPath = this.getSessionsPath(instanceId);
    await this.ensureFile(instanceId);
    const raw = await readFile(sessionsPath, "utf8");
    const parsed = JSON.parse(raw) as StoredParticipantSessions;
    return parsed.sessions;
  }

  async findSession(instanceId: string, tokenHash: string) {
    const sessions = await this.listSessions(instanceId);
    return sessions.find((session) => session.tokenHash === tokenHash) ?? null;
  }

  async findSessionByTokenHash(tokenHash: string) {
    let entries: string[];
    try {
      entries = await readdir(this.dataDir);
    } catch {
      return null;
    }

    for (const entry of entries) {
      const sessionsPath = path.join(this.dataDir, entry, "participant-sessions.json");
      try {
        const raw = await readFile(sessionsPath, "utf8");
        const parsed = JSON.parse(raw) as StoredParticipantSessions;
        const match = parsed.sessions.find((s) => s.tokenHash === tokenHash);
        if (match) {
          return match;
        }
      } catch {
        // Directory without session file — skip
      }
    }

    return null;
  }

  async upsertSession(instanceId: string, session: ParticipantSessionRecord) {
    const sessions = await this.listSessions(instanceId);
    const nextSessions = sessions.some((item) => item.tokenHash === session.tokenHash)
      ? sessions.map((item) => (item.tokenHash === session.tokenHash ? session : item))
      : [...sessions, session];
    await this.writeSessions(instanceId, nextSessions);
  }

  async deleteSession(instanceId: string, tokenHash: string) {
    const sessions = await this.listSessions(instanceId);
    await this.writeSessions(
      instanceId,
      sessions.filter((item) => item.tokenHash !== tokenHash),
    );
  }

  async deleteExpiredSessions(instanceId: string, now: string) {
    const sessions = await this.listSessions(instanceId);
    const nowMs = Date.parse(now);
    await this.writeSessions(
      instanceId,
      sessions.filter(
        (session) => Date.parse(session.expiresAt) > nowMs && Date.parse(session.absoluteExpiresAt) > nowMs,
      ),
    );
  }

  private async writeSessions(instanceId: string, sessions: ParticipantSessionRecord[]) {
    const sessionsPath = this.getSessionsPath(instanceId);
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(path.dirname(sessionsPath), { recursive: true });
    const tempPath = `${sessionsPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ sessions }, null, 2));
    await rename(tempPath, sessionsPath);
  }
}

export class NeonEventAccessRepository implements EventAccessRepository {
  async listSessions(instanceId: string) {
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

  async findSession(instanceId: string, tokenHash: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT token_hash, instance_id, created_at, expires_at, last_validated_at, absolute_expires_at
        FROM participant_sessions
        WHERE instance_id = $1
          AND token_hash = $2
        LIMIT 1
      `,
      [instanceId, tokenHash],
    )) as {
      token_hash: string;
      instance_id: string;
      created_at: string;
      expires_at: string;
      last_validated_at: string;
      absolute_expires_at: string;
    }[];

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      tokenHash: row.token_hash,
      instanceId: row.instance_id,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      lastValidatedAt: row.last_validated_at,
      absoluteExpiresAt: row.absolute_expires_at,
    };
  }

  async findSessionByTokenHash(tokenHash: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT token_hash, instance_id, created_at, expires_at, last_validated_at, absolute_expires_at
        FROM participant_sessions
        WHERE token_hash = $1
        LIMIT 1
      `,
      [tokenHash],
    )) as {
      token_hash: string;
      instance_id: string;
      created_at: string;
      expires_at: string;
      last_validated_at: string;
      absolute_expires_at: string;
    }[];

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      tokenHash: row.token_hash,
      instanceId: row.instance_id,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      lastValidatedAt: row.last_validated_at,
      absoluteExpiresAt: row.absolute_expires_at,
    };
  }

  async upsertSession(instanceId: string, session: ParticipantSessionRecord) {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO participant_sessions (token_hash, instance_id, created_at, expires_at, last_validated_at, absolute_expires_at)
        VALUES ($1, $2, $3::timestamptz, $4::timestamptz, $5::timestamptz, $6::timestamptz)
        ON CONFLICT (token_hash) DO UPDATE
        SET expires_at = EXCLUDED.expires_at,
            last_validated_at = EXCLUDED.last_validated_at,
            absolute_expires_at = EXCLUDED.absolute_expires_at
      `,
      [
        session.tokenHash,
        instanceId,
        session.createdAt,
        session.expiresAt,
        session.lastValidatedAt,
        session.absoluteExpiresAt,
      ],
    );
  }

  async deleteSession(instanceId: string, tokenHash: string) {
    const sql = getNeonSql();
    await sql.query("DELETE FROM participant_sessions WHERE instance_id = $1 AND token_hash = $2", [
      instanceId,
      tokenHash,
    ]);
  }

  async deleteExpiredSessions(instanceId: string, now: string) {
    const sql = getNeonSql();
    await sql.query(
      `
        DELETE FROM participant_sessions
        WHERE instance_id = $1
          AND (expires_at <= $2::timestamptz OR absolute_expires_at <= $2::timestamptz)
      `,
      [instanceId, now],
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
