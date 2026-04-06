import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getEventAccessRepository } from "./event-access-repository";
import { getFacilitatorIdentityRepository } from "./facilitator-identity-repository";
import { getInstanceGrantRepository } from "./instance-grant-repository";
import { getNeonSql } from "./neon-db";
import { getParticipantEventAccessRepository } from "./participant-event-access-repository";
import type { ParticipantSessionRecord } from "./runtime-contracts";
import { getWorkshopStateRepository } from "./workshop-state-repository";

const hasNeonTestDatabase = Boolean(process.env.HARNESS_TEST_DATABASE_URL);

describe.skipIf(!hasNeonTestDatabase)("neon runtime adapters", () => {
  const instanceId = "sample-studio-a";
  const originalStorageMode = process.env.HARNESS_STORAGE_MODE;
  const originalDatabaseUrl = process.env.HARNESS_DATABASE_URL;

  beforeAll(async () => {
    process.env.HARNESS_STORAGE_MODE = "neon";
    process.env.HARNESS_DATABASE_URL = process.env.HARNESS_TEST_DATABASE_URL;

    const schemaPath = path.join(process.cwd(), "db/migrations/2026-04-06-private-workshop-instance-runtime.sql");
    const schema = await readFile(schemaPath, "utf8");
    const sql = getNeonSql();

    await sql.query(schema);
    await sql.query("DELETE FROM instance_grants WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM participant_sessions WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM workshop_instances WHERE id = $1", [instanceId]);
  });

  afterAll(async () => {
    const sql = getNeonSql();
    await sql.query("DELETE FROM instance_grants WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM participant_sessions WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM workshop_instances WHERE id = $1", [instanceId]);

    if (originalStorageMode === undefined) {
      delete process.env.HARNESS_STORAGE_MODE;
    } else {
      process.env.HARNESS_STORAGE_MODE = originalStorageMode;
    }

    if (originalDatabaseUrl === undefined) {
      delete process.env.HARNESS_DATABASE_URL;
    } else {
      process.env.HARNESS_DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("bootstraps a sample workshop instance from the Neon-backed state repository", async () => {
    const state = await getWorkshopStateRepository().getState(instanceId);

    expect(state.workshopId).toBe(instanceId);
    expect(state.teams).toEqual([]);
  });

  it("round-trips participant sessions through the Neon-backed event-access repository", async () => {
    const repository = getEventAccessRepository();
    const access = await getParticipantEventAccessRepository().getActiveAccess(instanceId);
    expect(access).not.toBeNull();
    const session: ParticipantSessionRecord = {
      tokenHash: "test-token-hash",
      instanceId,
      createdAt: "2026-04-06T12:00:00.000Z",
      expiresAt: "2026-04-06T13:00:00.000Z",
      lastValidatedAt: "2026-04-06T12:30:00.000Z",
      absoluteExpiresAt: "2026-04-06T14:00:00.000Z",
    };

    await repository.saveSessions(instanceId, [session]);

    await expect(repository.getSessions(instanceId)).resolves.toEqual([session]);
  });

  it("bootstraps a seed facilitator grant without failing the foreign-key constraint", async () => {
    const identity = await getFacilitatorIdentityRepository().findByUsername("facilitator");
    expect(identity).not.toBeNull();

    const grant = await getInstanceGrantRepository().getActiveGrant(instanceId, identity!.id);
    expect(grant).toMatchObject({
      instanceId,
      facilitatorIdentityId: identity!.id,
      role: "owner",
      revokedAt: null,
    });
  });
});
