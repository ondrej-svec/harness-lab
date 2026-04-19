import { afterEach, describe, expect, it } from "vitest";
import type {
  TeamCompositionHistoryEvent,
  TeamCompositionHistoryRepository,
  TeamMemberRecord,
} from "./runtime-contracts";
import { setTeamCompositionHistoryRepositoryForTests } from "./team-composition-history-repository";
import {
  appendRotationMarkerHistory,
  recordTeamAssignmentHistory,
  recordTeamReplacementHistory,
  recordTeamUnassignmentHistory,
} from "./team-composition-history";

function makeMember(
  participantId: string,
  teamId: string,
  assignedAt = "2026-04-19T10:00:00.000Z",
): TeamMemberRecord {
  return {
    id: `tm-${participantId}`,
    instanceId: "instance-a",
    participantId,
    teamId,
    assignedAt,
  };
}

describe("team-composition-history helpers", () => {
  const events: TeamCompositionHistoryEvent[] = [];
  const repository: TeamCompositionHistoryRepository = {
    async list() {
      return [...events];
    },
    async append(_instanceId, event) {
      events.push(event);
    },
  };

  afterEach(() => {
    events.length = 0;
    setTeamCompositionHistoryRepositoryForTests(null);
  });

  it("records assign, unassign, replacement, and rotation marker events with the expected types", async () => {
    setTeamCompositionHistoryRepositoryForTests(repository);

    await recordTeamAssignmentHistory({
      instanceId: "instance-a",
      participantId: "p1",
      result: { teamId: "t1", movedFrom: null, changed: true },
    });
    await recordTeamAssignmentHistory({
      instanceId: "instance-a",
      participantId: "p1",
      result: { teamId: "t1", movedFrom: null, changed: false },
    });
    await recordTeamUnassignmentHistory({
      instanceId: "instance-a",
      participantId: "p1",
      result: { teamId: "t1" },
    });
    await recordTeamReplacementHistory(
      "instance-a",
      [makeMember("p1", "t1"), makeMember("p2", "t2")],
      [makeMember("p1", "t3"), makeMember("p3", "t2")],
      { capturedAt: "2026-04-19T12:00:00.000Z", note: "reshuffle" },
    );
    const rotationId = await appendRotationMarkerHistory("instance-a", {
      note: "Rotation 2",
    });

    expect(events.map((event) => event.eventType)).toEqual([
      "assigned",
      "unassigned",
      "moved",
      "unassigned",
      "assigned",
      "rotation_marker",
    ]);
    expect(events[2]).toMatchObject({
      participantId: "p1",
      fromTeamId: "t1",
      toTeamId: "t3",
      note: "reshuffle",
    });
    expect(events[5]).toMatchObject({
      eventType: "rotation_marker",
      note: "Rotation 2",
      rotationId,
    });
  });
});
