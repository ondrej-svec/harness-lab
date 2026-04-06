import Link from "next/link";
import { redirect } from "next/navigation";
import { getNeonAuthAsync } from "@/lib/auth/server";
import { adminCopy, resolveUiLanguage, withLang } from "@/lib/ui-language";
import { ThemeSwitcher } from "@/app/components/theme-switcher";

export const dynamic = "force-dynamic";

async function signInAction(formData: FormData) {
  "use server";

  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const auth = await getNeonAuthAsync();
  if (!auth) {
    redirect(withLang("/admin/sign-in?error=unavailable", lang));
    return;
  }

  const result = await auth.signIn.email({ email, password });

  if (result.error) {
    console.error("[facilitator-sign-in] error:", JSON.stringify(result.error));
    redirect(withLang("/admin/sign-in?error=invalid", lang));
    return;
  }

  redirect(withLang("/admin", lang));
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; lang?: string }>;
}) {
  const params = await searchParams;
  const lang = resolveUiLanguage(params?.lang);
  const copy = adminCopy[lang];
  const hasError = params?.error === "invalid";
  const isUnavailable = params?.error === "unavailable";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <Link
            className="text-sm font-medium lowercase tracking-[0.12em] text-[var(--text-primary)]"
            href={withLang("/", lang)}
          >
            harness lab
          </Link>
          <ThemeSwitcher />
        </div>

        <div className="border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8">
          <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--text-muted)]">
            {copy.deskEyebrow}
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            {copy.signInTitle}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {copy.signInBody}
          </p>

          {isUnavailable ? (
            <p className="mt-6 border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
              Neon Auth is not configured.
            </p>
          ) : (
            <form action={signInAction} method="post" autoComplete="on" className="mt-8 space-y-5">
              <input name="lang" type="hidden" value={lang} />

              <div>
                <label
                  className="block text-[11px] lowercase tracking-[0.18em] text-[var(--text-muted)]"
                  htmlFor="sign-in-email"
                >
                  {copy.signInEmailLabel}
                </label>
                <input
                  className="mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)]"
                  id="sign-in-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="facilitator@example.com"
                />
              </div>

              <div>
                <label
                  className="block text-[11px] lowercase tracking-[0.18em] text-[var(--text-muted)]"
                  htmlFor="sign-in-password"
                >
                  {copy.signInPasswordLabel}
                </label>
                <input
                  className="mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)]"
                  id="sign-in-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  aria-label="password"
                />
              </div>

              {hasError ? (
                <p className="border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
                  {copy.signInError}
                </p>
              ) : null}

              <button
                className="w-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-4 py-3 text-sm font-medium lowercase text-[var(--accent-text)] transition hover:bg-transparent hover:text-[var(--accent-surface)]"
                type="submit"
              >
                {copy.signInButton}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            className="text-sm lowercase text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            href={withLang("/", lang)}
          >
            {copy.signInBackLink}
          </Link>
        </div>
      </div>
    </main>
  );
}
