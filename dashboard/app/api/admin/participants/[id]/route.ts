import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getCurrentWorkshopInstanceId } from "@/lib/instance-context";
import { getParticipantRepository } from "@/lib/participant-repository";
import { getTeamMemberRepository } from "@/lib/team-member-repository";
import { rebuildTeamMembersProjection } from "@/lib/team-members-projection";

type UpdateBody = {
  instanceId?: string;
  displayName?: string | null;
  email?: string | null;
  emailOptIn?: boolean;
  tag?: string | null;
};

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as UpdateBody;
  const instanceId = body.instanceId ?? getCurrentWorkshopInstanceId();

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  const repository = getParticipantRepository();
  const existing = await repository.findParticipant(instanceId, id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const next = { ...existing };
  if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string" || body.displayName.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "empty_display_name" }, { status: 400 });
    }
    next.displayName = body.displayName.trim();
  }
  if (body.email !== undefined) {
    if (body.email === null) {
      next.email = null;
      // Clearing the email forces consent off — an opted-in flag with no
      // address is meaningless state.
      next.emailOptIn = false;
    } else if (typeof body.email === "string") {
      const trimmed = body.email.trim();
      if (!EMAIL_SHAPE.test(trimmed)) {
        return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
      }
      next.email = trimmed;
    }
  }
  if (body.emailOptIn !== undefined) {
    if (body.emailOptIn === true && !next.email) {
      return NextResponse.json(
        { ok: false, error: "email_opt_in_without_email" },
        { status: 409 },
      );
    }
    next.emailOptIn = Boolean(body.emailOptIn);
  }
  if (body.tag !== undefined) {
    next.tag = body.tag === null ? null : String(body.tag).trim() || null;
  }

  next.updatedAt = new Date().toISOString();

  await repository.upsertParticipant(instanceId, next);

  // Display-name change affects the denormalized projection on teams.
  if (next.displayName !== existing.displayName) {
    await rebuildTeamMembersProjection(instanceId);
  }

  return NextResponse.json({
    ok: true,
    participant: {
      id: next.id,
      displayName: next.displayName,
      email: next.email,
      emailOptIn: next.emailOptIn,
      tag: next.tag,
      archivedAt: next.archivedAt,
    },
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const instanceId =
    url.searchParams.get("instanceId") ?? getCurrentWorkshopInstanceId();

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  const participants = getParticipantRepository();
  const existing = await participants.findParticipant(instanceId, id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  await participants.archiveParticipant(instanceId, id, now);

  // Cascade: unassign from current team if any.
  const teamMembers = getTeamMemberRepository();
  const current = await teamMembers.findMemberByParticipant(instanceId, id);
  if (current) {
    await teamMembers.unassignMember(instanceId, id);
    await rebuildTeamMembersProjection(instanceId);
  }

  return NextResponse.json({ ok: true });
}
