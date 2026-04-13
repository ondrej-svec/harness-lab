"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { resolveUiLanguage, withLang } from "@/lib/ui-language";
import { updateAgendaItem } from "@/lib/workshop-store";

export async function signOutAction(formData: FormData) {
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  if (auth) {
    await auth.signOut();
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
