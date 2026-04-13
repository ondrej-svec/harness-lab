"use server";

import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { buildAdminHref, readActionState } from "@/lib/admin-page-view-model";
import {
  appendCheckIn,
  getWorkshopState,
  upsertTeam,
} from "@/lib/workshop-store";

function deriveNextTeamId(existingIds: string[]) {
  const numericIds = existingIds
    .map((id) => id.match(/^t(\d+)$/)?.[1])
    .filter(Boolean)
    .map((value) => Number(value));
  const nextNumber = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
  return `t${nextNumber}`;
}

function buildEvidenceSummary(parts: {
  changed?: string;
  verified?: string;
  nextStep?: string;
  fallback?: string;
}) {
  const items = [
    parts.changed ? `Co se změnilo: ${parts.changed}` : null,
    parts.verified ? `Co to ověřuje: ${parts.verified}` : null,
    parts.nextStep ? `Další safe move: ${parts.nextStep}` : null,
  ].filter(Boolean);

  if (items.length > 0) {
    return items.join("\n");
  }

  return parts.fallback?.trim() ?? "";
}

export async function registerTeamAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const state = await getWorkshopState(instanceId);
  const id = String(formData.get("id") ?? "").trim() || deriveNextTeamId(state.teams.map((team) => team.id));
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "Studio A").trim();
  const repoUrl = String(formData.get("repoUrl") ?? "").trim();
  const projectBriefId = String(formData.get("projectBriefId") ?? "").trim();
  const checkpointText = buildEvidenceSummary({
    changed: String(formData.get("checkpointChanged") ?? "").trim(),
    verified: String(formData.get("checkpointVerified") ?? "").trim(),
    nextStep: String(formData.get("checkpointNextStep") ?? "").trim(),
    fallback: String(formData.get("checkpoint") ?? "").trim(),
  });
  const membersRaw = String(formData.get("members") ?? "").trim();
  const anchorRaw = String(formData.get("anchor") ?? "").trim();

  if (id && name && repoUrl && projectBriefId) {
    const existing = state.teams.find((team) => team.id === id);
    await upsertTeam(
      {
        id,
        name,
        city,
        repoUrl,
        projectBriefId,
        checkIns: existing?.checkIns ?? [],
        anchor: anchorRaw ? anchorRaw : existing?.anchor ?? null,
        members: membersRaw
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      },
      instanceId,
    );
    if (checkpointText) {
      const currentPhaseId = state.agenda.find((item) => item.status === "current")?.id ?? state.agenda[0]?.id ?? "opening";
      await appendCheckIn(
        id,
        { phaseId: currentPhaseId, content: checkpointText, writtenBy: null },
        instanceId,
      );
    }
  }
  redirect(buildAdminHref({ lang, section, instanceId, teamId: id || null }));
}
