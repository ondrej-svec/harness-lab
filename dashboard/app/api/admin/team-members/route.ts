import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getCurrentWorkshopInstanceId } from "@/lib/instance-context";
import { getParticipantRepository } from "@/lib/participant-repository";
import {
  recordTeamAssignmentHistory,
  recordTeamUnassignmentHistory,
} from "@/lib/team-composition-history";
import { getTeamMemberRepository } from "@/lib/team-member-repository";
import { getTeamRepository } from "@/lib/team-repository";
import { rebuildTeamMembersProjection } from "@/lib/team-members-projection";

type AssignBody = {
  instanceId?: string;
  participantId?: string;
  teamId?: string;
};

/**
 * POST and PUT share a handler — both are assign-or-move. The separate
 * HTTP verbs are a convention from the API sketch: POST for "first assign,"
 * PUT for "assign or move." The repository's `assignMember` is already
 * idempotent and move-aware, so the two handlers are literally the same.
 */
async function handleAssign(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AssignBody;
  const instanceId = body.instanceId ?? getCurrentWorkshopInstanceId();

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  if (!body.participantId || !body.teamId) {
    return NextResponse.json(
      { ok: false, error: "participantId and teamId are required" },
      { status: 400 },
    );
  }

  // Validate the participant exists and isn't archived.
  const participant = await getParticipantRepository().findParticipant(instanceId, body.participantId);
  if (!participant || participant.archivedAt) {
    return NextResponse.json({ ok: false, error: "participant_not_found" }, { status: 404 });
  }

  // Validate the team exists and belongs to the instance.
  const teams = await getTeamRepository().listTeams(instanceId);
  const team = teams.find((t) => t.id === body.teamId);
  if (!team) {
    return NextResponse.json({ ok: false, error: "team_not_in_instance" }, { status: 404 });
  }

  const result = await getTeamMemberRepository().assignMember(instanceId, {
    id: `tm-${randomUUID()}`,
    instanceId,
    teamId: body.teamId,
    participantId: body.participantId,
    assignedAt: new Date().toISOString(),
  });
  await recordTeamAssignmentHistory({
    instanceId,
    participantId: body.participantId,
    result,
  });

  await rebuildTeamMembersProjection(instanceId);

  return NextResponse.json({
    ok: true,
    teamId: result.teamId,
    participantId: body.participantId,
    movedFrom: result.movedFrom,
  });
}

export const POST = handleAssign;
export const PUT = handleAssign;

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    instanceId?: string;
    participantId?: string;
  };
  const instanceId = body.instanceId ?? getCurrentWorkshopInstanceId();

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  if (!body.participantId) {
    return NextResponse.json({ ok: false, error: "participantId is required" }, { status: 400 });
  }

  const result = await getTeamMemberRepository().unassignMember(
    instanceId,
    body.participantId,
  );
  await recordTeamUnassignmentHistory({
    instanceId,
    participantId: body.participantId,
    result,
  });
  await rebuildTeamMembersProjection(instanceId);

  return NextResponse.json({ ok: true });
}
