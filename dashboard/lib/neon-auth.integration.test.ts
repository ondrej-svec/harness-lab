import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getNeonSql } from "./neon-db";
import { getInstanceGrantRepository } from "./instance-grant-repository";

/**
 * Integration tests for Neon Auth facilitator identity flow.
 *
 * These tests run against a live Neon branch with Auth enabled.
 * They verify the core facilitator auth contract:
 *   - neon_auth.user is queryable from application code
 *   - instance_grants work with neon_user_id (one-hop auth)
 *   - grant lifecycle: create → query → revoke
 *   - first-user auto-bootstrap logic
 *
 * Requirements:
 *   HARNESS_TEST_DATABASE_URL — Neon connection string with neon_auth schema
 *   HARNESS_STORAGE_MODE=neon
 *
 * To run:
 *   HARNESS_STORAGE_MODE=neon HARNESS_TEST_DATABASE_URL=postgres://... npx vitest run neon-auth.integration.test.ts
 */

const hasNeonTestDatabase = Boolean(process.env.HARNESS_TEST_DATABASE_URL);
const hasNeonAuthSchema = hasNeonTestDatabase; // Assume if test DB exists, auth schema is there

describe.skipIf(!hasNeonAuthSchema)("neon auth integration", () => {
  const instanceId = "test-auth-instance";
  const testUserId = `test-user-${Date.now()}`;
  const originalStorageMode = process.env.HARNESS_STORAGE_MODE;
  const originalDatabaseUrl = process.env.HARNESS_DATABASE_URL;

  beforeAll(async () => {
    process.env.HARNESS_STORAGE_MODE = "neon";
    process.env.HARNESS_DATABASE_URL = process.env.HARNESS_TEST_DATABASE_URL;

    // Ensure test instance exists
    const sql = getNeonSql();
    await sql.query(
      `INSERT INTO workshop_instances (id, template_id, workshop_meta, workshop_state)
       VALUES ($1, $2, '{}'::jsonb, '{}'::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [instanceId, "test-template"],
    );

    // Clean up any previous test grants
    await sql.query(
      `DELETE FROM instance_grants WHERE instance_id = $1`,
      [instanceId],
    );
  });

  afterAll(async () => {
    // Cleanup
    const sql = getNeonSql();
    await sql.query(`DELETE FROM instance_grants WHERE instance_id = $1`, [instanceId]);
    await sql.query(`DELETE FROM workshop_instances WHERE id = $1`, [instanceId]);

    process.env.HARNESS_STORAGE_MODE = originalStorageMode ?? "";
    process.env.HARNESS_DATABASE_URL = originalDatabaseUrl ?? "";
  });

  it("can query the neon_auth.user table from application code", async () => {
    const sql = getNeonSql();
    const result = await sql.query(
      `SELECT count(*)::int AS cnt FROM neon_auth."user"`,
    );
    expect(result).toBeDefined();
    expect((result as { cnt: number }[])[0].cnt).toBeGreaterThanOrEqual(0);
  });

  it("can look up neon_auth users by email", async () => {
    const sql = getNeonSql();
    // This should return empty for a non-existent email — the point is it doesn't throw
    const result = await sql.query(
      `SELECT id::text, name, email FROM neon_auth."user" WHERE email = $1 LIMIT 1`,
      ["nonexistent-test@example.com"],
    );
    expect(Array.isArray(result)).toBe(true);
    expect((result as unknown[]).length).toBe(0);
  });

  it("creates a grant by neon_user_id and retrieves it", async () => {
    const repo = getInstanceGrantRepository();
    const grant = await repo.createGrant(instanceId, testUserId, "owner");

    expect(grant).toMatchObject({
      instanceId,
      neonUserId: testUserId,
      role: "owner",
      revokedAt: null,
    });

    const found = await repo.getActiveGrantByNeonUserId(instanceId, testUserId);
    expect(found).not.toBeNull();
    expect(found!.neonUserId).toBe(testUserId);
  });

  it("lists active grants for an instance", async () => {
    const repo = getInstanceGrantRepository();
    const grants = await repo.listActiveGrants(instanceId);

    expect(grants.length).toBeGreaterThanOrEqual(1);
    const testGrant = grants.find((g) => g.neonUserId === testUserId);
    expect(testGrant).toBeDefined();
    expect(testGrant!.role).toBe("owner");
  });

  it("counts active grants for bootstrap logic", async () => {
    const repo = getInstanceGrantRepository();
    const count = await repo.countActiveGrants(instanceId);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("revokes a grant and confirms it's no longer active", async () => {
    const repo = getInstanceGrantRepository();
    const grant = await repo.getActiveGrantByNeonUserId(instanceId, testUserId);
    expect(grant).not.toBeNull();

    await repo.revokeGrant(grant!.id);

    const revoked = await repo.getActiveGrantByNeonUserId(instanceId, testUserId);
    expect(revoked).toBeNull();
  });

  it("auto-bootstrap: countActiveGrants returns 0 on a clean instance", async () => {
    const repo = getInstanceGrantRepository();
    // All grants were revoked in previous test
    const count = await repo.countActiveGrants(instanceId);
    expect(count).toBe(0);
  });

  it("supports multiple facilitators on the same instance", async () => {
    const repo = getInstanceGrantRepository();
    const user1 = `multi-test-user-1-${Date.now()}`;
    const user2 = `multi-test-user-2-${Date.now()}`;

    await repo.createGrant(instanceId, user1, "owner");
    await repo.createGrant(instanceId, user2, "operator");

    const grants = await repo.listActiveGrants(instanceId);
    const ids = grants.map((g) => g.neonUserId);
    expect(ids).toContain(user1);
    expect(ids).toContain(user2);

    const ownerGrant = grants.find((g) => g.neonUserId === user1);
    const operatorGrant = grants.find((g) => g.neonUserId === user2);
    expect(ownerGrant!.role).toBe("owner");
    expect(operatorGrant!.role).toBe("operator");
  });

  it("denies grant for a different instance", async () => {
    const repo = getInstanceGrantRepository();
    const user = `cross-instance-user-${Date.now()}`;
    await repo.createGrant(instanceId, user, "owner");

    const otherInstance = await repo.getActiveGrantByNeonUserId("other-instance", user);
    expect(otherInstance).toBeNull();
  });
});
