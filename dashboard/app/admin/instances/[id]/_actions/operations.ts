"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { resolveUiLanguage, withLang } from "@/lib/ui-language";

export async function signOutAction(formData: FormData) {
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  if (auth) {
    await auth.signOut();
  }
  redirect(withLang("/admin/sign-in", lang));
}
