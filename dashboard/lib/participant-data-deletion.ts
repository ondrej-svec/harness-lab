import { adminDeleteParticipantUser, type AdminDeleteUserResult } from "./auth/admin-create-user";
import { getNeonSql } from "./neon-db";
import { getRuntimeStorageMode } from "./runtime-storage";

/**
 * GDPR Art. 17 (right to erasure) cascade for a single participant.
 *
 * Hard-deletes every row in Neon that links the participant, then
 * attempts to remove the Neon Auth user via the control-plane. On
 * unsupported-delete responses, falls back to PII stripping in
 * neon_auth.user / neon_auth.account (see adminDeleteParticipantUser).
 *
 * The table list MUST be kept in sync with every `participant_id` FK in
 * the schema. `docs/privacy-participant-data.md` documents this contract;
 * adding a new FK without updating this cascade is a GDPR violation.
 *
 * The caller is responsible for:
 *   - facilitator-grant gating (`requireFacilitatorRequest`)
 *   - confirmation UX (body `{confirm: true, confirmDisplayName: string}`)
 *   - audit-log entry with full pre-delete snapshot
 */

export type ParticipantDeletionResult = {
  deletedRowsByTable: Record<string, number>;
  neonAuthUser: AdminDeleteUserResult | null;
};

// Ordered so that FK dependencies can't block a delete. The two
// participant_id columns on team_members + team_composition_history are
// CASCADE, but we delete explicitly to get an accurate row count per
// table in the result.
const CASCADE_TABLES = [
  "team_members",
  "participant_sessions",
  "team_composition_history",
  "participant_feedback",
  "participant_poll_responses",
  "checkpoints",
  "workshop_feedback_submissions",
] as const;

export async function deleteParticipantAndLinkedData(
  participantId: string,
  instanceId: string,
): Promise<ParticipantDeletionResult> {
  if (getRuntimeStorageMode() !== "neon") {
    throw new Error("deleteParticipantAndLinkedData requires HARNESS_STORAGE_MODE=neon");
  }

  const sql = getNeonSql();

  // Find the Neon Auth user (if any) before deleting the participants
  // row — otherwise we lose the neon_user_id link.
  const participantRows = (await sql.query(
    `SELECT neon_user_id FROM participants WHERE id = $1 AND instance_id = $2 LIMIT 1`,
    [participantId, instanceId],
  )) as Array<{ neon_user_id: string | null }>;

  const neonUserId = participantRows[0]?.neon_user_id ?? null;
  const deletedRowsByTable: Record<string, number> = {};

  for (const table of CASCADE_TABLES) {
    const result = (await sql.query(
      `DELETE FROM ${table} WHERE participant_id = $1 AND instance_id = $2 RETURNING 1`,
      [participantId, instanceId],
    )) as unknown[];
    deletedRowsByTable[table] = Array.isArray(result) ? result.length : 0;
  }

  const participantsDeleted = (await sql.query(
    `DELETE FROM participants WHERE id = $1 AND instance_id = $2 RETURNING 1`,
    [participantId, instanceId],
  )) as unknown[];
  deletedRowsByTable.participants = Array.isArray(participantsDeleted)
    ? participantsDeleted.length
    : 0;

  let neonAuthUser: AdminDeleteUserResult | null = null;
  if (neonUserId) {
    neonAuthUser = await adminDeleteParticipantUser(neonUserId);
  }

  return { deletedRowsByTable, neonAuthUser };
}
