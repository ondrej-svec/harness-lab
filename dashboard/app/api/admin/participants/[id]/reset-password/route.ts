import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getParticipantRepository } from "@/lib/participant-repository";
import { issueResetCode } from "@/lib/participant-reset-codes";

/**
 * POST /api/admin/participants/[id]/reset-password
 *
 * Facilitator-initiated password reset. Issues a one-time 3-word code
 * via the in-memory reset-code store; the participant redeems the code
 * at POST /api/participant/redeem-reset-code with a password of their
 * choice. The code is single-use and expires 15 minutes after issue.
 *
 * The previous flow returned a plaintext "temporaryPassword" in the
 * response body, which meant the participant's credential was captured
 * by browser history and function logs. This flow keeps the facilitator
 * UX identical (read three hyphenated words aloud) while moving the
 * actual password out of the response and letting the participant
 * choose their own.
 *
 * Body (JSON, required): { instanceId }
 *
 * The participant must already have a Neon Auth account linked to
 * their row. For participants who never set a password, the same
 * recovery path applies — the code grants them a one-time window to
 * set a password. (participant-auth.ts:createParticipantAccount
 * handles the pure new-account path.)
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { instanceId?: string };
  const instanceId = body.instanceId?.trim();
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  const repository = getParticipantRepository();
  const participant = await repository.findParticipant(instanceId, id);
  if (!participant || participant.archivedAt !== null) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (participant.neonUserId === null) {
    return NextResponse.json({ ok: false, error: "no_account" }, { status: 409 });
  }

  const issued = issueResetCode({
    participantId: participant.id,
    instanceId,
    neonUserId: participant.neonUserId,
  });

  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "participant_password_reset",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: { participantId: participant.id, flow: "reset_code_issued" },
  });

  return NextResponse.json({
    ok: true,
    participantId: participant.id,
    displayName: participant.displayName,
    resetCode: issued.code,
    resetCodeExpiresAt: issued.expiresAt,
  });
}
