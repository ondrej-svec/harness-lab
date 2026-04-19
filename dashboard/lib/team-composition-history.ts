import { randomUUID } from "node:crypto";
import { getTeamCompositionHistoryRepository } from "./team-composition-history-repository";
import type {
  AssignResult,
  TeamCompositionHistoryActorKind,
  TeamCompositionHistoryEvent,
  TeamMemberRecord,
  UnassignResult,
} from "./runtime-contracts";

type HistoryWriteOptions = {
  actorKind?: TeamCompositionHistoryActorKind;
  note?: string | null;
  rotationId?: string | null;
  capturedAt?: string;
};

async function appendEvent(
  instanceId: string,
  event: Omit<TeamCompositionHistoryEvent, "id" | "instanceId">,
) {
  await getTeamCompositionHistoryRepository().append(instanceId, {
    id: `team-history-${randomUUID()}`,
    instanceId,
    ...event,
  });
}

export async function recordTeamAssignmentHistory(options: {
  instanceId: string;
  participantId: string;
  result: AssignResult;
} & HistoryWriteOptions) {
  const {
    instanceId,
    participantId,
    result,
    actorKind = "facilitator",
    note = null,
    rotationId = null,
    capturedAt = new Date().toISOString(),
  } = options;

  if (!result.changed) {
    return;
  }

  await appendEvent(instanceId, {
    eventType: result.movedFrom ? "moved" : "assigned",
    participantId,
    fromTeamId: result.movedFrom,
    toTeamId: result.teamId,
    capturedAt,
    actorKind,
    note,
    rotationId,
  });
}

export async function recordTeamUnassignmentHistory(options: {
  instanceId: string;
  participantId: string;
  result: UnassignResult;
} & HistoryWriteOptions) {
  const {
    instanceId,
    participantId,
    result,
    actorKind = "facilitator",
    note = null,
    rotationId = null,
    capturedAt = new Date().toISOString(),
  } = options;

  if (!result) {
    return;
  }

  await appendEvent(instanceId, {
    eventType: "unassigned",
    participantId,
    fromTeamId: result.teamId,
    toTeamId: null,
    capturedAt,
    actorKind,
    note,
    rotationId,
  });
}

export async function recordTeamReplacementHistory(
  instanceId: string,
  previousMembers: TeamMemberRecord[],
  nextMembers: TeamMemberRecord[],
  options: HistoryWriteOptions = {},
) {
  const actorKind = options.actorKind ?? "facilitator";
  const note = options.note ?? null;
  const rotationId = options.rotationId ?? null;
  const previousByParticipant = new Map(
    previousMembers.map((member) => [member.participantId, member.teamId]),
  );
  const nextByParticipant = new Map(
    nextMembers.map((member) => [member.participantId, member.teamId]),
  );
  const participantIds = Array.from(
    new Set([...previousByParticipant.keys(), ...nextByParticipant.keys()]),
  ).sort();
  const baseTime = Date.parse(options.capturedAt ?? new Date().toISOString());

  let changeIndex = 0;
  for (const participantId of participantIds) {
    const fromTeamId = previousByParticipant.get(participantId) ?? null;
    const toTeamId = nextByParticipant.get(participantId) ?? null;

    if (fromTeamId === toTeamId) {
      continue;
    }

    const eventType =
      fromTeamId && toTeamId
        ? "moved"
        : fromTeamId
          ? "unassigned"
          : "assigned";

    await appendEvent(instanceId, {
      eventType,
      participantId,
      fromTeamId,
      toTeamId,
      capturedAt: new Date(baseTime + changeIndex).toISOString(),
      actorKind,
      note,
      rotationId,
    });
    changeIndex += 1;
  }
}

export async function appendRotationMarkerHistory(
  instanceId: string,
  options: HistoryWriteOptions = {},
) {
  const rotationId = options.rotationId ?? `rotation-${randomUUID()}`;
  await appendEvent(instanceId, {
    eventType: "rotation_marker",
    participantId: null,
    fromTeamId: null,
    toTeamId: null,
    capturedAt: options.capturedAt ?? new Date().toISOString(),
    actorKind: options.actorKind ?? "facilitator",
    note: options.note ?? null,
    rotationId,
  });

  return rotationId;
}
