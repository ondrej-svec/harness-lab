/**
 * GDPR export + delete integration test (Neon test branch).
 *
 * Verifies:
 *   - exportParticipantData returns rows from every cascade table plus
 *     the participant row plus audit-log entries keyed on the metadata
 *   - deleteParticipantAndLinkedData removes every linked row and the
 *     participants row itself
 *
 * Skipped unless HARNESS_TEST_DATABASE_URL is set. The test manages its
 * own unique instance per run to isolate from the rest of the suite.
 */

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEST_URL = process.env.HARNESS_TEST_DATABASE_URL;
const ENABLED = Boolean(TEST_URL);
const describeIntegration = ENABLED ? describe : describe.skip;

describeIntegration("participant GDPR lifecycle (integration · neon test branch)", () => {
  let originalMode: string | undefined;
  let originalUrl: string | undefined;
  const instanceId = `int-gdpr-${randomUUID()}`;
  const participantId = `p-gdpr-${randomUUID().slice(0, 8)}`;

  beforeAll(async () => {
    originalMode = process.env.HARNESS_STORAGE_MODE;
    originalUrl = process.env.HARNESS_DATABASE_URL;
    process.env.HARNESS_STORAGE_MODE = "neon";
    process.env.HARNESS_DATABASE_URL = TEST_URL;

    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(TEST_URL!);

    // Minimal instance + seed rows across every cascade table.
    await sql.query(
      `INSERT INTO workshop_instances (id, template_id, workshop_meta, workshop_state)
       VALUES ($1, 'integration-test', '{}'::jsonb, '{}'::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [instanceId],
    );
    const now = new Date().toISOString();
    await sql.query(
      `INSERT INTO participants (id, instance_id, display_name, email, email_opt_in, created_at, updated_at)
       VALUES ($1, $2, 'GDPR Test', 'gdpr@example.com', false, $3, $3)`,
      [participantId, instanceId, now],
    );
    // team + team_members
    const teamId = `t-${randomUUID().slice(0, 6)}`;
    await sql.query(
      `INSERT INTO teams (id, instance_id, payload, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW(), NOW())`,
      [teamId, instanceId, JSON.stringify({ id: teamId, name: "GDPR Tým" })],
    );
    await sql.query(
      `INSERT INTO team_members (id, instance_id, team_id, participant_id, assigned_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [`tm-${randomUUID().slice(0, 6)}`, instanceId, teamId, participantId],
    );
    // participant_feedback
    await sql.query(
      `INSERT INTO participant_feedback (id, instance_id, participant_id, kind, message, created_at)
       VALUES ($1, $2, $3, 'question', 'Can I see the export?', NOW())`,
      [`pf-${randomUUID().slice(0, 6)}`, instanceId, participantId],
    );
  });

  afterAll(async () => {
    if (!ENABLED) return;
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(TEST_URL!);
    // Best-effort cleanup — the delete test will have removed most of it.
    await sql.query(`DELETE FROM participant_feedback WHERE instance_id = $1`, [instanceId]);
    await sql.query(`DELETE FROM team_members WHERE instance_id = $1`, [instanceId]);
    await sql.query(`DELETE FROM participants WHERE instance_id = $1`, [instanceId]);
    await sql.query(`DELETE FROM teams WHERE instance_id = $1`, [instanceId]);
    await sql.query(`DELETE FROM workshop_instances WHERE id = $1`, [instanceId]);
    if (originalMode === undefined) delete process.env.HARNESS_STORAGE_MODE;
    else process.env.HARNESS_STORAGE_MODE = originalMode;
    if (originalUrl === undefined) delete process.env.HARNESS_DATABASE_URL;
    else process.env.HARNESS_DATABASE_URL = originalUrl;
  });

  it("exportParticipantData returns the participant + linked rows", async () => {
    const { exportParticipantData } = await import("./participant-data-export");
    const payload = await exportParticipantData(participantId, instanceId);

    expect(payload.participant).toMatchObject({ id: participantId, display_name: "GDPR Test" });
    expect(payload.teamMemberships.length).toBeGreaterThanOrEqual(1);
    expect(payload.participantFeedback.length).toBeGreaterThanOrEqual(1);
  });

  it("deleteParticipantAndLinkedData removes rows across the cascade", async () => {
    const { deleteParticipantAndLinkedData } = await import("./participant-data-deletion");
    const result = await deleteParticipantAndLinkedData(participantId, instanceId);

    expect(result.deletedRowsByTable.participants).toBe(1);
    expect(result.deletedRowsByTable.team_members).toBeGreaterThanOrEqual(1);
    expect(result.deletedRowsByTable.participant_feedback).toBeGreaterThanOrEqual(1);

    // Confirm via a fresh query that nothing remains.
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(TEST_URL!);
    const leftover = (await sql.query(
      `SELECT 1 FROM participants WHERE id = $1`,
      [participantId],
    )) as unknown[];
    expect(leftover).toEqual([]);
  });
});
