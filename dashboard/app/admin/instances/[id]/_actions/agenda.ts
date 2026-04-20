"use server";

import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { buildAdminHref, readActionState } from "@/lib/admin-page-view-model";
import { buildPresenterRouteHref } from "@/lib/presenter-view-model";
import { resolveUiLanguage } from "@/lib/ui-language";
import {
  addAgendaItem,
  clearLiveParticipantMomentOverride,
  captureRotationSignal,
  moveAgendaItem,
  promoteParticipantFeedbackToTicker,
  removeAgendaItem,
  resetActivePollResponses,
  setCurrentAgendaItem,
  setLiveParticipantMomentOverride,
  setLiveRoomScene,
  updateAgendaItem,
} from "@/lib/workshop-store";

function parseTextareaList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function setAgendaAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaId = String(formData.get("agendaId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  if (agendaId) {
    await setCurrentAgendaItem(agendaId, instanceId);
  }
  redirect(
    buildAdminHref({
      lang,
      section,
      instanceId,
      agendaItemId: returnTo === "detail" ? agendaId || null : null,
    }),
  );
}

export async function saveAgendaDetailsAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaId = String(formData.get("agendaId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const roomSummary = String(formData.get("roomSummary") ?? "").trim();
  const facilitatorPrompts = parseTextareaList(String(formData.get("facilitatorPrompts") ?? ""));
  const watchFors = parseTextareaList(String(formData.get("watchFors") ?? ""));
  const checkpointQuestions = parseTextareaList(String(formData.get("checkpointQuestions") ?? ""));
  const description = roomSummary || goal;

  if (agendaId && title && time && description) {
    await updateAgendaItem(
      agendaId,
      {
        title,
        time,
        description,
        goal: goal || description,
        roomSummary: roomSummary || description,
        facilitatorPrompts,
        watchFors,
        checkpointQuestions,
      },
      instanceId,
    );
  }

  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId: agendaId || null }));
}

export async function addAgendaItemAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const title = String(formData.get("title") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const roomSummary = String(formData.get("roomSummary") ?? "").trim();
  const facilitatorPrompts = parseTextareaList(String(formData.get("facilitatorPrompts") ?? ""));
  const watchFors = parseTextareaList(String(formData.get("watchFors") ?? ""));
  const checkpointQuestions = parseTextareaList(String(formData.get("checkpointQuestions") ?? ""));
  const description = roomSummary || goal || String(formData.get("description") ?? "").trim();
  const afterItemId = String(formData.get("afterItemId") ?? "").trim();

  if (title && time && description) {
    const state = await addAgendaItem(
      {
        title,
        time,
        description,
        goal: goal || description,
        roomSummary: roomSummary || description,
        facilitatorPrompts,
        watchFors,
        checkpointQuestions,
        afterItemId: afterItemId || null,
      },
      instanceId,
    );
    const createdItem = state.agenda.find(
      (item) => item.kind === "custom" && item.title === title && item.time === time,
    );
    redirect(
      buildAdminHref({ lang, section, instanceId, agendaItemId: createdItem?.id ?? null }),
    );
  }

  redirect(buildAdminHref({ lang, section, instanceId }));
}

export async function moveAgendaItemAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaId = String(formData.get("agendaId") ?? "");
  const direction = String(formData.get("direction") ?? "") as "up" | "down";
  if (agendaId && (direction === "up" || direction === "down")) {
    await moveAgendaItem(agendaId, direction, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId: agendaId || null }));
}

export async function removeAgendaItemAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaId = String(formData.get("agendaId") ?? "");
  if (agendaId) {
    await removeAgendaItem(agendaId, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId }));
}

/**
 * Cross-agenda navigation from the presenter carousel.
 *
 * When the facilitator gestures past the last (or first) scene of the
 * current agenda item, the PresenterShell calls this action with the
 * neighboring agenda item's id. The action sets the live marker so the
 * participant surface tracks the new phase, then redirects to the
 * presenter URL for that item's first scene. Both side effects happen
 * server-side in one round trip — the client just submits the form.
 */
export async function advancePresenterToAgendaItemAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "");
  const agendaId = String(formData.get("agendaId") ?? "");
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));

  if (!instanceId || !agendaId) {
    return;
  }

  await requireFacilitatorActionAccess(instanceId);
  await setCurrentAgendaItem(agendaId, instanceId);
  redirect(buildPresenterRouteHref({ lang, instanceId, agendaItemId: agendaId, sceneId: null }));
}

export async function syncPresenterSceneAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "");
  const agendaId = String(formData.get("agendaId") ?? "");
  const sceneId = String(formData.get("sceneId") ?? "");

  if (!instanceId || !agendaId || !sceneId) {
    return;
  }

  await requireFacilitatorActionAccess(instanceId);
  await setLiveRoomScene(agendaId, sceneId, instanceId);
}

export async function setParticipantMomentOverrideAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);

  const agendaId = String(formData.get("agendaId") ?? "");
  const participantMomentId = String(formData.get("participantMomentId") ?? "");
  if (agendaId && participantMomentId) {
    await setLiveParticipantMomentOverride(agendaId, participantMomentId, instanceId);
  }

  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId: agendaId || null }));
}

export async function clearParticipantMomentOverrideAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);

  const agendaId = String(formData.get("agendaId") ?? "");
  if (agendaId) {
    await clearLiveParticipantMomentOverride(agendaId, instanceId);
  }

  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId: agendaId || null }));
}

export async function resetActivePollAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);

  const agendaId = String(formData.get("agendaId") ?? "");
  await resetActivePollResponses(instanceId);
  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId: agendaId || null }));
}

export async function promoteParticipantFeedbackAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);

  const agendaId = String(formData.get("agendaId") ?? "");
  const feedbackId = String(formData.get("feedbackId") ?? "");
  if (feedbackId) {
    await promoteParticipantFeedbackToTicker(feedbackId, instanceId);
  }

  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId: agendaId || null }));
}

export async function captureRotationSignalAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);

  const freeText = String(formData.get("freeText") ?? "").trim();
  if (freeText.length === 0) {
    redirect(buildAdminHref({ lang, section, instanceId }));
  }

  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags =
    tagsRaw.length > 0
      ? tagsRaw
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

  const teamIdRaw = String(formData.get("teamId") ?? "").trim();
  const teamId = teamIdRaw.length > 0 ? teamIdRaw : undefined;

  await captureRotationSignal({ freeText, tags, teamId }, instanceId);
  redirect(buildAdminHref({ lang, section, instanceId }));
}
