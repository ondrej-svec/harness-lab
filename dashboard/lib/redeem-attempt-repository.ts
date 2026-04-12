import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { RedeemAttemptRecord, RedeemAttemptRepository } from "./runtime-contracts";

export type { RedeemAttemptRepository } from "./runtime-contracts";

type StoredRedeemAttempts = {
  items: RedeemAttemptRecord[];
};

export class FileRedeemAttemptRepository implements RedeemAttemptRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getAttemptsPath(instanceId: string) {
    return path.join(this.dataDir, instanceId, "participant-redeem-attempts.json");
  }

  private async ensureFile(instanceId: string) {
    const attemptsPath = this.getAttemptsPath(instanceId);
    await mkdir(path.dirname(attemptsPath), { recursive: true });
    try {
      await readFile(attemptsPath, "utf8");
    } catch {
      await writeFile(attemptsPath, JSON.stringify({ items: [] satisfies RedeemAttemptRecord[] }, null, 2));
    }
  }

  private async listAttempts(instanceId: string) {
    const attemptsPath = this.getAttemptsPath(instanceId);
    await this.ensureFile(instanceId);
    const raw = await readFile(attemptsPath, "utf8");
    return (JSON.parse(raw) as StoredRedeemAttempts).items;
  }

  private async writeAttempts(instanceId: string, attempts: RedeemAttemptRecord[]) {
    const attemptsPath = this.getAttemptsPath(instanceId);
    await mkdir(path.dirname(attemptsPath), { recursive: true });
    const tempPath = `${attemptsPath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, JSON.stringify({ items: attempts }, null, 2));
    await rename(tempPath, attemptsPath);
  }

  async countRecentFailures(instanceId: string, fingerprint: string, since: string) {
    const sinceMs = Date.parse(since);
    const attempts = await this.listAttempts(instanceId);
    return attempts.filter(
      (attempt) =>
        attempt.fingerprint === fingerprint &&
        attempt.result === "failure" &&
        Date.parse(attempt.createdAt) >= sinceMs,
    ).length;
  }

  async appendAttempt(attempt: RedeemAttemptRecord) {
    const attempts = await this.listAttempts(attempt.instanceId);
    await this.writeAttempts(attempt.instanceId, [...attempts, attempt].slice(-200));
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    const olderThanMs = Date.parse(olderThan);
    const attempts = await this.listAttempts(instanceId);
    await this.writeAttempts(
      instanceId,
      attempts.filter((attempt) => Date.parse(attempt.createdAt) >= olderThanMs),
    );
  }
}

export class NeonRedeemAttemptRepository implements RedeemAttemptRepository {
  async countRecentFailures(instanceId: string, fingerprint: string, since: string) {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT COUNT(*)::int AS count
        FROM participant_redeem_attempts
        WHERE instance_id = $1
          AND fingerprint = $2
          AND result = 'failure'
          AND created_at >= $3::timestamptz
      `,
      [instanceId, fingerprint, since],
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

  async deleteOlderThan(instanceId: string, olderThan: string) {
    const sql = getNeonSql();
    await sql.query(
      `
        DELETE FROM participant_redeem_attempts
        WHERE instance_id = $1
          AND created_at < $2::timestamptz
      `,
      [instanceId, olderThan],
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
