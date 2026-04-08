import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { ParticipantEventAccessRecord, ParticipantEventAccessRepository } from "./runtime-contracts";

export type { ParticipantEventAccessRepository };

const sampleEventCode = "lantern8-context4-handoff2";
const eventCodeValidityDays = 14;

function getSeedEventCode() {
  if (getRuntimeStorageMode() === "neon" && !process.env.HARNESS_EVENT_CODE) {
    return null;
  }

  const code = process.env.HARNESS_EVENT_CODE ?? sampleEventCode;
  const expiresAt =
    process.env.HARNESS_EVENT_CODE_EXPIRES_AT ??
    new Date(Date.now() + eventCodeValidityDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    code,
    expiresAt,
    isSample: !process.env.HARNESS_EVENT_CODE,
  };
}

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

type StoredParticipantEventAccess = {
  access: ParticipantEventAccessRecord;
};

export class FileParticipantEventAccessRepository implements ParticipantEventAccessRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getAccessPath(instanceId: string) {
    return path.join(this.dataDir, instanceId, "participant-event-access.json");
  }

  private buildSeedAccess(instanceId: string): ParticipantEventAccessRecord {
    const seed = getSeedEventCode();
    if (!seed) {
      throw new Error("File-mode participant event access requires a seed event code");
    }
    return {
      id: `pea-${instanceId}`,
      instanceId,
      version: 1,
      codeHash: hashSecret(seed.code),
      expiresAt: seed.expiresAt,
      revokedAt: null,
      sampleCode: seed.isSample ? seed.code : null,
    };
  }

  private async ensureFile(instanceId: string) {
    const accessPath = this.getAccessPath(instanceId);
    await mkdir(path.dirname(accessPath), { recursive: true });
    try {
      await readFile(accessPath, "utf8");
    } catch {
      await writeFile(accessPath, JSON.stringify({ access: this.buildSeedAccess(instanceId) }, null, 2));
    }
  }

  async getActiveAccess(instanceId: string) {
    const accessPath = this.getAccessPath(instanceId);
    await this.ensureFile(instanceId);
    const raw = await readFile(accessPath, "utf8");
    const parsed = JSON.parse(raw) as StoredParticipantEventAccess;
    return parsed.access.revokedAt ? null : parsed.access;
  }

  async saveAccess(instanceId: string, access: ParticipantEventAccessRecord) {
    const accessPath = this.getAccessPath(instanceId);
    await mkdir(path.dirname(accessPath), { recursive: true });
    const tempPath = `${accessPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ access }, null, 2));
    await rename(tempPath, accessPath);
  }
}

export class NeonParticipantEventAccessRepository implements ParticipantEventAccessRepository {
  private async ensureSeedAccess(instanceId: string) {
    const sql = getNeonSql();
    const existing = (await sql.query(
      "SELECT id FROM participant_event_access WHERE instance_id = $1 AND revoked_at IS NULL ORDER BY version DESC LIMIT 1",
      [instanceId],
    )) as { id: string }[];

    if (existing.length > 0) {
      return;
    }

    const seed = getSeedEventCode();
    if (!seed) {
      return;
    }
    await sql.query(
      `
        INSERT INTO participant_event_access (id, instance_id, version, code_hash, expires_at, revoked_at)
        VALUES ($1, $2, $3, $4, $5::timestamptz, $6)
      `,
      [`pea-${instanceId}`, instanceId, 1, hashSecret(seed.code), seed.expiresAt, null],
    );
  }

  async getActiveAccess(instanceId: string) {
    const sql = getNeonSql();
    await this.ensureSeedAccess(instanceId);
    const rows = (await sql.query(
      `
        SELECT id, instance_id, version, code_hash, expires_at, revoked_at
        FROM participant_event_access
        WHERE instance_id = $1 AND revoked_at IS NULL
        ORDER BY version DESC
        LIMIT 1
      `,
      [instanceId],
    )) as {
      id: string;
      instance_id: string;
      version: number;
      code_hash: string;
      expires_at: string;
      revoked_at: string | null;
    }[];

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      instanceId: row.instance_id,
      version: row.version,
      codeHash: row.code_hash,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      sampleCode: null,
    };
  }

  async saveAccess(_instanceId: string, access: ParticipantEventAccessRecord) {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO participant_event_access (id, instance_id, version, code_hash, expires_at, revoked_at)
        VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz)
        ON CONFLICT (id) DO UPDATE
        SET version = EXCLUDED.version,
            code_hash = EXCLUDED.code_hash,
            expires_at = EXCLUDED.expires_at,
            revoked_at = EXCLUDED.revoked_at
      `,
      [access.id, access.instanceId, access.version, access.codeHash, access.expiresAt, access.revokedAt],
    );
  }
}

export function getParticipantEventAccessRepository(): ParticipantEventAccessRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon"
    ? new NeonParticipantEventAccessRepository()
    : new FileParticipantEventAccessRepository();
}

let overrideRepository: ParticipantEventAccessRepository | null = null;

export function setParticipantEventAccessRepositoryForTests(repository: ParticipantEventAccessRepository | null) {
  overrideRepository = repository;
}

export async function getEventAccessPreview(instanceId = getCurrentWorkshopInstanceId()) {
  const access = await getParticipantEventAccessRepository().getActiveAccess(instanceId);
  if (!access) {
    return null;
  }

  return {
    expiresAt: access.expiresAt,
    sampleCode: access.sampleCode ?? "",
    isSample: Boolean(access.sampleCode),
    codeId: access.codeHash.slice(0, 12),
  };
}
