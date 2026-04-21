"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { buildAdminHref, readActionState } from "@/lib/admin-page-view-model";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";

/**
 * End the workshop: transition `workshop_instances.status` from whatever
 * it is today ("prepared" / "running") to "ended". Opens the post-workshop
 * participant surface (feedback form + resources) and enables the admin
 * summary section to show aggregate responses.
 *
 * The transition is **one-way in v1**. If a facilitator flips by accident,
 * the escape hatch is to archive + reset + re-create the instance. A
 * sibling `unendWorkshopAction` can be added later if a real need emerges.
 *
 * Destructive-enough that we gate with the same "type the instance id to
 * confirm" pattern as `resetWorkshopAction` — both shift the instance out
 * of its running state in ways participants will notice.
 */
export async function endWorkshopAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);

  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== instanceId) {
    redirect(buildAdminHref({ lang, section, instanceId }) + "&endError=confirm");
  }

  const repository = getWorkshopInstanceRepository();
  const existing = await repository.getInstance(instanceId);
  if (!existing) {
    redirect(buildAdminHref({ lang, section, instanceId, error: "instance_not_found" }));
  }

  // Idempotent — already ended means nothing to do.
  if (existing && existing.status !== "ended") {
    await repository.updateInstance(instanceId, { ...existing, status: "ended" });
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId,
      actorKind: "facilitator",
      action: "instance_ended",
      result: "success",
      createdAt: new Date().toISOString(),
      metadata: { previousStatus: existing.status },
    });
  }

  redirect(buildAdminHref({ lang, section, instanceId }));
}
