"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { getParticipantRepository } from "@/lib/participant-repository";
import {
  appendRotationMarkerHistory,
  recordTeamAssignmentHistory,
  recordTeamUnassignmentHistory,
} from "@/lib/team-composition-history";
import { getTeamMemberRepository } from "@/lib/team-member-repository";
import { parseParticipantPaste } from "@/lib/participant-paste-parser";
import { rebuildTeamMembersProjection } from "@/lib/team-members-projection";
import type { ParticipantRecord } from "@/lib/runtime-contracts";

function pathForInstance(instanceId: string) {
  return `/admin/instances/${encodeURIComponent(instanceId)}`;
}

export async function addParticipantsFromPasteAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "").trim();
  const rawText = String(formData.get("rawText") ?? "");
  if (!instanceId || !rawText.trim()) return;
  await requireFacilitatorActionAccess(instanceId);

  const parsed = parseParticipantPaste(rawText);
  if (parsed.entries.length === 0) {
    revalidatePath(pathForInstance(instanceId));
    return;
  }

  const repository = getParticipantRepository();
  const now = new Date().toISOString();
  for (const entry of parsed.entries) {
    const existing = await repository.findParticipantByDisplayName(instanceId, entry.displayName);
    if (existing) continue;

    const participant: ParticipantRecord = {
      id: `p-${randomUUID()}`,
      instanceId,
      displayName: entry.displayName,
      email: entry.email,
      emailOptIn: false,
      tag: entry.tag,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
    await repository.upsertParticipant(instanceId, participant);
  }

  revalidatePath(pathForInstance(instanceId));
}

export async function updateParticipantAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "").trim();
  const participantId = String(formData.get("participantId") ?? "").trim();
  const field = String(formData.get("fieldName") ?? "").trim();
  const valueRaw = formData.get("value");
  if (!instanceId || !participantId || !field) return;
  await requireFacilitatorActionAccess(instanceId);

  const repository = getParticipantRepository();
  const existing = await repository.findParticipant(instanceId, participantId);
  if (!existing) return;

  const next = { ...existing };
  const value = valueRaw === null ? "" : String(valueRaw).trim();
  switch (field) {
    case "displayName":
      if (value.length > 0) next.displayName = value;
      break;
    case "email":
      next.email = value.length === 0 ? null : value;
      if (next.email === null) next.emailOptIn = false;
      break;
    case "tag":
      next.tag = value.length === 0 ? null : value;
      break;
    case "emailOptIn":
      next.emailOptIn = value === "on" || value === "true";
      if (next.emailOptIn && !next.email) next.emailOptIn = false;
      break;
    default:
      return;
  }
  next.updatedAt = new Date().toISOString();
  await repository.upsertParticipant(instanceId, next);
  if (field === "displayName") {
    await rebuildTeamMembersProjection(instanceId);
  }
  revalidatePath(pathForInstance(instanceId));
}

export async function removeParticipantAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "").trim();
  const participantId = String(formData.get("participantId") ?? "").trim();
  if (!instanceId || !participantId) return;
  await requireFacilitatorActionAccess(instanceId);

  const now = new Date().toISOString();
  await getParticipantRepository().archiveParticipant(instanceId, participantId, now);
  const result = await getTeamMemberRepository().unassignMember(instanceId, participantId);
  await recordTeamUnassignmentHistory({
    instanceId,
    participantId,
    result,
    note: "participant archived",
  });
  await rebuildTeamMembersProjection(instanceId);
  revalidatePath(pathForInstance(instanceId));
}

export async function assignParticipantAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "").trim();
  const participantId = String(formData.get("participantId") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "").trim();
  if (!instanceId || !participantId || !teamId) return;
  await requireFacilitatorActionAccess(instanceId);

  const result = await getTeamMemberRepository().assignMember(instanceId, {
    id: `tm-${randomUUID()}`,
    instanceId,
    teamId,
    participantId,
    assignedAt: new Date().toISOString(),
  });
  await recordTeamAssignmentHistory({
    instanceId,
    participantId,
    result,
  });
  await rebuildTeamMembersProjection(instanceId);
  revalidatePath(pathForInstance(instanceId));
}

export async function unassignParticipantAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "").trim();
  const participantId = String(formData.get("participantId") ?? "").trim();
  if (!instanceId || !participantId) return;
  await requireFacilitatorActionAccess(instanceId);

  const result = await getTeamMemberRepository().unassignMember(instanceId, participantId);
  await recordTeamUnassignmentHistory({
    instanceId,
    participantId,
    result,
  });
  await rebuildTeamMembersProjection(instanceId);
  revalidatePath(pathForInstance(instanceId));
}

export async function addTeamHistoryMarkerAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!instanceId) return;
  await requireFacilitatorActionAccess(instanceId);

  await appendRotationMarkerHistory(instanceId, {
    note: note || null,
  });
  revalidatePath(pathForInstance(instanceId));
}
