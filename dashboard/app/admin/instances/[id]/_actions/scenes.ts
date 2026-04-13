"use server";

import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { buildAdminHref, readActionState } from "@/lib/admin-page-view-model";
import type { PresenterBlock, PresenterScene } from "@/lib/workshop-data";
import {
  addPresenterScene,
  movePresenterScene,
  removePresenterScene,
  setDefaultPresenterScene,
  setPresenterSceneEnabled,
  updatePresenterScene,
} from "@/lib/workshop-store";
import type { SourceRef } from "../_components/agenda/types";

function parseTextareaList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonArray<T>(value: string): T[] | undefined {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(normalized);
    return Array.isArray(parsed) ? (parsed as T[]) : undefined;
  } catch {
    return undefined;
  }
}

export async function addPresenterSceneAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaItemId = String(formData.get("agendaItemId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const sceneType = String(formData.get("sceneType") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const intent = String(formData.get("intent") ?? "").trim();
  const chromePreset = String(formData.get("chromePreset") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaHref = String(formData.get("ctaHref") ?? "").trim();
  const facilitatorNotes = parseTextareaList(String(formData.get("facilitatorNotes") ?? ""));
  const sourceRefs = parseJsonArray<SourceRef>(String(formData.get("sourceRefs") ?? ""));
  const blocks = parseJsonArray<PresenterBlock>(String(formData.get("blocks") ?? ""));

  if (!agendaItemId || !label || !sceneType) {
    redirect(buildAdminHref({ lang, section, instanceId, agendaItemId, overlay: "scene-add" }));
  }

  const state = await addPresenterScene(
    agendaItemId,
    {
      label,
      sceneType: sceneType as PresenterScene["sceneType"],
      title,
      body,
      intent: (intent || undefined) as PresenterScene["intent"] | undefined,
      chromePreset: (chromePreset || undefined) as PresenterScene["chromePreset"] | undefined,
      ctaLabel: ctaLabel || null,
      ctaHref: ctaHref || null,
      facilitatorNotes,
      sourceRefs,
      blocks,
    },
    instanceId,
  );
  const agendaItem = state.agenda.find((item) => item.id === agendaItemId);
  const createdScene =
    [...(agendaItem?.presenterScenes ?? [])].sort((left, right) => right.order - left.order)[0] ?? null;

  redirect(
    buildAdminHref({
      lang,
      section,
      instanceId,
      agendaItemId,
      sceneId: createdScene?.id ?? null,
    }),
  );
}

export async function updatePresenterSceneAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaItemId = String(formData.get("agendaItemId") ?? "").trim();
  const sceneId = String(formData.get("sceneId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const sceneType = String(formData.get("sceneType") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const intent = String(formData.get("intent") ?? "").trim();
  const chromePreset = String(formData.get("chromePreset") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaHref = String(formData.get("ctaHref") ?? "").trim();
  const facilitatorNotes = parseTextareaList(String(formData.get("facilitatorNotes") ?? ""));
  const sourceRefs = parseJsonArray<SourceRef>(String(formData.get("sourceRefs") ?? ""));
  const blocks = parseJsonArray<PresenterBlock>(String(formData.get("blocks") ?? ""));

  if (!agendaItemId || !sceneId || !label || !sceneType) {
    redirect(buildAdminHref({ lang, section, instanceId, agendaItemId, sceneId, overlay: "scene-edit" }));
  }

  await updatePresenterScene(
    agendaItemId,
    sceneId,
    {
      label,
      sceneType: sceneType as PresenterScene["sceneType"],
      title,
      body,
      intent: (intent || undefined) as PresenterScene["intent"] | undefined,
      chromePreset: (chromePreset || undefined) as PresenterScene["chromePreset"] | undefined,
      ctaLabel: ctaLabel || null,
      ctaHref: ctaHref || null,
      facilitatorNotes,
      sourceRefs,
      blocks,
    },
    instanceId,
  );

  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId, sceneId }));
}

export async function movePresenterSceneAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaItemId = String(formData.get("agendaItemId") ?? "").trim();
  const sceneId = String(formData.get("sceneId") ?? "").trim();
  const direction = String(formData.get("direction") ?? "").trim() as "up" | "down";
  if (agendaItemId && sceneId && (direction === "up" || direction === "down")) {
    await movePresenterScene(agendaItemId, sceneId, direction, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId, sceneId }));
}

export async function setDefaultPresenterSceneAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaItemId = String(formData.get("agendaItemId") ?? "").trim();
  const sceneId = String(formData.get("sceneId") ?? "").trim();
  if (agendaItemId && sceneId) {
    await setDefaultPresenterScene(agendaItemId, sceneId, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId, sceneId }));
}

export async function togglePresenterSceneEnabledAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaItemId = String(formData.get("agendaItemId") ?? "").trim();
  const sceneId = String(formData.get("sceneId") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "").trim() === "true";
  if (agendaItemId && sceneId) {
    await setPresenterSceneEnabled(agendaItemId, sceneId, enabled, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId, sceneId }));
}

export async function removePresenterSceneAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaItemId = String(formData.get("agendaItemId") ?? "").trim();
  const sceneId = String(formData.get("sceneId") ?? "").trim();
  if (agendaItemId && sceneId) {
    await removePresenterScene(agendaItemId, sceneId, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId }));
}
