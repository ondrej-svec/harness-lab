import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import { assertSafeInstanceId } from "./safe-instance-id";
import {
  FeedbackSubmissionLockedError,
  type FeedbackAnswer,
  type FeedbackSubmissionRecord,
  type FeedbackSubmissionRepository,
  type WorkshopInstanceId,
} from "./runtime-contracts";

type StoredFeedbackSubmissions = {
  version: 1;
  submissions: FeedbackSubmissionRecord[];
};

function createEmptyStore(): StoredFeedbackSubmissions {
  return { version: 1, submissions: [] };
}

/**
 * Neon's TIMESTAMPTZ columns come back as JS `Date` objects (not ISO
 * strings) through @neondatabase/serverless. Our contract declares
 * `submittedAt: string` and downstream code (localeCompare sort in
 * feedback-summary, e.g.) assumes a string. Coerce at the mapper so
 * the contract holds end-to-end regardless of driver behaviour.
 */
function normalizeTimestamp(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof (value as { toISOString?: () => string }).toISOString === "function") {
    return (value as { toISOString: () => string }).toISOString();
  }
  return String(value);
}

function isWithinLockWindow(submittedAt: string, allowEditWithinHours: number, nowIso: string): boolean {
  // allowEditWithinHours = 0 always locks (no edit window). Otherwise the
  // window is strictly less than N hours since first submit. Strict `<`
  // so simultaneous writes at the exact same ms still count as "open"
  // for typical positive windows but zero-hour windows are never open.
  if (allowEditWithinHours <= 0) {
    return false;
  }
  const submittedMs = Date.parse(submittedAt);
  const nowMs = Date.parse(nowIso);
  if (Number.isNaN(submittedMs) || Number.isNaN(nowMs)) {
    return false;
  }
  return nowMs - submittedMs < allowEditWithinHours * 60 * 60 * 1000;
}

export class FileFeedbackSubmissionRepository implements FeedbackSubmissionRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getPath(instanceId: WorkshopInstanceId) {
    assertSafeInstanceId(instanceId);
    return path.join(this.dataDir, instanceId, "feedback-submissions.json");
  }

  private async ensureFile(instanceId: WorkshopInstanceId) {
    const filePath = this.getPath(instanceId);
    await mkdir(path.dirname(filePath), { recursive: true });
    try {
      await readFile(filePath, "utf8");
    } catch {
      await writeFile(filePath, `${JSON.stringify(createEmptyStore(), null, 2)}\n`);
    }
  }

  async list(instanceId: WorkshopInstanceId): Promise<FeedbackSubmissionRecord[]> {
    await this.ensureFile(instanceId);
    const raw = await readFile(this.getPath(instanceId), "utf8");
    const parsed = JSON.parse(raw) as StoredFeedbackSubmissions;
    const submissions = Array.isArray(parsed.submissions) ? parsed.submissions : [];
    return submissions
      .slice()
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
  }

  async findBySessionKey(
    instanceId: WorkshopInstanceId,
    sessionKey: string,
  ): Promise<FeedbackSubmissionRecord | null> {
    const submissions = await this.list(instanceId);
    return submissions.find((item) => item.sessionKey === sessionKey) ?? null;
  }

  async upsert(
    instanceId: WorkshopInstanceId,
    submission: FeedbackSubmissionRecord,
    options: { allowEditWithinHours: number },
  ): Promise<FeedbackSubmissionRecord> {
    await this.ensureFile(instanceId);
    const filePath = this.getPath(instanceId);
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredFeedbackSubmissions;
    const submissions = Array.isArray(parsed.submissions) ? parsed.submissions : [];
    const existing = submissions.find((item) => item.sessionKey === submission.sessionKey);
    const nowIso = new Date().toISOString();

    if (existing && !isWithinLockWindow(existing.submittedAt, options.allowEditWithinHours, nowIso)) {
      throw new FeedbackSubmissionLockedError(submission.sessionKey, existing.submittedAt);
    }

    const nextRecord: FeedbackSubmissionRecord = {
      ...submission,
      id: existing?.id ?? submission.id,
      instanceId,
      submittedAt: nowIso,
    };
    const nextSubmissions = existing
      ? submissions.map((item) =>
          item.sessionKey === submission.sessionKey ? nextRecord : item,
        )
      : [...submissions, nextRecord];

    const tempPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(
      tempPath,
      `${JSON.stringify({ version: 1, submissions: nextSubmissions }, null, 2)}\n`,
    );
    await rename(tempPath, filePath);

    return nextRecord;
  }
}

