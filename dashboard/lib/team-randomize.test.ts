import { describe, expect, it } from "vitest";
import {
  computeRandomize,
  issueCommitToken,
  verifyCommitToken,
} from "./team-randomize";
import type { ParticipantRecord } from "./runtime-contracts";

function p(id: string, tag: string | null): ParticipantRecord {
  return {
    id,
    instanceId: "i1",
    displayName: id,
    email: null,
    emailOptIn: false,
    tag,
    createdAt: "2026-04-16T00:00:00.000Z",
    updatedAt: "2026-04-16T00:00:00.000Z",
    archivedAt: null,
  };
}

describe("computeRandomize", () => {
  it("distributes evenly across teams in cross-level mode", () => {
    const participants = [
      p("a", "senior"), p("b", "senior"),
      p("c", "mid"), p("d", "mid"),
      p("e", "junior"), p("f", "junior"),
    ];
    const result = computeRandomize(participants, ["t1", "t2"], "cross-level", 42);

    expect(result.assignments).toHaveLength(6);
    const counts = { t1: 0, t2: 0 };
    for (const a of result.assignments) {
      counts[a.teamId as "t1" | "t2"] += 1;
    }
    expect(counts).toEqual({ t1: 3, t2: 3 });
  });

  it("produces a tag distribution that reflects the assignments", () => {
    const participants = [
      p("a", "senior"), p("b", "senior"), p("c", "senior"),
      p("d", "junior"), p("e", "junior"), p("f", "junior"),
    ];
    const result = computeRandomize(participants, ["t1", "t2", "t3"], "cross-level", 1);
    // Three tags of each rank, three teams — each team should get one senior and one junior
    for (const teamId of ["t1", "t2", "t3"]) {
      expect(result.tagDistribution[teamId].senior).toBe(1);
      expect(result.tagDistribution[teamId].junior).toBe(1);
    }
  });

  it("handles untagged participants by grouping them under 'untagged'", () => {
    const result = computeRandomize(
      [p("a", "senior"), p("b", null), p("c", "")],
      ["t1", "t2"],
      "cross-level",
      1,
    );
    const totalUntagged =
      (result.tagDistribution.t1.untagged ?? 0) + (result.tagDistribution.t2.untagged ?? 0);
    expect(totalUntagged).toBe(2);
  });

  it("returns empty result when no teams are provided", () => {
    const result = computeRandomize([p("a", null)], [], "cross-level", 1);
    expect(result.assignments).toEqual([]);
  });
});

describe("commit tokens", () => {
  it("round-trips a valid token", () => {
    const token = issueCommitToken("i1", [{ participantId: "a", teamId: "t1" }]);
    const payload = verifyCommitToken(token, "i1");
    expect(payload).not.toBeNull();
    expect(payload?.assignments).toEqual([{ participantId: "a", teamId: "t1" }]);
  });

  it("rejects a token signed for a different instance", () => {
    const token = issueCommitToken("i1", []);
    expect(verifyCommitToken(token, "i2")).toBeNull();
  });

  it("rejects a tampered token", () => {
    const token = issueCommitToken("i1", []);
    const tampered = token.slice(0, -2) + "zz";
    expect(verifyCommitToken(tampered, "i1")).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyCommitToken("garbage", "i1")).toBeNull();
    expect(verifyCommitToken("a.b.c", "i1")).toBeNull();
  });
});
