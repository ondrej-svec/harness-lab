"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { buildAdminHref, readActionState } from "@/lib/admin-page-view-model";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getInstanceGrantRepository } from "@/lib/instance-grant-repository";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { getNeonSql } from "@/lib/neon-db";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { issueParticipantEventAccess } from "@/lib/participant-access-management";
import {
  participantAccessFlashCookieName,
  type ParticipantAccessFlash,
} from "../_lib/participant-access-flash";

export async function issueParticipantAccessAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const facilitator = await getFacilitatorSession(instanceId);
  const codeInput = String(formData.get("code") ?? "").trim();
  const result = await issueParticipantEventAccess(
    {
      code: codeInput || undefined,
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
