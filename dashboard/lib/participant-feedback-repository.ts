import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import { assertSafeInstanceId } from "./safe-instance-id";
import type {
  ParticipantFeedbackRecord,
  ParticipantFeedbackRepository,
  WorkshopInstanceId,
} from "./runtime-contracts";

type StoredParticipantFeedback = {
  version: 1;
  feedback: ParticipantFeedbackRecord[];
};

function createEmptyStore(): StoredParticipantFeedback {
  return { version: 1, feedback: [] };
}

export class FileParticipantFeedbackRepository implements ParticipantFeedbackRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getPath(instanceId: WorkshopInstanceId) {
    assertSafeInstanceId(instanceId);
    return path.join(this.dataDir, instanceId, "participant-feedback.json");
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

  async list(instanceId: WorkshopInstanceId): Promise<ParticipantFeedbackRecord[]> {
    await this.ensureFile(instanceId);
    const raw = await readFile(this.getPath(instanceId), "utf8");
    const parsed = JSON.parse(raw) as StoredParticipantFeedback;
    const feedback = Array.isArray(parsed.feedback) ? parsed.feedback : [];
    return feedback.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async append(instanceId: WorkshopInstanceId, feedback: ParticipantFeedbackRecord): Promise<void> {
    await this.ensureFile(instanceId);
    const filePath = this.getPath(instanceId);
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredParticipantFeedback;
    const items = Array.isArray(parsed.feedback) ? parsed.feedback : [];
    const tempPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, `${JSON.stringify({ version: 1, feedback: [feedback, ...items] }, null, 2)}\n`);
    await rename(tempPath, filePath);
  }

  async markPromoted(
    instanceId: WorkshopInstanceId,
    feedbackId: string,
    promotion: { promotedToTickerAt: string; promotedTickerId: string },
  ): Promise<void> {
    await this.ensureFile(instanceId);
    const filePath = this.getPath(instanceId);
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredParticipantFeedback;
    const items = Array.isArray(parsed.feedback) ? parsed.feedback : [];
    const tempPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(
      tempPath,
      `${JSON.stringify({
        version: 1,
        feedback: items.map((item) =>
          item.id === feedbackId
            ? {
                ...item,
                promotedToTickerAt: promotion.promotedToTickerAt,
                promotedTickerId: promotion.promotedTickerId,
              }
            : item,
        ),
      }, null, 2)}\n`,
    );
    await rename(tempPath, filePath);
  }
}

export class NeonParticipantFeedbackRepository implements ParticipantFeedbackRepository {
  async list(instanceId: WorkshopInstanceId): Promise<ParticipantFeedbackRecord[]> {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, instance_id, agenda_item_id, participant_moment_id, participant_id, session_key, team_id,
               kind, message, created_at, promoted_to_ticker_at, promoted_ticker_id
        FROM participant_feedback
        WHERE instance_id = $1
        ORDER BY created_at DESC
      `,
      [instanceId],
    )) as Array<{
      id: string;
      instance_id: string;
      agenda_item_id: string | null;
      participant_moment_id: string | null;
      participant_id: string | null;
      session_key: string;
      team_id: string | null;
      kind: ParticipantFeedbackRecord["kind"];
      message: string;
      created_at: string;
      promoted_to_ticker_at: string | null;
      promoted_ticker_id: string | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      instanceId: row.instance_id,
      agendaItemId: row.agenda_item_id,
      participantMomentId: row.participant_moment_id,
      participantId: row.participant_id,
      sessionKey: row.session_key,
      teamId: row.team_id,
      kind: row.kind,
      message: row.message,
      createdAt: row.created_at,
      promotedToTickerAt: row.promoted_to_ticker_at,
      promotedTickerId: row.promoted_ticker_id,
    }));
  }

  async append(instanceId: WorkshopInstanceId, feedback: ParticipantFeedbackRecord): Promise<void> {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO participant_feedback
          (id, instance_id, agenda_item_id, participant_moment_id, participant_id, session_key, team_id,
           kind, message, created_at, promoted_to_ticker_at, promoted_ticker_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz, $11::timestamptz, $12)
      `,
      [
        feedback.id,
        instanceId,
        feedback.agendaItemId,
        feedback.participantMomentId,
        feedback.participantId,
        feedback.sessionKey,
        feedback.teamId,
        feedback.kind,
        feedback.message,
        feedback.createdAt,
        feedback.promotedToTickerAt,
        feedback.promotedTickerId,
      ],
    );
  }

  async markPromoted(
    instanceId: WorkshopInstanceId,
    feedbackId: string,
    promotion: { promotedToTickerAt: string; promotedTickerId: string },
  ): Promise<void> {
    const sql = getNeonSql();
    await sql.query(
      `
        UPDATE participant_feedback
        SET promoted_to_ticker_at = $1::timestamptz,
            promoted_ticker_id = $2
        WHERE instance_id = $3
          AND id = $4
      `,
      [promotion.promotedToTickerAt, promotion.promotedTickerId, instanceId, feedbackId],
    );
  }
}

let overrideRepository: ParticipantFeedbackRepository | null = null;

export function getParticipantFeedbackRepository(): ParticipantFeedbackRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon"
    ? new NeonParticipantFeedbackRepository()
    : new FileParticipantFeedbackRepository();
}

export function setParticipantFeedbackRepositoryForTests(repository: ParticipantFeedbackRepository | null) {
  overrideRepository = repository;
}
