/**
 * Participant repository round-trip — runs against a Neon test branch.
 *
 * Exercises the methods Phase 5 added to NeonParticipantRepository:
 *   - upsertParticipant (existing)
 *   - listByDisplayNamePrefix (5.2)
 *   - linkNeonUser (5.2)
 *   - findByNeonUserId (5.2)
 *   - findParticipant (regression: must return neonUserId, not undefined)
 *
 * Skipped unless HARNESS_TEST_DATABASE_URL is set. Writes go to a unique
 * instance id per run so the test data is easy to identify and harmless
 * on the test branch (which gets thrown away anyway).
 */

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ParticipantRecord } from "./runtime-contracts";

const TEST_URL = process.env.HARNESS_TEST_DATABASE_URL;
const ENABLED = Boolean(TEST_URL);
const describeIntegration = ENABLED ? describe : describe.skip;

describeIntegration("NeonParticipantRepository round-trip (integration · neon test branch)", () => {
  let originalMode: string | undefined;
  let originalUrl: string | undefined;
  let repo: import("./participant-repository").NeonParticipantRepository;
  const instanceId = `int-test-${randomUUID()}`;

  beforeAll(async () => {
    originalMode = process.env.HARNESS_STORAGE_MODE;
    originalUrl = process.env.HARNESS_DATABASE_URL;
    process.env.HARNESS_STORAGE_MODE = "neon";
    process.env.HARNESS_DATABASE_URL = TEST_URL;
    const mod = await import("./participant-repository");
    repo = new mod.NeonParticipantRepository();

    // FK requires the instance to exist. Insert a minimal one — we drop
    // it in afterAll. Using a unique id per run isolates from any other
    // run that might share the same branch.
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(TEST_URL!);
    await sql.query(
      `INSERT INTO workshop_instances (id, template_id, workshop_meta, workshop_state)
       VALUES ($1, 'integration-test', '{}'::jsonb, '{}'::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [instanceId],
    );
  });

  afterAll(async () => {
    if (!ENABLED) return;
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(TEST_URL!);
    await sql.query(`DELETE FROM participants WHERE instance_id = $1`, [instanceId]);
    await sql.query(`DELETE FROM workshop_instances WHERE id = $1`, [instanceId]);
    if (originalMode === undefined) delete process.env.HARNESS_STORAGE_MODE;
    else process.env.HARNESS_STORAGE_MODE = originalMode;
    if (originalUrl === undefined) delete process.env.HARNESS_DATABASE_URL;
    else process.env.HARNESS_DATABASE_URL = originalUrl;
  });

  function makeRecord(overrides: Partial<ParticipantRecord> = {}): ParticipantRecord {
    const now = new Date().toISOString();
    return {
      id: `p-${randomUUID().slice(0, 8)}`,
      instanceId,
      displayName: overrides.displayName ?? "Jan Novák",
      email: overrides.email ?? null,
      emailOptIn: overrides.emailOptIn ?? false,
      tag: overrides.tag ?? null,
      neonUserId: overrides.neonUserId ?? null,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      archivedAt: overrides.archivedAt ?? null,
      ...overrides,
    };
  }

  it("upsert + findParticipant returns neonUserId (not undefined)", async () => {
    const record = makeRecord({ displayName: "Find Roundtrip", neonUserId: null });
    await repo.upsertParticipant(instanceId, record);

    const found = await repo.findParticipant(instanceId, record.id);
    expect(found).not.toBeNull();
    // The bug surface: rowToRecord requires neon_user_id in the SELECT.
    // If the SELECT omits it, this comes back as undefined and the
    // type contract breaks.
    expect(found).toHaveProperty("neonUserId");
    expect(found?.neonUserId).toBeNull();
  });

  it("linkNeonUser persists, then findByNeonUserId returns the same row", async () => {
    const record = makeRecord({ displayName: "Link Roundtrip", email: "link@example.com" });
    await repo.upsertParticipant(instanceId, record);

    const neonUserId = randomUUID();
    await repo.linkNeonUser(instanceId, record.id, neonUserId, new Date().toISOString());

    const refound = await repo.findByNeonUserId(instanceId, neonUserId);
    expect(refound?.id).toBe(record.id);
    expect(refound?.neonUserId).toBe(neonUserId);
  });

  it("listByDisplayNamePrefix returns case-insensitive prefix matches up to limit", async () => {
    await repo.upsertParticipant(instanceId, makeRecord({ displayName: "Anna Bok" }));
    await repo.upsertParticipant(instanceId, makeRecord({ displayName: "Anna Cerná" }));
    await repo.upsertParticipant(instanceId, makeRecord({ displayName: "Bara Dvořák" }));

    const matches = await repo.listByDisplayNamePrefix(instanceId, "ann", 5);
    const names = matches.map((m) => m.displayName).sort();
    expect(names).toContain("Anna Bok");
    expect(names).toContain("Anna Cerná");
    expect(names).not.toContain("Bara Dvořák");
  });

  it("listByDisplayNamePrefix returns [] for empty prefix and respects limit", async () => {
    const empty = await repo.listByDisplayNamePrefix(instanceId, "", 5);
    expect(empty).toEqual([]);

    const limited = await repo.listByDisplayNamePrefix(instanceId, "a", 1);
    expect(limited.length).toBeLessThanOrEqual(1);
  });

  it("replaceParticipants round-trips a 50-row fixture via single-query unnest", async () => {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(TEST_URL!);
    const isolatedInstance = `int-repl-${randomUUID()}`;
    await sql.query(
      `INSERT INTO workshop_instances (id, template_id, workshop_meta, workshop_state)
       VALUES ($1, 'integration-test', '{}'::jsonb, '{}'::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [isolatedInstance],
    );

    try {
      const now = new Date().toISOString();
      const fixture: ParticipantRecord[] = Array.from({ length: 50 }, (_, index) => ({
        id: `p-repl-${index.toString().padStart(2, "0")}-${randomUUID().slice(0, 6)}`,
        instanceId: isolatedInstance,
        displayName: `Participant ${index}`,
        email: index % 3 === 0 ? `p${index}@example.com` : null,
        emailOptIn: index % 2 === 0,
        tag: index % 5 === 0 ? `tag-${index}` : null,
        neonUserId: null,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      }));

      await repo.replaceParticipants(isolatedInstance, fixture);

      const persisted = await repo.listParticipants(isolatedInstance, { includeArchived: true });
      expect(persisted).toHaveLength(50);
      expect(persisted.map((row) => row.id).sort()).toEqual(fixture.map((row) => row.id).sort());

      // Replace with a smaller set: 20 existing + 10 new. Expect a clean
      // delete of the 30 missing rows and an upsert that leaves 30 total.
      const kept = fixture.slice(0, 20);
      const fresh: ParticipantRecord[] = Array.from({ length: 10 }, (_, index) => ({
        id: `p-repl-new-${index}-${randomUUID().slice(0, 6)}`,
        instanceId: isolatedInstance,
        displayName: `New Participant ${index}`,
        email: null,
        emailOptIn: false,
        tag: null,
        neonUserId: null,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      }));
      await repo.replaceParticipants(isolatedInstance, [...kept, ...fresh]);

      const postReplace = await repo.listParticipants(isolatedInstance, { includeArchived: true });
      expect(postReplace).toHaveLength(30);
      const postIds = new Set(postReplace.map((row) => row.id));
      for (const row of kept) expect(postIds.has(row.id)).toBe(true);
      for (const row of fresh) expect(postIds.has(row.id)).toBe(true);

      // Empty-replace deletes everything.
      await repo.replaceParticipants(isolatedInstance, []);
      const postEmpty = await repo.listParticipants(isolatedInstance, { includeArchived: true });
      expect(postEmpty).toEqual([]);
    } finally {
      await sql.query(`DELETE FROM participants WHERE instance_id = $1`, [isolatedInstance]);
      await sql.query(`DELETE FROM workshop_instances WHERE id = $1`, [isolatedInstance]);
    }
  });

  it("linkNeonUser is a no-op when another participant already owns the id", async () => {
    const a = makeRecord({ displayName: "Owner A" });
    const b = makeRecord({ displayName: "Other B" });
    await repo.upsertParticipant(instanceId, a);
    await repo.upsertParticipant(instanceId, b);

    const sharedNeonId = randomUUID();
    await repo.linkNeonUser(instanceId, a.id, sharedNeonId, new Date().toISOString());

    // Attempting to link the same neon user to participant b should
    // noop (WHERE neon_user_id IS NULL) without throwing — the unique
    // index is the hard guard, the WHERE is the soft one.
    await repo.linkNeonUser(instanceId, b.id, sharedNeonId, new Date().toISOString());

    const stillA = await repo.findByNeonUserId(instanceId, sharedNeonId);
    expect(stillA?.id).toBe(a.id);

    const refoundB = await repo.findParticipant(instanceId, b.id);
    expect(refoundB?.neonUserId).toBeNull();
  });
});
