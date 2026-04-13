"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { buildAdminHref, readActionState } from "@/lib/admin-page-view-model";
import type { PresenterBlock, PresenterScene } from "@/lib/workshop-data";
import {
  addPresenterScene,
  getWorkshopState,
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

/**
 * Narrow inline-field updater for presenter scenes. Allowlists the
 * short text/select fields the agenda surface exposes as click-to-edit.
 * Reuses updatePresenterScene after patching the single field onto the
 * current scene shape so scene normalization + block handling stay
 * untouched. Empty text fields are allowed through for ctaLabel/ctaHref
 * so the facilitator can clear them back to null; other fields require
 * a non-empty value.
 */
type UpdatableSceneField =
  | "label"
  | "title"
  | "body"
  | "sceneType"
  | "intent"
  | "chromePreset"
  | "ctaLabel"
  | "ctaHref"
  | "facilitatorNotes";
const UPDATABLE_SCENE_FIELDS: readonly UpdatableSceneField[] = [
  "label",
  "title",
  "body",
  "sceneType",
  "intent",
  "chromePreset",
  "ctaLabel",
  "ctaHref",
  "facilitatorNotes",
];
const CLEARABLE_SCENE_FIELDS: ReadonlySet<UpdatableSceneField> = new Set([
  "ctaLabel",
  "ctaHref",
  "facilitatorNotes",
]);

export async function updateSceneFieldAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "");
  const agendaItemId = String(formData.get("agendaItemId") ?? "");
  const sceneId = String(formData.get("sceneId") ?? "");
  const fieldName = String(formData.get("fieldName") ?? "") as UpdatableSceneField;
  const fieldValue = String(formData.get(fieldName) ?? "").trim();

  if (!instanceId || !agendaItemId || !sceneId || !fieldName) {
    return;
  }
  if (!UPDATABLE_SCENE_FIELDS.includes(fieldName)) {
    return;
  }
  if (!fieldValue && !CLEARABLE_SCENE_FIELDS.has(fieldName)) {
    return;
  }

  await requireFacilitatorActionAccess(instanceId);
  const state = await getWorkshopState(instanceId);
  const agendaItem = state.agenda.find((item) => item.id === agendaItemId);
  const scene = agendaItem?.presenterScenes.find((candidate) => candidate.id === sceneId);
  if (!agendaItem || !scene) {
    return;
  }

  const base = {
    label: scene.label,
    sceneType: scene.sceneType,
    title: scene.title ?? undefined,
    body: scene.body ?? undefined,
    intent: scene.intent ?? undefined,
    chromePreset: scene.chromePreset ?? undefined,
    ctaLabel: scene.ctaLabel ?? null,
    ctaHref: scene.ctaHref ?? null,
    facilitatorNotes: scene.facilitatorNotes ?? [],
  };
  const patch: typeof base = { ...base };
  if (fieldName === "sceneType") {
    patch.sceneType = fieldValue as PresenterScene["sceneType"];
  } else if (fieldName === "intent") {
    patch.intent = fieldValue as PresenterScene["intent"];
  } else if (fieldName === "chromePreset") {
    patch.chromePreset = fieldValue as PresenterScene["chromePreset"];
  } else if (fieldName === "ctaLabel") {
    patch.ctaLabel = fieldValue || null;
  } else if (fieldName === "ctaHref") {
    patch.ctaHref = fieldValue || null;
  } else if (fieldName === "facilitatorNotes") {
    patch.facilitatorNotes = fieldValue
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } else {
    patch[fieldName] = fieldValue;
  }

  await updatePresenterScene(agendaItemId, sceneId, patch, instanceId);
  revalidatePath(`/admin/instances/${instanceId}`);
}
