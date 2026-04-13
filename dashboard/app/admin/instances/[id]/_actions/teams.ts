"use server";

import { revalidatePath } from "next/cache";
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


/**
 * Narrow inline-field updater for teams. Allowlists the short text
 * fields that the team card surfaces as click-to-edit: name, city,
 * repoUrl, anchor. Reuses upsertTeam after patching the single field
 * onto the current team shape, so nested data (checkIns, members,
 * projectBriefId) stays untouched.
 */
type UpdatableTeamField = "name" | "city" | "repoUrl" | "anchor" | "members";
const UPDATABLE_TEAM_FIELDS: readonly UpdatableTeamField[] = [
  "name",
  "city",
  "repoUrl",
  "anchor",
  "members",
];

export async function updateTeamFieldAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const fieldName = String(formData.get("fieldName") ?? "") as UpdatableTeamField;
  const fieldValue = String(formData.get(fieldName) ?? "").trim();

  if (!instanceId || !teamId || !fieldName || !fieldValue) {
    return;
  }
  if (!UPDATABLE_TEAM_FIELDS.includes(fieldName)) {
    return;
  }

  await requireFacilitatorActionAccess(instanceId);
  const state = await getWorkshopState(instanceId);
  const team = state.teams.find((candidate) => candidate.id === teamId);
  if (!team) {
    return;
  }

  const next = { ...team };
  if (fieldName === "members") {
    next.members = fieldValue
      .split(",")
      .map((member) => member.trim())
      .filter(Boolean);
  } else if (fieldName === "anchor") {
    next.anchor = fieldValue;
  } else {
    (next as Record<string, unknown>)[fieldName] = fieldValue;
  }

  await upsertTeam(next, instanceId);
  revalidatePath(`/admin/instances/${instanceId}`);
}

/**
 * Append-only checkpoint entry. Takes the raw textarea content from an
 * InlineField (empty value means "don't add") and calls appendCheckIn
 * against the team's current phase. Mirrors the registerTeamAction
 * buildEvidenceSummary output shape when the client sends structured
 * checkpointChanged / checkpointVerified / checkpointNextStep, but
 * also accepts a plain `checkpoint` field so a simple textarea works.
 */
export async function appendTeamCheckpointAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const checkpoint = String(formData.get("checkpoint") ?? "").trim();

  if (!instanceId || !teamId || !checkpoint) {
    return;
  }

  await requireFacilitatorActionAccess(instanceId);
  const state = await getWorkshopState(instanceId);
  const currentPhaseId =
    state.agenda.find((item) => item.status === "current")?.id ?? state.agenda[0]?.id ?? "opening";
  await appendCheckIn(
    teamId,
    { phaseId: currentPhaseId, content: checkpoint, writtenBy: null },
    instanceId,
  );
  revalidatePath(`/admin/instances/${instanceId}`);
}
