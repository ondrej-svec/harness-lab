import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import {
  bindParticipantIdToSession,
  getParticipantSessionWithTokenHash,
  participantSessionCookieName,
} from "@/lib/event-access";
import { authenticateParticipant } from "@/lib/participant-auth";
import { getParticipantRepository } from "@/lib/participant-repository";
import { isTrustedOrigin, untrustedOriginResponse } from "@/lib/request-integrity";

/**
 * POST /api/event-access/identify/authenticate
 *
 * Returning-participant path. Caller picked their roster row (already
 * linked to a Neon Auth user) and is submitting their password. On
 * success: Neon Auth issues the session cookie as a side effect, we
 * bind the event-code session to the participant row, and emit a
 * success audit event.
 *
 * Body (JSON): { participantId, password }
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

  const rawCookie = request.headers.get("cookie") ?? "";
  const token = readCookieValue(rawCookie, participantSessionCookieName);
  const bundle = await getParticipantSessionWithTokenHash(token);
  if (!bundle) {
    return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    participantId?: unknown;
    password?: unknown;
  };
  const participantId = typeof body.participantId === "string" ? body.participantId : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!participantId || !password) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const participant = await getParticipantRepository().findParticipant(
    bundle.session.instanceId,
    participantId,
  );
  if (!participant || participant.archivedAt !== null) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (participant.email === null || participant.neonUserId === null) {
    return NextResponse.json({ ok: false, error: "no_password_set" }, { status: 404 });
  }

  const authResult = await authenticateParticipant({ email: participant.email, password });
  if (!authResult.ok) {
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId: bundle.session.instanceId,
      actorKind: "participant",
      action: "participant_password_auth",
      result: "failure",
      createdAt: new Date().toISOString(),
      metadata: { reason: authResult.reason, participantId: participant.id },
    });
    const status = authResult.reason === "rate_limited" ? 429 : 401;
    return NextResponse.json({ ok: false, error: authResult.reason }, { status });
  }

  if (authResult.neonUserId !== participant.neonUserId) {
    // Defensive: the authenticated Neon user should match the participant's
    // linked user. If they drift (e.g. corrupt state), refuse to bind.
    return NextResponse.json({ ok: false, error: "identity_mismatch" }, { status: 409 });
  }

  const bindResult = await bindParticipantIdToSession(
    bundle.session,
    bundle.tokenHash,
    participant.id,
  );
  if (!bindResult.ok) {
    return NextResponse.json({ ok: false, error: bindResult.reason }, { status: 409 });
  }

  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId: bundle.session.instanceId,
    actorKind: "participant",
    action: "participant_password_auth",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: { participantId: participant.id },
  });

  return NextResponse.json({ ok: true, participantId: participant.id });
}

function readCookieValue(rawCookie: string, cookieName: string): string | null {
  if (!rawCookie) return null;
  const entry = rawCookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`));
  return entry ? decodeURIComponent(entry.slice(cookieName.length + 1)) : null;
}
