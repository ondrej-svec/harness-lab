import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getCurrentWorkshopInstanceId } from "@/lib/instance-context";
import { getParticipantRepository } from "@/lib/participant-repository";
import { getTeamMemberRepository } from "@/lib/team-member-repository";
import { getTeamRepository } from "@/lib/team-repository";
import {
  computeRandomize,
  issueCommitToken,
  verifyCommitToken,
  type RandomizeStrategy,
} from "@/lib/team-randomize";
import { rebuildTeamMembersProjection } from "@/lib/team-members-projection";
import type { TeamMemberRecord } from "@/lib/runtime-contracts";

type RandomizeBody = {
  instanceId?: string;
  teamCount?: number;
  strategy?: RandomizeStrategy;
  preview?: boolean;
  commitToken?: string;
};

/**
 * POST /api/admin/team-formation/randomize
 *
 * Two-step flow:
 *   1. `{ teamCount, strategy, preview: true }` → returns distribution
 *      + commit_token. Nothing is written.
 *   2. `{ commitToken }` → verifies the signed token and applies the
 *      assignments recorded in it. Token expires after 60 seconds.
 *
 * A single request with neither `preview: true` nor `commitToken` computes
 * the preview and commits it directly — useful for TTY/CLI confirm flows.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RandomizeBody;
  const instanceId = body.instanceId ?? getCurrentWorkshopInstanceId();

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  // Commit path
  if (body.commitToken) {
    const payload = verifyCommitToken(body.commitToken, instanceId);
    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "invalid_or_expired_commit_token" },
        { status: 400 },
      );
    }

    await applyAssignments(instanceId, payload.assignments);
    await rebuildTeamMembersProjection(instanceId);

    return NextResponse.json({
      ok: true,
      committed: true,
      count: payload.assignments.length,
    });
  }

  // Preview / direct-commit path
  const teamCount = Number(body.teamCount ?? 0);
  if (!Number.isInteger(teamCount) || teamCount < 2 || teamCount > 12) {
    return NextResponse.json({ ok: false, error: "team_count_invalid" }, { status: 400 });
  }

  const participants = await getParticipantRepository().listParticipants(instanceId);
  if (participants.length === 0) {
    return NextResponse.json({ ok: false, error: "no_participants" }, { status: 400 });
  }

  // Use existing teams when available; otherwise synthesize team IDs that
  // the facilitator will need to create before committing.
  const existingTeams = await getTeamRepository().listTeams(instanceId);
  const teamIds = existingTeams.slice(0, teamCount).map((t) => t.id);
  while (teamIds.length < teamCount) {
    teamIds.push(`team-draft-${teamIds.length + 1}`);
  }

  const preview = computeRandomize(participants, teamIds, body.strategy ?? "cross-level");

  if (body.preview) {
    return NextResponse.json({
      ok: true,
      preview: true,
      teamIds: preview.teamIds,
      assignments: preview.assignments,
      tagDistribution: preview.tagDistribution,
      commitToken: issueCommitToken(instanceId, preview.assignments),
    });
  }

  // No preview flag and no token — the caller wants direct commit.
  await applyAssignments(instanceId, preview.assignments);
  await rebuildTeamMembersProjection(instanceId);

  return NextResponse.json({
    ok: true,
    committed: true,
    teamIds: preview.teamIds,
    assignments: preview.assignments,
    tagDistribution: preview.tagDistribution,
  });
}

async function applyAssignments(
  instanceId: string,
  assignments: Array<{ participantId: string; teamId: string }>,
): Promise<void> {
  const now = new Date().toISOString();
  const members = getTeamMemberRepository();
  const records: TeamMemberRecord[] = assignments.map((a, i) => ({
    id: `tm-${randomUUID()}`,
    instanceId,
    teamId: a.teamId,
    participantId: a.participantId,
    // Increment milliseconds so the assigned_at order mirrors the input,
    // which in turn drives the denormalized member-projection order.
    assignedAt: new Date(Date.parse(now) + i).toISOString(),
  }));
  await members.replaceMembers(instanceId, records);
}
