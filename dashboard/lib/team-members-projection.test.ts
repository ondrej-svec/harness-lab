import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { ParticipantRecord, TeamMemberRecord, TeamRecord } from "./runtime-contracts";

function makeTeam(overrides: Partial<TeamRecord> = {}): TeamRecord {
  return {
    id: "t1",
    name: "Team One",
    city: "Studio A",
    members: [],
    repoUrl: "https://example.com/repo",
    projectBriefId: "brief-1",
    checkIns: [],
    anchor: null,
    ...overrides,
  };
}

function makeParticipant(overrides: Partial<ParticipantRecord> = {}): ParticipantRecord {
  return {
    id: "p1",
    instanceId: "instance-a",
    displayName: "Ada Lovelace",
    email: null,
    emailOptIn: false,
    tag: null,
    neonUserId: null,
    createdAt: "2026-04-16T10:00:00.000Z",
    updatedAt: "2026-04-16T10:00:00.000Z",
    archivedAt: null,
    ...overrides,
  };
}

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

describe("team-members-projection", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-proj-"));
    process.env.HARNESS_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    await rm(tempDir, { recursive: true, force: true });
    const teamMod = await import("./team-repository");
    teamMod.setTeamRepositoryForTests(null);
    const pMod = await import("./participant-repository");
    pMod.setParticipantRepositoryForTests(null);
    const tmMod = await import("./team-member-repository");
    tmMod.setTeamMemberRepositoryForTests(null);
  });

  it("rebuilds teams.payload.members from the join, preserving assigned_at order", async () => {
    const { FileTeamRepository } = await import("./team-repository");
    const { FileParticipantRepository } = await import("./participant-repository");
    const { FileTeamMemberRepository } = await import("./team-member-repository");
    const { rebuildTeamMembersProjection } = await import("./team-members-projection");

    const teams = new FileTeamRepository();
    const participants = new FileParticipantRepository();
    const members = new FileTeamMemberRepository();

    // Seed: one team with a stale "members" list, two real participants on it.
    await teams.upsertTeam("instance-a", makeTeam({ members: ["Stale", "Old"] }));
    await participants.upsertParticipant("instance-a", makeParticipant({ id: "p1", displayName: "Ada" }));
    await participants.upsertParticipant(
      "instance-a",
      makeParticipant({ id: "p2", displayName: "Linus" }),
    );
    await members.assignMember("instance-a", makeMember({ id: "tm1", participantId: "p1", assignedAt: "2026-04-16T10:00:00.000Z" }));
    await members.assignMember(
      "instance-a",
      makeMember({ id: "tm2", participantId: "p2", assignedAt: "2026-04-16T10:05:00.000Z" }),
    );

    await rebuildTeamMembersProjection("instance-a");

    const [updated] = await teams.listTeams("instance-a");
    expect(updated.members).toEqual(["Ada", "Linus"]);
  });

  it("detects drift when a write path skips the rebuild", async () => {
    const { FileTeamRepository } = await import("./team-repository");
    const { FileParticipantRepository } = await import("./participant-repository");
    const { FileTeamMemberRepository } = await import("./team-member-repository");
    const { detectTeamMembersProjectionDrift } = await import("./team-members-projection");

    const teams = new FileTeamRepository();
    const participants = new FileParticipantRepository();
    const members = new FileTeamMemberRepository();

    await teams.upsertTeam("instance-a", makeTeam({ members: ["Ada"] }));
    await participants.upsertParticipant("instance-a", makeParticipant({ id: "p1", displayName: "Ada" }));
    // No team_members row written — the projection says "Ada" but the source says "nobody"
    const drift = await detectTeamMembersProjectionDrift("instance-a");
    expect(drift).toEqual([{ teamId: "t1", expected: [], actual: ["Ada"] }]);

    // Add the missing row; drift clears after rebuild
    await members.assignMember("instance-a", makeMember({ id: "tm1", participantId: "p1" }));
    const { rebuildTeamMembersProjection } = await import("./team-members-projection");
    await rebuildTeamMembersProjection("instance-a");
    await expect(detectTeamMembersProjectionDrift("instance-a")).resolves.toEqual([]);
  });

  it("tolerates orphaned team_members rows (participant deleted out-of-band)", async () => {
    const { FileTeamRepository } = await import("./team-repository");
    const { FileTeamMemberRepository } = await import("./team-member-repository");
    const { rebuildTeamMembersProjection } = await import("./team-members-projection");

    const teams = new FileTeamRepository();
    const members = new FileTeamMemberRepository();

    await teams.upsertTeam("instance-a", makeTeam({ members: ["Old"] }));
    // Team member references participant p-ghost which has no participants.json row
    await members.assignMember(
      "instance-a",
      makeMember({ id: "tm1", participantId: "p-ghost" }),
    );

    await expect(rebuildTeamMembersProjection("instance-a")).resolves.toBeUndefined();
    const [updated] = await teams.listTeams("instance-a");
    expect(updated.members).toEqual([]); // orphaned row silently skipped
  });
});
