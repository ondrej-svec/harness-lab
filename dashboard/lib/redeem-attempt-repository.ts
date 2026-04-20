import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { RedeemAttemptRecord, RedeemAttemptRepository } from "./runtime-contracts";

export type { RedeemAttemptRepository } from "./runtime-contracts";

type StoredRedeemAttempts = {
  items: RedeemAttemptRecord[];
};

// File-mode storage uses a single global bucket because the file
// repository predates multi-instance deployments; Neon mode stores the
// same way — fingerprint-scoped only.
const FILE_MODE_BUCKET = "__redeem__";

export class FileRedeemAttemptRepository implements RedeemAttemptRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getAttemptsPath() {
    return path.join(this.dataDir, FILE_MODE_BUCKET, "participant-redeem-attempts.json");
  }

  private async ensureFile() {
    const attemptsPath = this.getAttemptsPath();
    await mkdir(path.dirname(attemptsPath), { recursive: true });
    try {
      await readFile(attemptsPath, "utf8");
    } catch {
      await writeFile(attemptsPath, JSON.stringify({ items: [] satisfies RedeemAttemptRecord[] }, null, 2));
    }
  }

  private async listAttempts() {
    const attemptsPath = this.getAttemptsPath();
    await this.ensureFile();
    const raw = await readFile(attemptsPath, "utf8");
    return (JSON.parse(raw) as StoredRedeemAttempts).items;
  }

  private async writeAttempts(attempts: RedeemAttemptRecord[]) {
    const attemptsPath = this.getAttemptsPath();
    await mkdir(path.dirname(attemptsPath), { recursive: true });
    const tempPath = `${attemptsPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ items: attempts }, null, 2));
    await rename(tempPath, attemptsPath);
  }

  async countRecentFailures(fingerprint: string, since: string) {
    const sinceMs = Date.parse(since);
    const attempts = await this.listAttempts();
    return attempts.filter(
      (attempt) =>
        attempt.fingerprint === fingerprint &&
        attempt.result === "failure" &&
        Date.parse(attempt.createdAt) >= sinceMs,
    ).length;
  }

  async appendAttempt(attempt: RedeemAttemptRecord) {
    const attempts = await this.listAttempts();
    await this.writeAttempts([...attempts, attempt].slice(-200));

    // Also delete any legacy per-instance attempt files left from the
    // pre-cleanup schema — harmless if already gone.
    try {
      const dirs = await readdir(this.dataDir);
      for (const dir of dirs) {
        if (dir === FILE_MODE_BUCKET) continue;
        // Legacy buckets stayed named by instanceId; we no longer write to
        // them but also don't read from them. Intentionally no cleanup.
      }
    } catch {
      // dataDir may not exist — ensure already handled it
    }
  }

  async deleteOlderThan(olderThan: string) {
    const olderThanMs = Date.parse(olderThan);
    const attempts = await this.listAttempts();
    await this.writeAttempts(attempts.filter((attempt) => Date.parse(attempt.createdAt) >= olderThanMs));
  }
}

export class NeonRedeemAttemptRepository implements RedeemAttemptRepository {
  async countRecentFailures(fingerprint: string, since: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT COUNT(*)::int AS count
        FROM participant_redeem_attempts
        WHERE fingerprint = $1
          AND result = 'failure'
          AND created_at >= $2::timestamptz
      `,
      [fingerprint, since],
    )) as { count: number }[];

    return rows[0]?.count ?? 0;
  }

  async appendAttempt(attempt: RedeemAttemptRecord) {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO participant_redeem_attempts (id, instance_id, fingerprint, result, created_at)
        VALUES ($1, $2, $3, $4, $5::timestamptz)
      `,
      [`redeem-attempt-${randomUUID()}`, attempt.instanceId, attempt.fingerprint, attempt.result, attempt.createdAt],
    );
  }

  async deleteOlderThan(olderThan: string) {
    const sql = getNeonSql();
    await sql.query(
      `
        DELETE FROM participant_redeem_attempts
        WHERE created_at < $1::timestamptz
      `,
      [olderThan],
    );
  }
}

export function getRedeemAttemptRepository(): RedeemAttemptRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon" ? new NeonRedeemAttemptRepository() : new FileRedeemAttemptRepository();
}

let overrideRepository: RedeemAttemptRepository | null = null;

export function setRedeemAttemptRepositoryForTests(repository: RedeemAttemptRepository | null) {
  overrideRepository = repository;
}
