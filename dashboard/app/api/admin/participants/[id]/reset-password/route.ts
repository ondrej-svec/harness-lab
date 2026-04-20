import { randomInt, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getCurrentWorkshopInstanceId } from "@/lib/instance-context";
import { getParticipantRepository } from "@/lib/participant-repository";
import { resetParticipantPasswordAsAdmin } from "@/lib/participant-auth";

/**
 * POST /api/admin/participants/[id]/reset-password
 *
 * Facilitator-initiated password reset. Generates a 3-word temporary
 * password (same wordlist feel as event codes), rotates the Neon Auth
 * password inside the facilitator's live admin session, revokes the
 * participant's existing sessions, and returns the plaintext code
 * exactly once for the facilitator to read aloud.
 *
 * Body (JSON, optional): { instanceId? }
 *
 * The participant must already have a Neon Auth account linked to their
 * row. For participants who never set a password, this returns 404 —
 * the right flow for them is to have them visit /participant and set
 * one directly.
 */
const resetWord1 = [
  "amber", "branch", "circuit", "ember", "harbor", "lantern",
  "matrix", "orbit", "relay", "signal", "sprint", "vector",
] as const;

const resetWord2 = [
  "agenda", "bridge", "canvas", "checkpoint", "context", "handoff",
  "moment", "repo", "review", "rotation", "runner", "trace",
] as const;

const resetWord3 = [
  "delta", "focus", "link", "north", "orbit", "room",
  "shift", "signal", "stack", "studio", "switch", "window",
] as const;

function generateResetPassword(): string {
  return [
    `${resetWord1[randomInt(resetWord1.length)]}${randomInt(1, 10)}`,
    `${resetWord2[randomInt(resetWord2.length)]}${randomInt(1, 10)}`,
    `${resetWord3[randomInt(resetWord3.length)]}${randomInt(1, 10)}`,
  ].join("-");
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { instanceId?: string };
  const instanceId = body.instanceId ?? getCurrentWorkshopInstanceId();

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

  const newPassword = generateResetPassword();
  const result = await resetParticipantPasswordAsAdmin({
    neonUserId: participant.neonUserId,
    newPassword,
  });

  if (!result.ok) {
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId,
      actorKind: "facilitator",
      action: "participant_password_reset",
      result: "failure",
      createdAt: new Date().toISOString(),
      metadata: { reason: result.reason, participantId: participant.id },
    });
    const status = result.reason === "not_admin" ? 403 : result.reason === "not_found" ? 404 : 500;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }

  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "participant_password_reset",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: { participantId: participant.id },
  });

  return NextResponse.json({
    ok: true,
    participantId: participant.id,
    displayName: participant.displayName,
    temporaryPassword: newPassword,
  });
}