export class NeonFeedbackSubmissionRepository implements FeedbackSubmissionRepository {
  async list(instanceId: WorkshopInstanceId): Promise<FeedbackSubmissionRecord[]> {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, instance_id, participant_id, session_key, answers, submitted_at
        FROM workshop_feedback_submissions
        WHERE instance_id = $1
        ORDER BY submitted_at DESC
      `,
      [instanceId],
    )) as Array<{
      id: string;
      instance_id: string;
      participant_id: string | null;
      session_key: string;
      answers: FeedbackAnswer[];
      submitted_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      instanceId: row.instance_id,
      participantId: row.participant_id,
      sessionKey: row.session_key,
      answers: row.answers,
      submittedAt: normalizeTimestamp(row.submitted_at),
    }));
  }

  async findBySessionKey(
    instanceId: WorkshopInstanceId,
    sessionKey: string,
  ): Promise<FeedbackSubmissionRecord | null> {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, instance_id, participant_id, session_key, answers, submitted_at
        FROM workshop_feedback_submissions
        WHERE instance_id = $1 AND session_key = $2
        LIMIT 1
      `,
      [instanceId, sessionKey],
    )) as Array<{
      id: string;
      instance_id: string;
      participant_id: string | null;
      session_key: string;
      answers: FeedbackAnswer[];
      submitted_at: string;
    }>;

    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      instanceId: row.instance_id,
      participantId: row.participant_id,
      sessionKey: row.session_key,
      answers: row.answers,
      submittedAt: normalizeTimestamp(row.submitted_at),
    };
  }

  async upsert(
    instanceId: WorkshopInstanceId,
    submission: FeedbackSubmissionRecord,
    options: { allowEditWithinHours: number },
  ): Promise<FeedbackSubmissionRecord> {
    const sql = getNeonSql();
    // Read-modify-write so the lock-window decision happens against the
    // persisted submitted_at. A race (two tabs submit simultaneously) is
    // acceptable — the unique index guarantees one row and ON CONFLICT
    // handles the collision; the later write wins inside the window.
    const existing = await this.findBySessionKey(instanceId, submission.sessionKey);
    const nowIso = new Date().toISOString();

    if (existing && !isWithinLockWindow(existing.submittedAt, options.allowEditWithinHours, nowIso)) {
      throw new FeedbackSubmissionLockedError(submission.sessionKey, existing.submittedAt);
    }

    const id = existing?.id ?? submission.id;
    await sql.query(
      `
        INSERT INTO workshop_feedback_submissions
          (id, instance_id, participant_id, session_key, answers, submitted_at)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6::timestamptz)
        ON CONFLICT (instance_id, session_key) DO UPDATE SET
          participant_id = EXCLUDED.participant_id,
          answers = EXCLUDED.answers,
          submitted_at = EXCLUDED.submitted_at
      `,
      [
        id,
        instanceId,
        submission.participantId,
        submission.sessionKey,
        JSON.stringify(submission.answers),
        nowIso,
      ],
    );

    return {
      ...submission,
      id,
      instanceId,
      submittedAt: nowIso,
    };
  }
}

let overrideRepository: FeedbackSubmissionRepository | null = null;

export function getFeedbackSubmissionRepository(): FeedbackSubmissionRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon"
    ? new NeonFeedbackSubmissionRepository()
    : new FileFeedbackSubmissionRepository();
}

export function setFeedbackSubmissionRepositoryForTests(repository: FeedbackSubmissionRepository | null) {
  overrideRepository = repository;
}
