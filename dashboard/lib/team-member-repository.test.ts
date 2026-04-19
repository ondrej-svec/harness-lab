import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { TeamMemberRecord } from "./runtime-contracts";

function makeMember(overrides: Partial<TeamMemberRecord> = {}): TeamMemberRecord {
  return {
    id: "tm1",
    instanceId: "instance-a",
    teamId: "t1",
    participantId: "p1",
    assignedAt: "2026-04-16T10:00:00.000Z",
    ...overrides,
  };
}

describe("team-member-repository — file mode", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-tm-"));
    process.env.HARNESS_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./team-member-repository");
    mod.setTeamMemberRepositoryForTests(null);
  });

  it("assigns fresh, moves between teams, and is idempotent on same team", async () => {
    const { FileTeamMemberRepository } = await import("./team-member-repository");
    const repo = new FileTeamMemberRepository();

    // Fresh assign
    const first = await repo.assignMember("instance-a", makeMember());
    expect(first).toEqual({ teamId: "t1", movedFrom: null, changed: true });
    await expect(repo.listMembers("instance-a")).resolves.toHaveLength(1);

    // Same team, same participant — idempotent, no move
    const idem = await repo.assignMember("instance-a", makeMember());
    expect(idem).toEqual({ teamId: "t1", movedFrom: null, changed: false });
    await expect(repo.listMembers("instance-a")).resolves.toHaveLength(1);

    // Move to a different team — records movedFrom
    const moved = await repo.assignMember(
      "instance-a",
      makeMember({ id: "tm2", teamId: "t2", assignedAt: "2026-04-16T11:00:00.000Z" }),
    );
    expect(moved).toEqual({ teamId: "t2", movedFrom: "t1", changed: true });

    // UNIQUE(participant_id) enforced: still only one row after move
    await expect(repo.listMembers("instance-a")).resolves.toHaveLength(1);
    await expect(repo.findMemberByParticipant("instance-a", "p1")).resolves.toEqual(
      expect.objectContaining({ teamId: "t2" }),
    );
  });

  it("lists by team, unassigns idempotently", async () => {
    const { FileTeamMemberRepository } = await import("./team-member-repository");
    const repo = new FileTeamMemberRepository();

    await repo.assignMember("instance-a", makeMember());
    await repo.assignMember(
      "instance-a",
      makeMember({ id: "tm2", participantId: "p2", teamId: "t1" }),
    );
    await repo.assignMember(
      "instance-a",
      makeMember({ id: "tm3", participantId: "p3", teamId: "t2" }),
    );

    await expect(repo.listMembersByTeam("instance-a", "t1")).resolves.toHaveLength(2);
    await expect(repo.listMembersByTeam("instance-a", "t2")).resolves.toHaveLength(1);

    await repo.unassignMember("instance-a", "p2");
    await expect(repo.listMembersByTeam("instance-a", "t1")).resolves.toHaveLength(1);

    // Idempotent — unassigning an already-unassigned participant is a no-op
    await repo.unassignMember("instance-a", "p2");
    await expect(repo.listMembersByTeam("instance-a", "t1")).resolves.toHaveLength(1);
  });
});

describe("team-member-repository — neon mode", () => {
  it("issues the expected queries for assign-fresh, assign-move, unassign", async () => {
    // Track all query calls across three separate repository operations.
    const query = vi
      .fn()
      // assignMember fresh: SELECT existing (none), INSERT
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined)
      // assignMember move: SELECT existing (t1), DELETE old, INSERT new
      .mockResolvedValueOnce([{ team_id: "t1" }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      // unassignMember: SELECT existing, DELETE
      .mockResolvedValueOnce([{ team_id: "t2" }])
      .mockResolvedValueOnce(undefined);

    vi.resetModules();
    vi.doMock("./runtime-storage", () => ({ getRuntimeStorageMode: () => "neon" }));
    vi.doMock("./neon-db", () => ({ getNeonSql: () => ({ query }) }));

    const mod = await import("./team-member-repository");
    const repo = mod.getTeamMemberRepository();

    const fresh = await repo.assignMember("instance-a", makeMember());
    expect(fresh).toEqual({ teamId: "t1", movedFrom: null, changed: true });

    const moved = await repo.assignMember(
      "instance-a",
      makeMember({ id: "tm2", teamId: "t2" }),
    );
    expect(moved).toEqual({ teamId: "t2", movedFrom: "t1", changed: true });

    await repo.unassignMember("instance-a", "p1");

    expect(query).toHaveBeenCalledTimes(7);
    // Fresh assign: just SELECT + INSERT, no DELETE
    expect(query.mock.calls[0][0]).toMatch(/SELECT team_id/);
    expect(query.mock.calls[1][0]).toMatch(/INSERT INTO team_members/);
    // Move: SELECT, DELETE, INSERT
    expect(query.mock.calls[2][0]).toMatch(/SELECT team_id/);
    expect(query.mock.calls[3][0]).toMatch(/DELETE FROM team_members/);
    expect(query.mock.calls[4][0]).toMatch(/INSERT INTO team_members/);
    // Unassign: SELECT existing, then DELETE
    expect(query.mock.calls[5][0]).toMatch(/SELECT team_id/);
    expect(query.mock.calls[6][0]).toMatch(/DELETE FROM team_members/);

    mod.setTeamMemberRepositoryForTests(null);
  });
});
