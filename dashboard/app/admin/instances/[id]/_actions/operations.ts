"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut as proxySignOut } from "@/lib/auth/neon-auth-proxy";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { resolveUiLanguage, withLang } from "@/lib/ui-language";
import { updateAgendaItem } from "@/lib/workshop-store";

export async function signOutAction(formData: FormData) {
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  if (process.env.NEON_AUTH_BASE_URL) {
    await proxySignOut();
  }
  redirect(withLang("/admin/sign-in", lang));
}

/**
 * Rename a single agenda item. Used by the inline-field wiring on the
 * agenda detail header — the first Phase 3 proof of the inline-edit
 * pattern. Intentionally narrow: only updates `title`, no other fields.
 */
export async function renameAgendaItemAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "");
  const agendaId = String(formData.get("agendaId") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!instanceId || !agendaId || !title) {
    return;
  }

  await requireFacilitatorActionAccess(instanceId);
  await updateAgendaItem(agendaId, { title }, instanceId);
  revalidatePath(`/admin/instances/${instanceId}`);
}

/**
 * Update a single agenda-item field inline. Same narrow contract as
 * renameAgendaItemAction but for the other short fields the detail
 * header exposes: `time`, `goal`, `roomSummary`. The field name comes
 * from the form's `fieldName` and `fieldValue` pair so a single server
 * action can back every InlineField on the detail page.
 */
type UpdatableAgendaField = "title" | "time" | "goal" | "roomSummary";
const UPDATABLE_AGENDA_FIELDS: readonly UpdatableAgendaField[] = [
  "title",
  "time",
  "goal",
  "roomSummary",
];
type UpdatableAgendaListField = "facilitatorPrompts" | "watchFors" | "checkpointQuestions";
const UPDATABLE_AGENDA_LIST_FIELDS: readonly UpdatableAgendaListField[] = [
  "facilitatorPrompts",
  "watchFors",
  "checkpointQuestions",
];

export async function updateAgendaFieldAction(formData: FormData) {
  const instanceId = String(formData.get("instanceId") ?? "");
  const agendaId = String(formData.get("agendaId") ?? "");
  const fieldName = String(formData.get("fieldName") ?? "");
  const fieldValue = String(formData.get(fieldName) ?? "").trim();

  if (!instanceId || !agendaId || !fieldName) {
    return;
  }

  await requireFacilitatorActionAccess(instanceId);

  if (UPDATABLE_AGENDA_FIELDS.includes(fieldName as UpdatableAgendaField)) {
    if (!fieldValue) {
      return;
    }
    await updateAgendaItem(
      agendaId,
      { [fieldName]: fieldValue } as Partial<Record<UpdatableAgendaField, string>>,
      instanceId,
    );
    revalidatePath(`/admin/instances/${instanceId}`);
    return;
  }

  if (UPDATABLE_AGENDA_LIST_FIELDS.includes(fieldName as UpdatableAgendaListField)) {
    const items = fieldValue
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    await updateAgendaItem(
      agendaId,
      { [fieldName]: items } as Partial<Record<UpdatableAgendaListField, string[]>>,
      instanceId,
    );
    revalidatePath(`/admin/instances/${instanceId}`);
  }
}
