"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { buildAdminHref, readActionState } from "@/lib/admin-page-view-model";
import { decryptEventCodeForReveal } from "@/lib/event-code-reveal-crypto";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getInstanceGrantRepository } from "@/lib/instance-grant-repository";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { getNeonSql } from "@/lib/neon-db";
import { getParticipantEventAccessRepository } from "@/lib/participant-event-access-repository";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { issueParticipantEventAccess } from "@/lib/participant-access-management";
import {
  participantAccessFlashCookieName,
  type ParticipantAccessFlash,
} from "../_lib/participant-access-flash";

/**
 * Clamp the caller-supplied expiration-in-days to a sane range:
 * 1 day minimum (can't be in the past), 365 days maximum (anything
 * longer should be a deliberate multi-event reuse, not a workshop
 * re-issue). Returns null when the input can't be parsed — which
 * triggers the backend 14-day default in issueParticipantEventAccess.
 */
function parseExpiresInDays(raw: unknown): number | null {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const value = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(value) || value < 1) {
    return null;
  }
  return Math.min(value, 365);
}

export async function issueParticipantAccessAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const facilitator = await getFacilitatorSession(instanceId);
  const codeInput = String(formData.get("code") ?? "").trim();
  const expiresInDays = parseExpiresInDays(formData.get("expiresInDays"));
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
  const result = await issueParticipantEventAccess(
    {
      code: codeInput || undefined,
      expiresAt,
      actorNeonUserId: facilitator?.neonUserId ?? null,
    },
    instanceId,
  );

  if (!result.ok) {
    redirect(buildAdminHref({ lang, section, instanceId, error: result.error }));
  }

  const cookieStore = await cookies();
  cookieStore.set(
    participantAccessFlashCookieName,
    JSON.stringify({
      instanceId,
      issuedCode: result.issuedCode,
      codeId: result.access.codeId,
    } satisfies ParticipantAccessFlash),
    {
      httpOnly: true,
      sameSite: "lax",
      path: `/admin/instances/${instanceId}`,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  );

  redirect(buildAdminHref({ lang, section, instanceId }));
}

export async function addFacilitatorAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "operator") as "owner" | "operator" | "observer";

  if (email && ["owner", "operator", "observer"].includes(role)) {
    const facilitator = await getFacilitatorSession(instanceId);
    if (facilitator?.grant.role === "owner") {
      const sql = getNeonSql();
      const users = (await sql.query(
        `SELECT id::text, name, email FROM neon_auth."user" WHERE email = $1 LIMIT 1`,
        [email],
      )) as { id: string; name: string; email: string }[];

      if (users.length > 0) {
        const repo = getInstanceGrantRepository();
        const existing = await repo.getActiveGrantByNeonUserId(instanceId, users[0].id);
        if (!existing) {
          await repo.createGrant(instanceId, users[0].id, role);
          await getAuditLogRepository().append({
            id: `audit-${Date.now()}`,
            instanceId,
            actorKind: "facilitator",
            action: "facilitator_grant_created",
            result: "success",
            createdAt: new Date().toISOString(),
            metadata: { grantedToEmail: email, role },
          });
        }
      }
    }
  }
  redirect(buildAdminHref({ lang, section, instanceId }));
}

export async function revokeFacilitatorAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const grantId = String(formData.get("grantId") ?? "");

  if (grantId) {
    const facilitator = await getFacilitatorSession(instanceId);
    if (facilitator?.grant.role === "owner" && grantId !== facilitator.grant.id) {
      await getInstanceGrantRepository().revokeGrant(grantId);
      await getAuditLogRepository().append({
        id: `audit-${Date.now()}`,
        instanceId,
        actorKind: "facilitator",
        action: "facilitator_grant_revoked",
        result: "success",
        createdAt: new Date().toISOString(),
        metadata: { revokedGrantId: grantId },
      });
    }
  }
  redirect(buildAdminHref({ lang, section, instanceId }));
}

/**
 * Toggle workshop_instances.allow_walk_ins. When true (default),
 * unknown-name identify renders a "+ add yourself as new" option;
 * when false, the same input renders "ask your facilitator to add
 * you" with no create affordance. Mirrors the API endpoint at
 * PUT /api/admin/instances/[id]/walk-in-policy so agent-driven and
 * UI-driven toggles share one audit-log shape.
 */
export async function toggleWalkInsAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const allowWalkIns = String(formData.get("allowWalkIns") ?? "true") === "true";

  const repository = getWorkshopInstanceRepository();
  const existing = await repository.getInstance(instanceId);

  if (existing && existing.allowWalkIns !== allowWalkIns) {
    await repository.updateInstance(instanceId, { ...existing, allowWalkIns });
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId,
      actorKind: "facilitator",
      action: "facilitator_walk_in_policy",
      result: "success",
      createdAt: new Date().toISOString(),
      metadata: { allowWalkIns },
    });
  }

  redirect(buildAdminHref({ lang, section, instanceId }));
}

type RevealParticipantEventCodeResult =
  | { ok: true; plaintext: string }
  | { ok: false; reason: "not-revealable" | "decrypt-failed" | "no-access" };

/**
 * Decrypt the active event code for facilitator display. Every call —
 * success or failure — emits a `participant_event_access_revealed`
 * audit row with actor + codeId + version metadata, never the
 * plaintext. Returns JSON instead of redirecting so the client reveal
 * chip can render the value directly without round-tripping through
 * SSR.
 */
export async function revealParticipantEventCodeAction(
  instanceId: string,
): Promise<RevealParticipantEventCodeResult> {
  await requireFacilitatorActionAccess(instanceId);
  const facilitator = await getFacilitatorSession(instanceId);
  const access = await getParticipantEventAccessRepository().getActiveAccess(instanceId);
  const now = new Date().toISOString();
  const actorNeonUserId = facilitator?.neonUserId ?? null;

  if (!access) {
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId,
      actorKind: "facilitator",
      action: "participant_event_access_revealed",
      result: "failure",
      createdAt: now,
      metadata: { actorNeonUserId, reason: "no-access" },
    });
    return { ok: false, reason: "no-access" };
  }

  const codeId = access.codeHash.slice(0, 12);

  if (!access.codeCiphertext) {
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId,
      actorKind: "facilitator",
      action: "participant_event_access_revealed",
      result: "failure",
      createdAt: now,
      metadata: { actorNeonUserId, codeId, version: access.version, reason: "not-revealable" },
    });
    return { ok: false, reason: "not-revealable" };
  }

  const plaintext = decryptEventCodeForReveal(access.codeCiphertext);
  if (!plaintext) {
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId,
      actorKind: "facilitator",
      action: "participant_event_access_revealed",
      result: "failure",
      createdAt: now,
      metadata: { actorNeonUserId, codeId, version: access.version, reason: "decrypt-failed" },
    });
    return { ok: false, reason: "decrypt-failed" };
  }

  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "participant_event_access_revealed",
    result: "success",
    createdAt: now,
    metadata: { actorNeonUserId, codeId, version: access.version },
  });

  return { ok: true, plaintext };
}
