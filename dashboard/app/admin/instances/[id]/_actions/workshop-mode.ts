"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { buildAdminHref, readActionState } from "@/lib/admin-page-view-model";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";

/**
 * Toggle workshop_instances.team_mode_enabled. When true, the workshop
 * runs in team mode (shared repos, rotation, team-scoped checkpoints).
 * When false, participants are the primary unit — teams are invisible
 * in participant UX and progress attaches to the participant directly.
 *
 * Refuses changes while status = 'running' to avoid mid-workshop data
 * and UI inconsistency. Facilitators switching modes mid-flight should
 * archive the running instance and create a new one. The UI also
 * renders the form disabled; this guard covers malicious form posts
 * and race conditions (status flipping after the form is rendered).
 */
export async function toggleTeamModeAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const teamModeEnabled = String(formData.get("teamModeEnabled") ?? "true") === "true";

  const repository = getWorkshopInstanceRepository();
  const existing = await repository.getInstance(instanceId);

  if (existing && existing.status === "running" && existing.teamModeEnabled !== teamModeEnabled) {
    redirect(buildAdminHref({ lang, section, instanceId, error: "workshop_mode_locked_while_running" }));
  }

  if (existing && existing.teamModeEnabled !== teamModeEnabled) {
    await repository.updateInstance(instanceId, { ...existing, teamModeEnabled });
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId,
      actorKind: "facilitator",
      action: "facilitator_workshop_mode",
      result: "success",
      createdAt: new Date().toISOString(),
      metadata: { teamModeEnabled },
    });
  }

  redirect(buildAdminHref({ lang, section, instanceId }));
}
