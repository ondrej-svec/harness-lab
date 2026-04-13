"use server";

import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { buildAdminHref, readActionState } from "@/lib/admin-page-view-model";
import {
  addAgendaItem,
  moveAgendaItem,
  removeAgendaItem,
  setCurrentAgendaItem,
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
