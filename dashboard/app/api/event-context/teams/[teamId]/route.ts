import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import {
  isParticipantTeamAccessError,
  isTeamModeEnabled,
  requireParticipantTeamAccess,
} from "@/lib/participant-team-access";
import { normalizeTeamRepoUrl } from "@/lib/team-repo-url";
import { updateTeamFromParticipant, isWorkshopStateTargetError } from "@/lib/workshop-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const { teamId } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
  }

  const patch: { name?: string; repoUrl?: string; members?: string[] } = {};

  if ("name" in body) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "name must be a non-empty string" }, { status: 400 });
    }
    patch.name = body.name.trim();
  }

  if ("repoUrl" in body) {
    if (typeof body.repoUrl !== "string") {
      return NextResponse.json({ ok: false, error: "repoUrl must be a string" }, { status: 400 });
    }
    const repoUrl = normalizeTeamRepoUrl(body.repoUrl);
    if (!repoUrl.ok) {
      return NextResponse.json({ ok: false, error: repoUrl.error }, { status: 400 });
    }
    patch.repoUrl = repoUrl.value;
  }

  if ("members" in body) {
    if (!Array.isArray(body.members) || !body.members.every((m: unknown) => typeof m === "string")) {
      return NextResponse.json({ ok: false, error: "members must be an array of strings" }, { status: 400 });
    }
    patch.members = body.members.map((m: string) => m.trim()).filter(Boolean);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "no valid fields to update" }, { status: 400 });
  }

  // Team metadata edits are a team-mode-only surface. In participant
  // mode there's no team to edit; return 404 rather than a confusing
  // 403 that would suggest the participant lacks a membership row.
  if (!(await isTeamModeEnabled(access.session.instanceId))) {
    return NextResponse.json({ ok: false, error: "team_mode_disabled" }, { status: 404 });
  }

  try {
    await requireParticipantTeamAccess({
      instanceId: access.session.instanceId,
      participantId: access.session.participantId,
      teamId,
    });
    await updateTeamFromParticipant(teamId, patch, access.session.instanceId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isParticipantTeamAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    if (isWorkshopStateTargetError(error)) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    throw error;
  }
}
