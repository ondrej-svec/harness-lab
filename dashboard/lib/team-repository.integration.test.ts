/**
 * Team repository round-trip — runs against a Neon test branch.
 *
 * Validates the Phase 3 `replaceTeams` rewrite (Neon-only): two-query
 * delete-then-unnest-upsert replacing the former N+1 loop. The test
 * asserts that the end state matches the sequential implementation
 * over a 50-team fixture, then a partial-replace, then an empty replace.
 *
 * Skipped unless HARNESS_TEST_DATABASE_URL is set.
 */

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TeamRecord } from "./runtime-contracts";

const TEST_URL = process.env.HARNESS_TEST_DATABASE_URL;
const ENABLED = Boolean(TEST_URL);
const describeIntegration = ENABLED ? describe : describe.skip;

describeIntegration("NeonTeamRepository round-trip (integration · neon test branch)", () => {
  let originalMode: string | undefined;
  let originalUrl: string | undefined;
  let repo: import("./team-repository").NeonTeamRepository;
  const instanceId = `int-team-${randomUUID()}`;

  beforeAll(async () => {
    originalMode = process.env.HARNESS_STORAGE_MODE;
    originalUrl = process.env.HARNESS_DATABASE_URL;
    process.env.HARNESS_STORAGE_MODE = "neon";
    process.env.HARNESS_DATABASE_URL = TEST_URL;
    const mod = await import("./team-repository");
    repo = new mod.NeonTeamRepository();

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
    await sql.query(`DELETE FROM teams WHERE instance_id = $1`, [instanceId]);
    await sql.query(`DELETE FROM workshop_instances WHERE id = $1`, [instanceId]);
    if (originalMode === undefined) delete process.env.HARNESS_STORAGE_MODE;
    else process.env.HARNESS_STORAGE_MODE = originalMode;
    if (originalUrl === undefined) delete process.env.HARNESS_DATABASE_URL;
    else process.env.HARNESS_DATABASE_URL = originalUrl;
  });

  function makeTeam(index: number, overrides: Partial<TeamRecord> = {}): TeamRecord {
    return {
      id: `t-${index.toString().padStart(2, "0")}-${randomUUID().slice(0, 6)}`,
      name: overrides.name ?? `Tým ${index}`,
      city: overrides.city ?? "Brno",
      members: overrides.members ?? [`Člen ${index}A`, `Člen ${index}B`],
      repoUrl: overrides.repoUrl ?? "",
      projectBriefId: overrides.projectBriefId ?? "default-brief",
      checkIns: overrides.checkIns ?? [],
      anchor: overrides.anchor ?? null,
    };
  }

  it("replaceTeams round-trips a 50-row fixture via single-query unnest", async () => {
    const fixture = Array.from({ length: 50 }, (_, index) => makeTeam(index));

    await repo.replaceTeams(instanceId, fixture);

    const persisted = await repo.listTeams(instanceId);
    expect(persisted).toHaveLength(50);
    expect(persisted.map((row) => row.id).sort()).toEqual(fixture.map((row) => row.id).sort());
    // JSONB round-trip fidelity — name + members should survive verbatim.
    const byId = new Map(persisted.map((row) => [row.id, row] as const));
    for (const expected of fixture) {
      const actual = byId.get(expected.id);
      expect(actual?.name).toBe(expected.name);
      expect(actual?.members).toEqual(expected.members);
    }

    // Partial replace: 20 kept, 10 new. 30 total after.
    const kept = fixture.slice(0, 20);
    const fresh = Array.from({ length: 10 }, (_, index) => makeTeam(100 + index));
    await repo.replaceTeams(instanceId, [...kept, ...fresh]);

    const postReplace = await repo.listTeams(instanceId);
    expect(postReplace).toHaveLength(30);
    const postIds = new Set(postReplace.map((row) => row.id));
    for (const row of kept) expect(postIds.has(row.id)).toBe(true);
    for (const row of fresh) expect(postIds.has(row.id)).toBe(true);

    // Empty-replace deletes everything for the instance.
    await repo.replaceTeams(instanceId, []);
    const postEmpty = await repo.listTeams(instanceId);
    expect(postEmpty).toEqual([]);
  });
});
