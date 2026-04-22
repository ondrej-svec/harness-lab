import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { deleteParticipantAndLinkedData } from "@/lib/participant-data-deletion";
import { getParticipantRepository } from "@/lib/participant-repository";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";
import { recordTeamUnassignmentHistory } from "@/lib/team-composition-history";
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
  const instanceId = body.instanceId?.trim();
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
  }

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

type DeleteBody = {
  instanceId?: string;
  confirm?: boolean;
  confirmDisplayName?: string;
};

// DELETE is overloaded by payload:
//   - `{instanceId}` (or no body) → soft-archive, reversible. Default.
//   - `{instanceId, confirm: true, confirmDisplayName: "..."}` → GDPR Art. 17
//     hard-delete. Every row with a participant_id FK gets hard-deleted
//     and the Neon Auth user is removed (or PII-stripped on unsupported).
//     The confirmDisplayName must match the participant's current display
//     name — guards against mistyped IDs in the admin UI.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as DeleteBody;
  const instanceId =
    body.instanceId?.trim() || url.searchParams.get("instanceId")?.trim() || undefined;
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  const participants = getParticipantRepository();
  const existing = await participants.findParticipant(instanceId, id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (body.confirm === true) {
    if (getRuntimeStorageMode() !== "neon") {
      return NextResponse.json(
        { ok: false, error: "gdpr_delete_requires_neon_mode" },
        { status: 400 },
      );
    }
    if (typeof body.confirmDisplayName !== "string") {
      return NextResponse.json(
        { ok: false, error: "confirmDisplayName is required for hard delete" },
        { status: 400 },
      );
    }
    if (body.confirmDisplayName.trim() !== existing.displayName) {
      return NextResponse.json(
        { ok: false, error: "confirmation_mismatch" },
        { status: 409 },
      );
    }

    // Audit log the pre-delete snapshot before the rows disappear. The
    // snapshot survives the delete so compliance can verify the action.
    const preDeleteSnapshot = {
      id: existing.id,
      displayName: existing.displayName,
      email: existing.email,
      tag: existing.tag,
      emailOptIn: String(existing.emailOptIn),
      neonUserId: existing.neonUserId,
      createdAt: existing.createdAt,
      archivedAt: existing.archivedAt,
    };

    const result = await deleteParticipantAndLinkedData(id, instanceId);

    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId,
      actorKind: "facilitator",
      action: "participant.gdpr_delete",
      result: "success",
      createdAt: new Date().toISOString(),
      metadata: {
        participantId: id,
        displayName: preDeleteSnapshot.displayName,
        email: preDeleteSnapshot.email,
        neonUserId: preDeleteSnapshot.neonUserId,
        neonAuthUserMethod: result.neonAuthUser?.ok ? result.neonAuthUser.method : "none",
        deletedRowsTotal: Object.values(result.deletedRowsByTable).reduce((a, b) => a + b, 0),
      },
    });

    return NextResponse.json({
      ok: true,
      mode: "gdpr_delete",
      deletedRowsByTable: result.deletedRowsByTable,
      neonAuthUser: result.neonAuthUser,
    });
  }

  const now = new Date().toISOString();
  await participants.archiveParticipant(instanceId, id, now);

  // Cascade: unassign from current team if any.
  const teamMembers = getTeamMemberRepository();
  const result = await teamMembers.unassignMember(instanceId, id);
  if (result) {
    await recordTeamUnassignmentHistory({
      instanceId,
      participantId: id,
      result,
      note: "participant archived",
    });
    await rebuildTeamMembersProjection(instanceId);
  }

  return NextResponse.json({ ok: true, mode: "archive" });
}
