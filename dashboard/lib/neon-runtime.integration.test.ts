import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCheckpointRepository } from "./checkpoint-repository";
import { getEventAccessRepository } from "./event-access-repository";
import { getInstanceArchiveRepository } from "./instance-archive-repository";
import { getInstanceGrantRepository } from "./instance-grant-repository";
import { getMonitoringSnapshotRepository } from "./monitoring-snapshot-repository";
import { getNeonSql } from "./neon-db";
import { getParticipantEventAccessRepository } from "./participant-event-access-repository";
import { getTeamRepository } from "./team-repository";
import type { ParticipantSessionRecord } from "./runtime-contracts";
import { getWorkshopInstanceRepository } from "./workshop-instance-repository";
import { createWorkshopInstance, removeWorkshopInstance } from "./workshop-store";
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
    const lifecycleMigrationPath = path.join(
      process.cwd(),
      "db/migrations/2026-04-07-instance-lifecycle-and-agenda-authoring.sql",
    );
    const [schema, lifecycleMigration] = await Promise.all([
      readFile(schemaPath, "utf8"),
      readFile(lifecycleMigrationPath, "utf8"),
    ]);
    const sql = getNeonSql();

    await sql.query(schema);
    await sql.query(lifecycleMigration);
    await sql.query("DELETE FROM checkpoints WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM instance_archives WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM instance_grants WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM monitoring_snapshots WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM participant_sessions WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM teams WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM workshop_instances WHERE id = $1", [instanceId]);
  });

  afterAll(async () => {
    const sql = getNeonSql();
    await sql.query("DELETE FROM checkpoints WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM instance_archives WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM instance_grants WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM monitoring_snapshots WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM participant_sessions WHERE instance_id = $1", [instanceId]);
    await sql.query("DELETE FROM teams WHERE instance_id = $1", [instanceId]);
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

    await repository.upsertSession(instanceId, session);

    await expect(repository.listSessions(instanceId)).resolves.toEqual([session]);
  });

  it("round-trips dedicated checkpoint and monitoring repositories in Neon mode", async () => {
    const checkpointRepository = getCheckpointRepository();
    const monitoringRepository = getMonitoringSnapshotRepository();
    const teamRepository = getTeamRepository();

    await checkpointRepository.appendCheckpoint(instanceId, {
      id: "u-neon",
      teamId: "t2",
      text: "Checkpoint přes Neon repository",
      at: "14:02",
    });
    await monitoringRepository.replaceSnapshots(instanceId, [
      {
        teamId: "t2",
        agentsFile: true,
        skillsCount: 2,
        commitsLast30Min: 6,
        testsVisible: 1,
      },
    ]);
    await teamRepository.upsertTeam(instanceId, {
      id: "t-neon",
      name: "Tým Neon",
      city: "Studio Neon",
      members: ["Anna", "David"],
      repoUrl: "https://github.com/example/neon-team",
      projectBriefId: "standup-bot",
      checkpoint: "Team repository přes Neon",
    });

    await expect(checkpointRepository.listCheckpoints(instanceId)).resolves.toMatchObject([{ id: "u-neon" }]);
    await expect(monitoringRepository.getSnapshots(instanceId)).resolves.toMatchObject([{ teamId: "t2" }]);
    await expect(teamRepository.listTeams(instanceId)).resolves.toMatchObject([{ id: "t-neon" }]);
  });

  it("round-trips archive payloads in Neon mode", async () => {
    const repository = getInstanceArchiveRepository();

    await repository.createArchive({
      id: "archive-neon",
      instanceId,
      archiveStatus: "ready",
      storageUri: null,
      createdAt: "2026-04-06T12:00:00.000Z",
      retentionUntil: "2026-05-06T12:00:00.000Z",
      notes: "Neon archive test",
      payload: {
        archivedAt: "2026-04-06T12:00:00.000Z",
        reason: "manual",
        workshopState: await getWorkshopStateRepository().getState(instanceId),
        checkpoints: [],
        monitoringSnapshots: [],
        participantEventAccessVersion: 1,
        participantSessions: [],
      },
    });

    await expect(repository.getLatestArchive(instanceId)).resolves.toMatchObject({
      id: "archive-neon",
      notes: "Neon archive test",
      payload: {
        participantEventAccessVersion: 1,
      },
    });
  });

  it("can create and query grants by neon_user_id", async () => {
    const testUserId = `test-user-${Date.now()}`;
    const repo = getInstanceGrantRepository();
    const grant = await repo.createGrant(instanceId, testUserId, "operator");
    expect(grant).toMatchObject({
      instanceId,
      neonUserId: testUserId,
      role: "operator",
      revokedAt: null,
    });

    const found = await repo.getActiveGrantByNeonUserId(instanceId, testUserId);
    expect(found).toMatchObject({ neonUserId: testUserId });

    await repo.revokeGrant(grant.id);
    const revoked = await repo.getActiveGrantByNeonUserId(instanceId, testUserId);
    expect(revoked).toBeNull();
  });

  it("creates and tombstones workshop instances in Neon mode", async () => {
    const dynamicInstanceId = `integration-instance-${Date.now()}`;
    const sql = getNeonSql();

    try {
      const created = await createWorkshopInstance({
        id: dynamicInstanceId,
        templateId: "sample-lab-d",
        city: "Integration Room",
        dateRange: "2026-04-07 • Integration Room",
      });

      expect(created).toMatchObject({
        id: dynamicInstanceId,
        templateId: "sample-lab-d",
        removedAt: null,
        workshopMeta: { city: "Integration Room" },
      });
      await expect(getWorkshopStateRepository().getState(dynamicInstanceId)).resolves.toMatchObject({
        workshopId: dynamicInstanceId,
        workshopMeta: { city: "Integration Room" },
      });
      await expect(getWorkshopInstanceRepository().listInstances()).resolves.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: dynamicInstanceId })]),
      );

      await removeWorkshopInstance(dynamicInstanceId);

      await expect(getWorkshopInstanceRepository().getInstance(dynamicInstanceId)).resolves.toMatchObject({
        id: dynamicInstanceId,
        status: "removed",
        removedAt: expect.any(String),
      });
      await expect(getWorkshopInstanceRepository().listInstances()).resolves.not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: dynamicInstanceId })]),
      );
      await expect(getWorkshopInstanceRepository().listInstances({ includeRemoved: true })).resolves.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: dynamicInstanceId, status: "removed" })]),
      );
    } finally {
      await sql.query("DELETE FROM instance_archives WHERE instance_id = $1", [dynamicInstanceId]);
      await sql.query("DELETE FROM checkpoints WHERE instance_id = $1", [dynamicInstanceId]);
      await sql.query("DELETE FROM monitoring_snapshots WHERE instance_id = $1", [dynamicInstanceId]);
      await sql.query("DELETE FROM participant_sessions WHERE instance_id = $1", [dynamicInstanceId]);
      await sql.query("DELETE FROM teams WHERE instance_id = $1", [dynamicInstanceId]);
      await sql.query("DELETE FROM workshop_instances WHERE id = $1", [dynamicInstanceId]);
    }
  });
});
