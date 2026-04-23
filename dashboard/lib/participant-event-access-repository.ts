import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { createHash, createHmac, randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import {
  encryptEventCodeForReveal,
  isEventCodeRevealConfigured,
} from "./event-code-reveal-crypto";
import { isNeonRuntimeMode } from "./runtime-auth-configuration";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { ParticipantEventAccessRecord, ParticipantEventAccessRepository } from "./runtime-contracts";

export type { ParticipantEventAccessRepository };

const sampleEventCode = "lantern8-context4-handoff2";
export const participantEventCodeValidityDays = 14;

const devEventCodeKey = "harness-dev-event-code-key-not-for-production-use-only-local";
const minEventCodeKeyLength = 32;
let warnedAboutDevEventCodeKey = false;

function resolveEventCodeKey(): string {
  const key = process.env.HARNESS_EVENT_CODE_SECRET;
  if (key && key.length >= minEventCodeKeyLength) {
    return key;
  }
  if (isNeonRuntimeMode()) {
    throw new Error(
      `HARNESS_EVENT_CODE_SECRET must be set and at least ${minEventCodeKeyLength} characters when HARNESS_STORAGE_MODE=neon`,
    );
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `HARNESS_EVENT_CODE_SECRET must be set and at least ${minEventCodeKeyLength} characters in production`,
    );
  }
  if (!warnedAboutDevEventCodeKey) {
    warnedAboutDevEventCodeKey = true;
    console.warn(
      "HARNESS_EVENT_CODE_SECRET not set — using insecure dev fallback. Not safe outside local file-mode.",
    );
  }
  return devEventCodeKey;
}

export function getConfiguredSeedEventCode() {
  if (getRuntimeStorageMode() === "neon" && !process.env.HARNESS_EVENT_CODE) {
    return null;
  }

  const code = process.env.HARNESS_EVENT_CODE ?? sampleEventCode;
  const expiresAt =
    process.env.HARNESS_EVENT_CODE_EXPIRES_AT ??
    new Date(Date.now() + participantEventCodeValidityDays * 24 * 60 * 60 * 1000).toISOString();

  return {
    code,
    expiresAt,
    isSample: !process.env.HARNESS_EVENT_CODE,
  };
}

/**
 * Session-token hash. Tokens are already 128-bit CSPRNG UUIDs, so plain
 * SHA-256 is enough and rainbow tables don't help. Kept as-is to preserve
 * live session cookies across the HMAC migration.
 */
export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Event-code hash. Event codes are three-word human-memorable strings
 * with a small keyspace — plain SHA-256 is rainbow-table-attackable if
 * the access table ever leaks. HMAC with a server-side key fixes this.
 * `keyOverride` exists for tests; production always reads the env var.
 */
export function hashEventCode(value: string, options: { keyOverride?: string } = {}) {
  const key = options.keyOverride ?? resolveEventCodeKey();
  return createHmac("sha256", key).update(value).digest("hex");
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
    const seed = getConfiguredSeedEventCode();
    if (!seed) {
      throw new Error("File-mode participant event access requires a seed event code");
    }
    return {
      id: `pea-${instanceId}`,
      instanceId,
      version: 1,
      codeHash: hashEventCode(seed.code),
      codeCiphertext: isEventCodeRevealConfigured() ? encryptEventCodeForReveal(seed.code) : null,
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

  async listAllActiveAccess() {
    const results: ParticipantEventAccessRecord[] = [];
    let entries: string[];
    try {
      entries = await readdir(this.dataDir);
    } catch {
      return results;
    }

    for (const entry of entries) {
      try {
        const accessPath = this.getAccessPath(entry);
        const raw = await readFile(accessPath, "utf8");
        const parsed = JSON.parse(raw) as StoredParticipantEventAccess;
        if (!parsed.access.revokedAt) {
          results.push(parsed.access);
        }
      } catch {
        // No access file for this instance — skip
      }
    }
    return results;
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

    const seed = getConfiguredSeedEventCode();
    if (!seed) {
      return;
    }

    // Use a random UUID for the row id — the seed id `pea-${instanceId}`
    // may already exist as a revoked row from a prior rotation, which
    // would primary-key-collide this INSERT and crash the admin page.
    // ON CONFLICT DO NOTHING is a belt for the (id) race; the random
    // suffix is the suspenders.
    await sql.query(
      `
        INSERT INTO participant_event_access (id, instance_id, version, code_hash, code_ciphertext, expires_at, revoked_at)
        VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        `pea-${instanceId}-${randomUUID()}`,
        instanceId,
        1,
        hashEventCode(seed.code),
        isEventCodeRevealConfigured() ? encryptEventCodeForReveal(seed.code) : null,
        seed.expiresAt,
        null,
      ],
    );
  }

  async getActiveAccess(instanceId: string) {
    const sql = getNeonSql();
    await this.ensureSeedAccess(instanceId);
    const rows = (await sql.query(
      `
        SELECT id, instance_id, version, code_hash, code_ciphertext, expires_at, revoked_at
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
      code_ciphertext: string | null;
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
      codeCiphertext: row.code_ciphertext,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      sampleCode: null,
    };
  }

  async listAllActiveAccess() {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT DISTINCT ON (instance_id) id, instance_id, version, code_hash, code_ciphertext, expires_at, revoked_at
        FROM participant_event_access
        WHERE revoked_at IS NULL AND expires_at > NOW()
        ORDER BY instance_id, version DESC
      `,
    )) as {
      id: string;
      instance_id: string;
      version: number;
      code_hash: string;
      code_ciphertext: string | null;
      expires_at: string;
      revoked_at: string | null;
    }[];

    return rows.map((row) => ({
      id: row.id,
      instanceId: row.instance_id,
      version: row.version,
      codeHash: row.code_hash,
      codeCiphertext: row.code_ciphertext,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      sampleCode: null,
    }));
  }

  async saveAccess(_instanceId: string, access: ParticipantEventAccessRecord) {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO participant_event_access (id, instance_id, version, code_hash, code_ciphertext, expires_at, revoked_at)
        VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz)
        ON CONFLICT (id) DO UPDATE
        SET version = EXCLUDED.version,
            code_hash = EXCLUDED.code_hash,
            code_ciphertext = EXCLUDED.code_ciphertext,
            expires_at = EXCLUDED.expires_at,
            revoked_at = EXCLUDED.revoked_at
      `,
      [
        access.id,
        access.instanceId,
        access.version,
        access.codeHash,
        access.codeCiphertext ?? null,
        access.expiresAt,
        access.revokedAt,
      ],
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

export async function getEventAccessPreview(instanceId: string) {
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
