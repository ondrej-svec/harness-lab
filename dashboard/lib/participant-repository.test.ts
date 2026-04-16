import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { ParticipantRecord } from "./runtime-contracts";

const baseParticipant: ParticipantRecord = {
  id: "p1",
  instanceId: "instance-a",
  displayName: "Ada Lovelace",
  email: null,
  emailOptIn: false,
  tag: "senior",
  createdAt: "2026-04-16T10:00:00.000Z",
  updatedAt: "2026-04-16T10:00:00.000Z",
  archivedAt: null,
};

describe("participant-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-participant-"));
    process.env.HARNESS_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./participant-repository");
    mod.setParticipantRepositoryForTests(null);
  });

  it("lists, upserts, archives, and finds by display name in file mode", async () => {
    const { FileParticipantRepository } = await import("./participant-repository");
    const repo = new FileParticipantRepository();

    await expect(repo.listParticipants("instance-a")).resolves.toEqual([]);

    await repo.upsertParticipant("instance-a", baseParticipant);
    await expect(repo.listParticipants("instance-a")).resolves.toEqual([baseParticipant]);

    const updated = { ...baseParticipant, tag: "mid", updatedAt: "2026-04-16T11:00:00.000Z" };
    await repo.upsertParticipant("instance-a", updated);
    await expect(repo.listParticipants("instance-a")).resolves.toEqual([updated]);

    // Case-insensitive display-name lookup, trim-tolerant
    await expect(repo.findParticipantByDisplayName("instance-a", "  ADA LOVELACE  ")).resolves.toEqual(updated);

    // Archive hides from default listing but keeps when includeArchived=true
    await repo.archiveParticipant("instance-a", "p1", "2026-04-16T12:00:00.000Z");
    await expect(repo.listParticipants("instance-a")).resolves.toEqual([]);
    await expect(repo.listParticipants("instance-a", { includeArchived: true })).resolves.toHaveLength(1);

    // Archived participant is no longer found by display name
    await expect(repo.findParticipantByDisplayName("instance-a", "Ada Lovelace")).resolves.toBeNull();
  });

  it("scopes reads to a single instance", async () => {
    const { FileParticipantRepository } = await import("./participant-repository");
    const repo = new FileParticipantRepository();

    await repo.upsertParticipant("instance-a", baseParticipant);
    await repo.upsertParticipant("instance-b", { ...baseParticipant, id: "p2", instanceId: "instance-b" });

    await expect(repo.listParticipants("instance-a")).resolves.toHaveLength(1);
    await expect(repo.listParticipants("instance-b")).resolves.toHaveLength(1);
    await expect(repo.findParticipant("instance-a", "p2")).resolves.toBeNull();
  });

  it("writes the expected neon queries in neon mode", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([]) // listParticipants
      .mockResolvedValueOnce(undefined) // upsertParticipant
      .mockResolvedValueOnce([]) // findParticipantByDisplayName
      .mockResolvedValueOnce(undefined); // archiveParticipant

    vi.doMock("./runtime-storage", () => ({ getRuntimeStorageMode: () => "neon" }));
    vi.doMock("./neon-db", () => ({ getNeonSql: () => ({ query }) }));

    const mod = await import("./participant-repository");
    const repo = mod.getParticipantRepository();

    await repo.listParticipants("instance-a");
    await repo.upsertParticipant("instance-a", baseParticipant);
    await repo.findParticipantByDisplayName("instance-a", "Ada Lovelace");
    await repo.archiveParticipant("instance-a", "p1", "2026-04-16T12:00:00.000Z");

    expect(query).toHaveBeenCalledTimes(4);
    expect(query.mock.calls[0][0]).toMatch(/archived_at IS NULL/);
    expect(query.mock.calls[1][0]).toMatch(/INSERT INTO participants/);
    expect(query.mock.calls[2][0]).toMatch(/LOWER\(display_name\)/);
    expect(query.mock.calls[3][0]).toMatch(/UPDATE participants\s+SET archived_at/);
  });
});
