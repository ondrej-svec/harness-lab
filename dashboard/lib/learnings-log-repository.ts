import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { LearningsLogEntry, LearningsLogRepository } from "./runtime-contracts";

/**
 * FileLearningsLogRepository — append-only JSONL file at the root of
 * the data directory. Lives OUTSIDE any instance directory so entries
 * survive instance teardown. This is the load-bearing detail from the
 * design doc: a learnings log under an instance path would die with
 * the instance and defeat the cross-cohort learning loop.
 */
export class FileLearningsLogRepository implements LearningsLogRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");
  private readonly logPath =
    process.env.HARNESS_LEARNINGS_LOG_PATH ?? path.join(this.dataDir, "learnings-log.jsonl");

  async append(entry: LearningsLogEntry): Promise<void> {
    await mkdir(path.dirname(this.logPath), { recursive: true });
    // Append a single newline-terminated JSON record. JSONL is the right
    // on-disk format here because it is:
    //   1) trivially queryable with jq, Python, or a notebook
    //   2) safe under concurrent appends on POSIX filesystems (append(2)
    //      is atomic for writes smaller than PIPE_BUF, which these are)
    //   3) tolerant of schema drift — each line is independently parseable
    //      and new fields do not break historical readers.
    const line = `${JSON.stringify(entry)}\n`;
    await appendFile(this.logPath, line, "utf8");
  }
}

export class NeonLearningsLogRepository implements LearningsLogRepository {
  async append(entry: LearningsLogEntry): Promise<void> {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO learnings_log (cohort, instance_id, logged_at, signal)
        VALUES ($1, $2, $3::timestamptz, $4::jsonb)
      `,
      [entry.cohort, entry.instanceId, entry.loggedAt, JSON.stringify(entry.signal)],
    );
  }
}

let overrideRepository: LearningsLogRepository | null = null;

export function getLearningsLogRepository(): LearningsLogRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon"
    ? new NeonLearningsLogRepository()
    : new FileLearningsLogRepository();
}

export function setLearningsLogRepositoryForTests(repository: LearningsLogRepository | null) {
  overrideRepository = repository;
}
