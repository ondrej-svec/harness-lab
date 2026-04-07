import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { adminCopy, resolveUiLanguage, withLang } from "@/lib/ui-language";

export const dynamic = "force-dynamic";

export async function resetPasswordAction(formData: FormData) {
  "use server";

  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!auth) {
    return redirect(withLang("/admin/sign-in?error=unavailable", lang));
  }

  if (!token) {
    return redirect(withLang("/admin/reset-password?error=missing_token", lang));
  }

  if (newPassword !== confirmPassword) {
    return redirect(withLang("/admin/reset-password?error=password_mismatch", lang));
  }

  const { error } = await auth.resetPassword({
    token,
    newPassword,
  });

  if (error) {
    return redirect(withLang(`/admin/reset-password?error=${encodeURIComponent(error.message || "reset_failed")}`, lang));
  }

  return redirect(withLang("/admin/sign-in?reset=done", lang));
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; lang?: string; token?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const lang = resolveUiLanguage(params?.lang);
  const copy = adminCopy[lang];
  const token = params?.token ?? "";
  const errorParam = params?.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-6 py-10">
      <div className="w-full max-w-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8">
        <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--text-muted)]">
          {copy.passwordResetTitle}
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
          {copy.passwordResetPageTitle}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          {copy.passwordResetPageBody}
        </p>

        {!token ? (
          <p className="mt-6 border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
            {copy.passwordResetMissingToken}
          </p>
        ) : (
          <form action={resetPasswordAction} className="mt-8 space-y-5">
            <input name="lang" type="hidden" value={lang} />
            <input name="token" type="hidden" value={token} />

            <div>
              <label
                className="block text-[11px] lowercase tracking-[0.18em] text-[var(--text-muted)]"
                htmlFor="reset-new-password"
              >
                {copy.newPasswordLabel}
              </label>
              <input
                id="reset-new-password"
                name="newPassword"
                type="password"
                required
                autoComplete="new-password"
                className="mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)]"
              />
            </div>

            <div>
              <label
                className="block text-[11px] lowercase tracking-[0.18em] text-[var(--text-muted)]"
                htmlFor="reset-confirm-password"
              >
                {copy.confirmPasswordLabel}
              </label>
              <input
                id="reset-confirm-password"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                className="mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)]"
              />
            </div>

            {errorParam ? (
              <p className="border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
                {errorParam === "password_mismatch"
                  ? copy.passwordMismatch
                  : errorParam === "missing_token"
                    ? copy.passwordResetMissingToken
                    : decodeURIComponent(errorParam)}
              </p>
            ) : null}

            <button
              className="w-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-4 py-3 text-sm font-medium lowercase text-[var(--accent-text)] transition hover:bg-transparent hover:text-[var(--accent-surface)]"
              type="submit"
            >
              {copy.passwordResetButtonConfirm}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            className="text-sm lowercase text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            href={withLang("/admin/sign-in", lang)}
          >
            {copy.signInBackLink}
          </Link>
        </div>
      </div>
    </main>
  );
}
