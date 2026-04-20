import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";
import { assertSafeInstanceId } from "./safe-instance-id";
import type { PollResponseRecord, PollResponseRepository, WorkshopInstanceId } from "./runtime-contracts";

type StoredPollResponses = {
  version: 1;
  responses: PollResponseRecord[];
};

function createEmptyStore(): StoredPollResponses {
  return { version: 1, responses: [] };
}

export class FilePollResponseRepository implements PollResponseRepository {
  private readonly dataDir = process.env.HARNESS_DATA_DIR ?? path.join(process.cwd(), "data");

  private getPath(instanceId: WorkshopInstanceId) {
    assertSafeInstanceId(instanceId);
    return path.join(this.dataDir, instanceId, "poll-responses.json");
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

  async list(instanceId: WorkshopInstanceId, pollId?: string): Promise<PollResponseRecord[]> {
    await this.ensureFile(instanceId);
    const raw = await readFile(this.getPath(instanceId), "utf8");
    const parsed = JSON.parse(raw) as StoredPollResponses;
    const responses = Array.isArray(parsed.responses) ? parsed.responses : [];
    return responses
      .filter((response) => !pollId || response.pollId === pollId)
      .sort((left, right) => left.submittedAt.localeCompare(right.submittedAt));
  }

  async upsert(instanceId: WorkshopInstanceId, response: PollResponseRecord): Promise<void> {
    await this.ensureFile(instanceId);
    const filePath = this.getPath(instanceId);
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredPollResponses;
    const responses = Array.isArray(parsed.responses) ? parsed.responses : [];
    const nextResponses = responses.some(
      (item) => item.pollId === response.pollId && item.sessionKey === response.sessionKey,
    )
      ? responses.map((item) =>
          item.pollId === response.pollId && item.sessionKey === response.sessionKey ? response : item,
        )
      : [...responses, response];
    const tempPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(tempPath, `${JSON.stringify({ version: 1, responses: nextResponses }, null, 2)}\n`);
    await rename(tempPath, filePath);
  }

  async deletePoll(instanceId: WorkshopInstanceId, pollId: string): Promise<void> {
    await this.ensureFile(instanceId);
    const filePath = this.getPath(instanceId);
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredPollResponses;
    const responses = Array.isArray(parsed.responses) ? parsed.responses : [];
    const tempPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(
      tempPath,
      `${JSON.stringify({ version: 1, responses: responses.filter((item) => item.pollId !== pollId) }, null, 2)}\n`,
    );
    await rename(tempPath, filePath);
  }
}

export class NeonPollResponseRepository implements PollResponseRepository {
  async list(instanceId: WorkshopInstanceId, pollId?: string): Promise<PollResponseRecord[]> {
    const sql = getNeonSql();
    const rows = (await sql.query(
      `
        SELECT id, instance_id, poll_id, participant_id, session_key, team_id, option_id, submitted_at
        FROM participant_poll_responses
        WHERE instance_id = $1
          AND ($2::text IS NULL OR poll_id = $2)
        ORDER BY submitted_at ASC
      `,
      [instanceId, pollId ?? null],
    )) as Array<{
      id: string;
      instance_id: string;
      poll_id: string;
      participant_id: string | null;
      session_key: string;
      team_id: string | null;
      option_id: string;
      submitted_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      instanceId: row.instance_id,
      pollId: row.poll_id,
      participantId: row.participant_id,
      sessionKey: row.session_key,
      teamId: row.team_id,
      optionId: row.option_id,
      submittedAt: row.submitted_at,
    }));
  }

  async upsert(instanceId: WorkshopInstanceId, response: PollResponseRecord): Promise<void> {
    const sql = getNeonSql();
    await sql.query(
      `
        INSERT INTO participant_poll_responses
          (id, instance_id, poll_id, participant_id, session_key, team_id, option_id, submitted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz)
        ON CONFLICT (instance_id, poll_id, session_key)
        DO UPDATE SET
          participant_id = EXCLUDED.participant_id,
          team_id = EXCLUDED.team_id,
          option_id = EXCLUDED.option_id,
          submitted_at = EXCLUDED.submitted_at
      `,
      [
        response.id,
        instanceId,
        response.pollId,
        response.participantId,
        response.sessionKey,
        response.teamId,
        response.optionId,
        response.submittedAt,
      ],
    );
  }

  async deletePoll(instanceId: WorkshopInstanceId, pollId: string): Promise<void> {
    const sql = getNeonSql();
    await sql.query(
      `DELETE FROM participant_poll_responses WHERE instance_id = $1 AND poll_id = $2`,
      [instanceId, pollId],
    );
  }
}

let overrideRepository: PollResponseRepository | null = null;

export function getPollResponseRepository(): PollResponseRepository {
  if (overrideRepository) {
    return overrideRepository;
  }

  return getRuntimeStorageMode() === "neon"
    ? new NeonPollResponseRepository()
    : new FilePollResponseRepository();
}

export function setPollResponseRepositoryForTests(repository: PollResponseRepository | null) {
  overrideRepository = repository;
}
