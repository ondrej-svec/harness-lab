import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { ParticipantRecord, ParticipantRepository } from "./runtime-contracts";

export type { ParticipantRepository } from "./runtime-contracts";

type StoredParticipants = {
  items: ParticipantRecord[];
};

function normalizeDisplayName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

export class FileParticipantRepository implements ParticipantRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getParticipantsPath(instanceId: string) {
    return path.join(this.dataDir, instanceId, "participants.json");
  }

  private async ensureFile(instanceId: string) {
    const participantsPath = this.getParticipantsPath(instanceId);
    await mkdir(path.dirname(participantsPath), { recursive: true });
    try {
      await readFile(participantsPath, "utf8");
    } catch {
      await writeFile(
        participantsPath,
        JSON.stringify({ items: [] satisfies ParticipantRecord[] }, null, 2),
      );
    }
  }

  private async readAll(instanceId: string): Promise<ParticipantRecord[]> {
    await this.ensureFile(instanceId);
    const raw = await readFile(this.getParticipantsPath(instanceId), "utf8");
    return (JSON.parse(raw) as StoredParticipants).items;
  }

  async listParticipants(instanceId: string, options?: { includeArchived?: boolean }) {
    const items = await this.readAll(instanceId);
    if (options?.includeArchived) {
      return items;
    }
    return items.filter((p) => p.archivedAt === null);
  }

  async findParticipant(instanceId: string, participantId: string) {
    const items = await this.readAll(instanceId);
    return items.find((p) => p.id === participantId) ?? null;
  }

  async findParticipantByDisplayName(instanceId: string, displayName: string) {
    const normalized = normalizeDisplayName(displayName);
    const items = await this.readAll(instanceId);
    return (
      items.find(
        (p) => p.archivedAt === null && normalizeDisplayName(p.displayName) === normalized,
      ) ?? null
    );
  }

  async listByDisplayNamePrefix(instanceId: string, prefix: string, limit: number) {
    const normalized = normalizeDisplayName(prefix);
    if (normalized.length === 0) return [];
    const items = await this.readAll(instanceId);
    return items
      .filter(
        (p) =>
          p.archivedAt === null &&
          normalizeDisplayName(p.displayName).includes(normalized),
      )
      .slice(0, Math.max(0, limit));
  }

  async findByNeonUserId(instanceId: string, neonUserId: string) {
    const items = await this.readAll(instanceId);
    return (
      items.find(
        (p) => p.archivedAt === null && p.neonUserId === neonUserId,
      ) ?? null
    );
  }

  async linkNeonUser(
    instanceId: string,
    participantId: string,
    neonUserId: string,
    updatedAt: string,
  ) {
    const items = await this.readAll(instanceId);
    const existing = items.find((p) => p.id === participantId);
    if (!existing) return;
    const conflict = items.find(
      (p) =>
        p.id !== participantId && p.neonUserId === neonUserId && p.archivedAt === null,
    );
    if (conflict) return;
    const next = items.map((p) =>
      p.id === participantId ? { ...p, neonUserId, updatedAt } : p,
    );
    await this.replaceParticipants(instanceId, next);
  }

  async upsertParticipant(instanceId: string, participant: ParticipantRecord) {
    const items = await this.readAll(instanceId);
    const nextItems = items.some((p) => p.id === participant.id)
      ? items.map((p) => (p.id === participant.id ? participant : p))
      : [...items, participant];
    await this.replaceParticipants(instanceId, nextItems);
  }

  async archiveParticipant(instanceId: string, participantId: string, archivedAt: string) {
    const items = await this.readAll(instanceId);
    const nextItems = items.map((p) =>
      p.id === participantId ? { ...p, archivedAt, updatedAt: archivedAt } : p,
    );
    await this.replaceParticipants(instanceId, nextItems);
  }

  async replaceParticipants(instanceId: string, participants: ParticipantRecord[]) {
    const participantsPath = this.getParticipantsPath(instanceId);
    await mkdir(path.dirname(participantsPath), { recursive: true });
    const tempPath = `${participantsPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ items: participants }, null, 2));
    await rename(tempPath, participantsPath);
  }
}

type ParticipantRow = {
  id: string;
  instance_id: string;
  display_name: string;
  email: string | null;
  email_opt_in: boolean;
  tag: string | null;
  neon_user_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

function rowToRecord(row: ParticipantRow): ParticipantRecord {
  return {
    id: row.id,
    instanceId: row.instance_id,
    displayName: row.display_name,
    email: row.email,
    emailOptIn: row.email_opt_in,
    tag: row.tag,
    neonUserId: row.neon_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export class NeonParticipantRepository implements ParticipantRepository {
  async listParticipants(instanceId: string, options?: { includeArchived?: boolean }) {
    const sql = getNeonSql();
    const query = options?.includeArchived
      ? `
          SELECT id, instance_id, display_name, email, email_opt_in, tag,
                 neon_user_id, created_at, updated_at, archived_at
          FROM participants
          WHERE instance_id = $1
          ORDER BY created_at ASC
        `
      : `
          SELECT id, instance_id, display_name, email, email_opt_in, tag,
                 neon_user_id, created_at, updated_at, archived_at
          FROM participants
          WHERE instance_id = $1 AND archived_at IS NULL
          ORDER BY created_at ASC
        `;

    const rows = (await sql.query(query, [instanceId])) as ParticipantRow[];
    return rows.map(rowToRecord);
  }

  async findParticipant(instanceId: string, participantId: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, instance_id, display_name, email, email_opt_in, tag,
               neon_user_id, created_at, updated_at, archived_at
        FROM participants
        WHERE instance_id = $1 AND id = $2
      `,
      [instanceId, participantId],
    )) as ParticipantRow[];
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  async findParticipantByDisplayName(instanceId: string, displayName: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, instance_id, display_name, email, email_opt_in, tag,
               neon_user_id, created_at, updated_at, archived_at
        FROM participants
        WHERE instance_id = $1
          AND archived_at IS NULL
          AND LOWER(display_name) = LOWER($2)
        LIMIT 1
      `,
      [instanceId, displayName.trim()],
    )) as ParticipantRow[];
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  async listByDisplayNamePrefix(instanceId: string, prefix: string, limit: number) {
    const normalized = prefix.trim().toLocaleLowerCase();
    if (normalized.length === 0) return [];
    const sql = getNeonSql();
    const escaped = normalized.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
    const rows = (await sql.query(
      `
        SELECT id, instance_id, display_name, email, email_opt_in, tag,
               neon_user_id, created_at, updated_at, archived_at
        FROM participants
        WHERE instance_id = $1
          AND archived_at IS NULL
          AND LOWER(display_name) LIKE $2 ESCAPE '\\'
        ORDER BY display_name ASC
        LIMIT $3
      `,
      [instanceId, `%${escaped}%`, Math.max(0, limit)],
    )) as ParticipantRow[];
    return rows.map(rowToRecord);
  }

  async findByNeonUserId(instanceId: string, neonUserId: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, instance_id, display_name, email, email_opt_in, tag,
               neon_user_id, created_at, updated_at, archived_at
        FROM participants
        WHERE instance_id = $1
          AND archived_at IS NULL
          AND neon_user_id = $2
        LIMIT 1
      `,
      [instanceId, neonUserId],
    )) as ParticipantRow[];
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  async linkNeonUser(
    instanceId: string,
    participantId: string,
    neonUserId: string,
    updatedAt: string,
  ) {
    const sql = getNeonSql();
    // Idempotent on the same (participant, neon_user_id) pair. No-op
    // when another participant already owns the neon_user_id — the
    // NOT EXISTS clause filters those out before the UPDATE so the
    // unique index never throws.
    await sql.query(
      `
        UPDATE participants
        SET neon_user_id = $3,
            updated_at = $4
        WHERE instance_id = $1
          AND id = $2
          AND (neon_user_id IS NULL OR neon_user_id = $3)
          AND NOT EXISTS (
            SELECT 1 FROM participants other
            WHERE other.neon_user_id = $3
              AND other.id <> $2
          )
      `,
      [instanceId, participantId, neonUserId, updatedAt],
    );
  }

  async upsertParticipant(instanceId: string, participant: ParticipantRecord) {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO participants
          (id, instance_id, display_name, email, email_opt_in, tag,
           neon_user_id, created_at, updated_at, archived_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            email = EXCLUDED.email,
            email_opt_in = EXCLUDED.email_opt_in,
            tag = EXCLUDED.tag,
            neon_user_id = EXCLUDED.neon_user_id,
            updated_at = EXCLUDED.updated_at,
            archived_at = EXCLUDED.archived_at
      `,
      [
        participant.id,
        instanceId,
        participant.displayName,
        participant.email,
        participant.emailOptIn,
        participant.tag,
        participant.neonUserId,
        participant.createdAt,
        participant.updatedAt,
        participant.archivedAt,
      ],
    );
  }

  async archiveParticipant(instanceId: string, participantId: string, archivedAt: string) {
    const sql = getNeonSql();
    await sql.query(
      `
        UPDATE participants
        SET archived_at = $3,
            updated_at = $3
        WHERE instance_id = $1 AND id = $2
      `,
      [instanceId, participantId, archivedAt],
    );
  }

  async replaceParticipants(instanceId: string, participants: ParticipantRecord[]) {
    const sql = getNeonSql();
    await sql.query("DELETE FROM participants WHERE instance_id = $1", [instanceId]);
    for (const participant of participants) {
      await this.upsertParticipant(instanceId, participant);
    }
  }
}

let overrideRepository: ParticipantRepository | null = null;

export function getParticipantRepository(): ParticipantRepository {
  if (overrideRepository) {
    return overrideRepository;
  }
  return getRuntimeStorageMode() === "neon"
    ? new NeonParticipantRepository()
    : new FileParticipantRepository();
}

export function setParticipantRepositoryForTests(repository: ParticipantRepository | null) {
  overrideRepository = repository;
}
