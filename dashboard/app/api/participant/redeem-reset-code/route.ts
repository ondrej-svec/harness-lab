import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { admin as proxyAdmin } from "@/lib/auth/neon-auth-proxy";
import { setParticipantPasswordViaResetToken } from "@/lib/auth/server-set-password";
import { consumeResetCode } from "@/lib/participant-reset-codes";
import { isTrustedOrigin, untrustedOriginResponse } from "@/lib/request-integrity";

/**
 * POST /api/participant/redeem-reset-code
 *
 * Participant-side counterpart to the facilitator-issued reset code.
 * The participant enters the 3-word code read aloud by the facilitator
 * together with a password of their choice. The code is:
 *   - single-use (consumed on success)
 *   - scoped to one participant + instance + Neon Auth user
 *   - valid for 15 minutes from issue
 *
 * The endpoint sets the participant's Neon Auth password to the
 * submitted value — they then sign in normally with that password on
 * the next request. No session cookie is issued here; the existing
 * sign-in path handles that.
 *
 * No session cookie is required to redeem; the code IS the authorisation.
 * Origin check + input validation + the code's short TTL + single-use
 * semantics are the defense against abuse. Weak passwords are rejected
 * before the code is consumed so a typo doesn't burn a reset attempt.
 *
 * Body: { code: string, newPassword: string }
 *
 * Responses:
 *   200 { ok: true, participantId, instanceId }
 *   400 { ok: false, error: "weak_password" | "invalid_body" }
 *   401 { ok: false, error: "unknown" | "expired" }
 *   500 { ok: false, error: "reset_failed" | "unavailable" }
 */
export async function POST(request: Request) {
  if (
    !isTrustedOrigin({
      originHeader: request.headers.get("origin"),
      hostHeader: request.headers.get("host"),
      forwardedHostHeader: request.headers.get("x-forwarded-host"),
      requestUrl: request.url,
    })
  ) {
    return untrustedOriginResponse();
  }

  const body = (await request.json().catch(() => ({}))) as {
    code?: unknown;
    newPassword?: unknown;
  };
  const code = typeof body.code === "string" ? body.code : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (code.length === 0) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, error: "weak_password" }, { status: 400 });
  }

  const consumed = consumeResetCode(code);
  if (!consumed.ok) {
    // No audit row for unknown/expired — these are transient participant
    // errors (typo, late entry) and logging every rejected attempt would
    // be noisy. The admin path already logged the issue event.
    return NextResponse.json({ ok: false, error: consumed.reason }, { status: 401 });
  }

  const passwordSet = await setParticipantPasswordViaResetToken({
    neonUserId: consumed.neonUserId,
    newPassword,
  });

  if (!passwordSet.ok) {
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId: consumed.instanceId,
      actorKind: "participant",
      action: "participant_password_reset_redeem",
      result: "failure",
      createdAt: new Date().toISOString(),
      metadata: { reason: passwordSet.reason, participantId: consumed.participantId },
    });
    if (passwordSet.reason === "weak_password") {
      return NextResponse.json({ ok: false, error: "weak_password" }, { status: 400 });
    }
    if (passwordSet.reason === "missing_neon_auth") {
      return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: "reset_failed" }, { status: 500 });
  }

  // Best-effort session revoke. Mirrors the old admin reset flow —
  // kills any stale session on another tab/device so an attacker with
  // the old password can't continue past the reset. If this fails, the
  // password was still rotated, so the stale session expires naturally.
  await proxyAdmin.revokeUserSessions({ userId: consumed.neonUserId }).catch(() => {});

  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId: consumed.instanceId,
    actorKind: "participant",
    action: "participant_password_reset_redeem",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: { participantId: consumed.participantId },
  });

  return NextResponse.json({
    ok: true,
    participantId: consumed.participantId,
    instanceId: consumed.instanceId,
  });
}
