import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { CheckpointRecord } from "./runtime-contracts";

const checkpoint: CheckpointRecord = {
  id: "c1",
  teamId: "t1",
  text: "First checkpoint",
  at: "10:30",
};

describe("checkpoint-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-checkpoints-"));
    process.env.HARNESS_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./checkpoint-repository");
    mod.setCheckpointRepositoryForTests(null);
  });

  it("manages checkpoints in file mode", async () => {
    const { FileCheckpointRepository } = await import("./checkpoint-repository");
    const repository = new FileCheckpointRepository();

    await expect(repository.listCheckpoints("instance-a")).resolves.toEqual([]);
    await repository.appendCheckpoint("instance-a", checkpoint);
    await repository.appendCheckpoint("instance-a", { ...checkpoint, id: "c2", text: "Second checkpoint" });
    await expect(repository.listCheckpoints("instance-a")).resolves.toEqual([
      expect.objectContaining({ id: "c2" }),
      expect.objectContaining({ id: "c1" }),
    ]);

    await repository.replaceCheckpoints("instance-a", [checkpoint]);
    await expect(repository.listCheckpoints("instance-a")).resolves.toEqual([checkpoint]);
  });

  it("writes neon checkpoint queries", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([{ payload: checkpoint }])
      .mockResolvedValue(undefined);
    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonCheckpointRepository, getCheckpointRepository } = await import("./checkpoint-repository");
    const repository = new NeonCheckpointRepository();

    await expect(repository.listCheckpoints("instance-a")).resolves.toEqual([checkpoint]);
    await repository.appendCheckpoint("instance-a", checkpoint);
    await repository.replaceCheckpoints("instance-a", [checkpoint]);
    expect(getCheckpointRepository()).toBeInstanceOf(NeonCheckpointRepository);
    expect(query).toHaveBeenCalled();

    const insertCalls = query.mock.calls.filter(([sql]) =>
      typeof sql === "string" && sql.includes("INSERT INTO checkpoints"),
    );
    expect(insertCalls.length).toBeGreaterThan(0);
    expect(insertCalls[0][0]).toContain("participant_id");
    // Team-scoped insert passes teamId and NULL for participant_id
    expect(insertCalls[0][1]).toEqual(["c1", "instance-a", "t1", null, JSON.stringify(checkpoint)]);
  });

  it("writes participant-subject checkpoints with participant_id and null team_id", async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonCheckpointRepository } = await import("./checkpoint-repository");
    const repository = new NeonCheckpointRepository();

    const participantCheckpoint: CheckpointRecord = {
      id: "c-p-1",
      teamId: null,
      participantId: "p-alice",
      text: "Participant-scoped sprint update",
      at: "11:00",
    };
    await repository.appendCheckpoint("instance-a", participantCheckpoint);

    expect(query.mock.calls[0][1]).toEqual([
      "c-p-1",
      "instance-a",
      null,
      "p-alice",
      JSON.stringify(participantCheckpoint),
    ]);
  });

  it("rejects checkpoints that set neither or both subjects", async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonCheckpointRepository } = await import("./checkpoint-repository");
    const repository = new NeonCheckpointRepository();

    await expect(
      repository.appendCheckpoint("instance-a", {
        id: "c-bad-none",
        teamId: null,
        participantId: null,
        text: "Neither subject",
        at: "11:00",
      }),
    ).rejects.toThrow(/exactly one subject/);

    await expect(
      repository.appendCheckpoint("instance-a", {
        id: "c-bad-both",
        teamId: "t1",
        participantId: "p1",
        text: "Both subjects",
        at: "11:00",
      }),
    ).rejects.toThrow(/exactly one subject/);

    expect(query).not.toHaveBeenCalled();
  });
});
