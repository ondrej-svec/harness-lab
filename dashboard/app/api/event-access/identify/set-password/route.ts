import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import {
  bindParticipantIdToSession,
  findOrCreateParticipant,
  getParticipantSessionWithTokenHash,
  participantSessionCookieName,
  validateDisplayName,
} from "@/lib/event-access";
import { createParticipantAccount } from "@/lib/participant-auth";
import { getParticipantRepository } from "@/lib/participant-repository";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { isTrustedOrigin, untrustedOriginResponse } from "@/lib/request-integrity";
import type { ParticipantRecord } from "@/lib/runtime-contracts";

/**
 * POST /api/event-access/identify/set-password
 *
 * First-time identify for a participant. Two input shapes:
 *   - participantId present: binding to a roster row the user picked.
 *   - participantId absent + displayName present: walk-in create (only
 *     allowed when workshop_instance.allow_walk_ins = true).
 *
 * Both paths create a Neon Auth user with role = "participant", link
 * it to the participant row, and bind the event-code session. The
 * Neon Auth session cookie is issued by the SDK as a side effect of
 * the subsequent signIn inside `createParticipantAccount`'s caller.
 *
 * Body (JSON): { participantId?, displayName?, email, password }
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
    displayName?: unknown;
    email?: unknown;
    password?: unknown;
  };

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const participantIdInput = typeof body.participantId === "string" ? body.participantId : null;
  const displayNameInput = typeof body.displayName === "string" ? body.displayName : null;

  if (!email || email.indexOf("@") <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "weak_password" }, { status: 400 });
  }

  const repository = getParticipantRepository();
  let participant: ParticipantRecord | null = null;

  if (participantIdInput) {
    participant = await repository.findParticipant(bundle.session.instanceId, participantIdInput);
    if (!participant || participant.archivedAt !== null) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if (participant.neonUserId !== null) {
      return NextResponse.json({ ok: false, error: "already_set" }, { status: 409 });
    }
  } else {
    // Walk-in path. Instance must allow walk-ins and displayName must validate.
    const instance = await getWorkshopInstanceRepository().getInstance(bundle.session.instanceId);
    if (!instance || instance.allowWalkIns === false) {
      await getAuditLogRepository().append({
        id: `audit-${randomUUID()}`,
        instanceId: bundle.session.instanceId,
        actorKind: "participant",
        action: "participant_identify_walk_in_refused",
        result: "failure",
        createdAt: new Date().toISOString(),
        metadata: { displayName: displayNameInput ?? null },
      });
      return NextResponse.json({ ok: false, error: "walk_in_refused" }, { status: 403 });
    }
    if (!displayNameInput) {
      return NextResponse.json({ ok: false, error: "invalid_display_name" }, { status: 400 });
    }
    const validated = validateDisplayName(displayNameInput);
    if (!validated.ok) {
      return NextResponse.json({ ok: false, error: "invalid_display_name" }, { status: 400 });
    }
    const created = await findOrCreateParticipant(bundle.session.instanceId, validated.value);
    participant = created;
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId: bundle.session.instanceId,
      actorKind: "participant",
      action: "participant_identify_walk_in_created",
      result: "success",
      createdAt: new Date().toISOString(),
      metadata: { participantId: created.id, displayName: created.displayName },
    });
  }

  if (participant.email === null || participant.email.toLocaleLowerCase() !== email.toLocaleLowerCase()) {
    // Store the email on the participant row for the suggest path.
    participant = {
      ...participant,
      email,
      updatedAt: new Date().toISOString(),
    };
    await repository.upsertParticipant(bundle.session.instanceId, participant);
  }

  const createResult = await createParticipantAccount({
    email,
    password,
    displayName: participant.displayName,
  });

  if (!createResult.ok) {
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId: bundle.session.instanceId,
      actorKind: "participant",
      action: "participant_password_create",
      result: "failure",
      createdAt: new Date().toISOString(),
      metadata: { reason: createResult.reason, participantId: participant.id },
    });
    return NextResponse.json({ ok: false, error: createResult.reason }, { status: 400 });
  }

  await repository.linkNeonUser(
    bundle.session.instanceId,
    participant.id,
    createResult.neonUserId,
    new Date().toISOString(),
  );

  const bindResult = await bindParticipantIdToSession(
    bundle.session,
    bundle.tokenHash,
    participant.id,
  );
  if (!bindResult.ok) {
    // Session binding failure after account creation is surprising; the
    // account exists, link is set, but the event-code session can't see
    // it. Surface to the client so they retry the auth step.
    return NextResponse.json({ ok: false, error: bindResult.reason }, { status: 409 });
  }

  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId: bundle.session.instanceId,
    actorKind: "participant",
    action: "participant_password_create",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: { participantId: participant.id, neonUserId: createResult.neonUserId },
  });

  return NextResponse.json({
    ok: true,
    participantId: participant.id,
    neonUserId: createResult.neonUserId,
  });
}

function readCookieValue(rawCookie: string, cookieName: string): string | null {
  if (!rawCookie) return null;
  const entry = rawCookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`));
  return entry ? decodeURIComponent(entry.slice(cookieName.length + 1)) : null;
}
