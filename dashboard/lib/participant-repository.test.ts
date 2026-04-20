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
  neonUserId: null,
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

  it("suggests participants by display-name substring, capped, archived excluded", async () => {
    const { FileParticipantRepository } = await import("./participant-repository");
    const repo = new FileParticipantRepository();
    const mkp = (id: string, name: string, archivedAt: string | null = null) => ({
      ...baseParticipant,
      id,
      displayName: name,
      archivedAt,
    });

    await repo.upsertParticipant("instance-a", mkp("p1", "Jan Novák"));
    await repo.upsertParticipant("instance-a", mkp("p2", "Jana Dvořáková"));
    await repo.upsertParticipant("instance-a", mkp("p3", "Josef Vrba"));
    await repo.upsertParticipant("instance-a", mkp("p4", "Janek Horák", "2026-04-19T00:00:00.000Z"));

    // Case-insensitive prefix/substring match on "jan"
    const jans = await repo.listByDisplayNamePrefix("instance-a", "jan", 5);
    expect(jans.map((p) => p.id)).toEqual(["p1", "p2"]);

    // Archived Janek is excluded
    expect(jans.find((p) => p.id === "p4")).toBeUndefined();

    // Limit is honored
    const capped = await repo.listByDisplayNamePrefix("instance-a", "", 5);
    expect(capped).toEqual([]); // empty prefix returns nothing

    const oneResult = await repo.listByDisplayNamePrefix("instance-a", "j", 1);
    expect(oneResult).toHaveLength(1);
  });

  it("links a participant to a Neon user id, idempotently", async () => {
    const { FileParticipantRepository } = await import("./participant-repository");
    const repo = new FileParticipantRepository();

    await repo.upsertParticipant("instance-a", baseParticipant);
    await repo.upsertParticipant("instance-a", { ...baseParticipant, id: "p2", displayName: "Jan" });

    await repo.linkNeonUser("instance-a", "p1", "neon-user-1", "2026-04-20T00:00:00.000Z");
    const linked = await repo.findByNeonUserId("instance-a", "neon-user-1");
    expect(linked?.id).toBe("p1");
    expect(linked?.neonUserId).toBe("neon-user-1");

    // Idempotent re-link with the same id is a no-op
    await repo.linkNeonUser("instance-a", "p1", "neon-user-1", "2026-04-20T01:00:00.000Z");
    const still = await repo.findByNeonUserId("instance-a", "neon-user-1");
    expect(still?.id).toBe("p1");

    // Conflict: p2 cannot grab neon-user-1 while p1 owns it
    await repo.linkNeonUser("instance-a", "p2", "neon-user-1", "2026-04-20T02:00:00.000Z");
    const p2 = await repo.findParticipant("instance-a", "p2");
    expect(p2?.neonUserId).toBeNull();
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
