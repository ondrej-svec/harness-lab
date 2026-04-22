import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";

/**
 * GDPR Art. 20 (right to data portability) export for a single participant.
 *
 * Returns every row in Neon that links the participant — directly via
 * `participant_id` FK, or indirectly (audit log entries that mention
 * the participant in metadata). The caller is responsible for:
 *
 *   - facilitator-grant gating (`requireFacilitatorRequest`)
 *   - `Content-Disposition: attachment; filename=...` on the response
 *   - audit-log entry for the export action itself
 *
 * File-mode is not supported — workshop data in file mode lives in
 * committed JSON fixtures, not in a privacy-relevant runtime.
 */

export type ParticipantExportPayload = {
  exportedAt: string;
  participantId: string;
  instanceId: string;
  participant: Record<string, unknown> | null;
  teamMemberships: Record<string, unknown>[];
  participantSessions: Record<string, unknown>[];
  teamCompositionHistory: Record<string, unknown>[];
  participantFeedback: Record<string, unknown>[];
  participantPollResponses: Record<string, unknown>[];
  checkpoints: Record<string, unknown>[];
  workshopFeedbackSubmissions: Record<string, unknown>[];
  auditLogEntries: Record<string, unknown>[];
};

export async function exportParticipantData(
  participantId: string,
  instanceId: string,
): Promise<ParticipantExportPayload> {
  if (getRuntimeStorageMode() !== "neon") {
    throw new Error("exportParticipantData requires HARNESS_STORAGE_MODE=neon");
  }

  const sql = getNeonSql();
  const exportedAt = new Date().toISOString();

  const [
    participantRows,
    teamMemberships,
    participantSessions,
    teamCompositionHistory,
    participantFeedback,
    participantPollResponses,
    checkpoints,
    workshopFeedbackSubmissions,
    auditLogEntries,
  ] = await Promise.all([
    sql.query(
      `SELECT * FROM participants WHERE id = $1 AND instance_id = $2`,
      [participantId, instanceId],
    ),
    sql.query(
      `SELECT * FROM team_members WHERE participant_id = $1 AND instance_id = $2`,
      [participantId, instanceId],
    ),
    sql.query(
      `SELECT * FROM participant_sessions WHERE participant_id = $1 AND instance_id = $2`,
      [participantId, instanceId],
    ),
    sql.query(
      `SELECT * FROM team_composition_history WHERE participant_id = $1 AND instance_id = $2`,
      [participantId, instanceId],
    ),
    sql.query(
      `SELECT * FROM participant_feedback WHERE participant_id = $1 AND instance_id = $2`,
      [participantId, instanceId],
    ),
    sql.query(
      `SELECT * FROM participant_poll_responses WHERE participant_id = $1 AND instance_id = $2`,
      [participantId, instanceId],
    ),
    sql.query(
      `SELECT * FROM checkpoints WHERE participant_id = $1 AND instance_id = $2`,
      [participantId, instanceId],
    ),
    sql.query(
      `SELECT * FROM workshop_feedback_submissions
         WHERE participant_id = $1 AND instance_id = $2`,
      [participantId, instanceId],
    ),
    // Audit log links participants only through JSONB metadata. Match
    // entries where metadata->>'participantId' equals the target id.
    sql.query(
      `SELECT * FROM audit_log
         WHERE instance_id = $1
           AND metadata->>'participantId' = $2`,
      [instanceId, participantId],
    ),
  ]);

  const toArray = (rows: unknown): Record<string, unknown>[] =>
    Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];

  return {
    exportedAt,
    participantId,
    instanceId,
    participant: toArray(participantRows)[0] ?? null,
    teamMemberships: toArray(teamMemberships),
    participantSessions: toArray(participantSessions),
    teamCompositionHistory: toArray(teamCompositionHistory),
    participantFeedback: toArray(participantFeedback),
    participantPollResponses: toArray(participantPollResponses),
    checkpoints: toArray(checkpoints),
    workshopFeedbackSubmissions: toArray(workshopFeedbackSubmissions),
    auditLogEntries: toArray(auditLogEntries),
  };
}
