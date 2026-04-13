"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { requireFacilitatorActionAccess } from "@/lib/facilitator-access";
import { buildAdminHref, readActionState } from "@/lib/admin-page-view-model";
import {
  createWorkshopArchive,
  resetWorkshopState,
  setRotationReveal,
} from "@/lib/workshop-store";
import { workshopTemplates } from "@/lib/workshop-data";

export async function toggleRotationAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  await setRotationReveal(formData.get("revealed") === "true", instanceId);
  redirect(buildAdminHref({ lang, section, instanceId }));
}

export async function resetWorkshopAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  // Confirmation gate — the reset is destructive, so the facilitator
  // must type the workshop instance id to proceed. Mirrors the Stripe /
  // GitHub "type the repo name to delete" pattern.
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== instanceId) {
    redirect(buildAdminHref({ lang, section, instanceId }) + "&resetError=confirm");
  }
  const templateId = workshopTemplates[0]?.id ?? "";
  if (templateId) {
    await resetWorkshopState(templateId, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId }));
}

export async function archiveWorkshopAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const notes = String(formData.get("notes") ?? "").trim();
  await createWorkshopArchive({ reason: "manual", notes: notes || null }, instanceId);
  redirect(buildAdminHref({ lang, section, instanceId }));
}

export async function changePasswordAction(formData: FormData) {
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const revokeOtherSessions = formData.get("revokeOtherSessions") === "on";

  if (!auth) {
    redirect(buildAdminHref({ lang, section, instanceId, error: "unavailable" }));
  }

  if (newPassword !== confirmPassword) {
    redirect(buildAdminHref({ lang, section, instanceId, error: "password_mismatch" }));
  }

  const { error } = await auth.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions,
  });

  if (error) {
    redirect(buildAdminHref({ lang, section, instanceId, error: error.message || "password_change_failed" }));
  }

  redirect(buildAdminHref({ lang, section, instanceId, password: "changed" }));
}
