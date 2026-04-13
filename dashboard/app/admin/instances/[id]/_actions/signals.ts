"use server";

import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { buildAdminHref, readActionState } from "@/lib/admin-page-view-model";
import { addSprintUpdate, completeChallenge } from "@/lib/workshop-store";

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

export async function addCheckpointFeedAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const teamId = String(formData.get("teamId") ?? "");
  const text = buildEvidenceSummary({
    changed: String(formData.get("checkpointChanged") ?? "").trim(),
    verified: String(formData.get("checkpointVerified") ?? "").trim(),
    nextStep: String(formData.get("checkpointNextStep") ?? "").trim(),
    fallback: String(formData.get("text") ?? "").trim(),
  });
  const at = String(formData.get("at") ?? "");
  if (teamId && text && at) {
    await addSprintUpdate(
      {
        id: `u-${Date.now()}`,
        teamId,
        text,
        at,
      },
      instanceId,
    );
  }
  redirect(buildAdminHref({ lang, section, instanceId }));
}

export async function completeChallengeAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const teamId = String(formData.get("teamId") ?? "");
  const challengeId = String(formData.get("challengeId") ?? "");
  if (teamId && challengeId) {
    await completeChallenge(challengeId, teamId, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId }));
}
