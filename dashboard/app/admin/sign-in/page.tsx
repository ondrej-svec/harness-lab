import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { auth } from "@/lib/auth/server";
import { adminCopy, resolveUiLanguage, withLang } from "@/lib/ui-language";
import { ThemeSwitcher } from "@/app/components/theme-switcher";

export const dynamic = "force-dynamic";

export async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");

  if (!host) {
    return null;
  }

  return `${proto}://${host}`;
}

export async function signInAction(formData: FormData) {
  "use server";

  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!auth) {
    return redirect(withLang("/admin/sign-in?error=unavailable", lang));
  }

  const { error } = await auth.signIn.email({ email, password });

  if (error) {
    console.error("[facilitator-sign-in] error:", JSON.stringify(error));
    return redirect(withLang(`/admin/sign-in?error=${encodeURIComponent(error.message || "invalid")}`, lang));
  }

  // Verify session was created (matches official Neon Auth pattern)
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return redirect(withLang("/admin/sign-in?error=session_not_created", lang));
  }

  return redirect(withLang("/admin", lang));
}

export async function requestPasswordResetAction(formData: FormData) {
  "use server";

  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const email = String(formData.get("email") ?? "").trim();

  if (!auth) {
    return redirect(withLang("/admin/sign-in?error=unavailable", lang));
  }

  const origin = await getRequestOrigin();
  const redirectTo = origin ? `${origin}${withLang("/admin/reset-password", lang)}` : undefined;
  const { error } = await auth.requestPasswordReset({
    email,
    redirectTo,
  });

  if (error) {
    console.error("[facilitator-password-reset] error:", JSON.stringify(error));
    return redirect(withLang(`/admin/sign-in?error=${encodeURIComponent(error.message || "reset_failed")}`, lang));
  }

  return redirect(withLang("/admin/sign-in?reset=requested", lang));
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; lang?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const lang = resolveUiLanguage(params?.lang);
  const copy = adminCopy[lang];
  const errorParam = params?.error;
  const resetParam = params?.reset;

  // If already authenticated, redirect to admin
  if (auth) {
    const { data: session } = await auth.getSession();
    if (session?.user) {
      return redirect(withLang("/admin", lang));
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-6 py-10">
      <div className="w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            className="text-sm font-medium lowercase tracking-[0.12em] text-[var(--text-primary)]"
            href={withLang("/", lang)}
          >
            harness lab
          </Link>
          <ThemeSwitcher />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
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

            {resetParam === "requested" || resetParam === "done" ? (
              <p className="mt-6 border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)]">
                {resetParam === "done" ? copy.passwordResetDone : copy.passwordResetSent}
              </p>
            ) : null}

            {errorParam === "unavailable" ? (
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
                  />
                </div>

                {errorParam && errorParam !== "unavailable" ? (
                  <p className="border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
                    {errorParam === "invalid" ? copy.signInError : decodeURIComponent(errorParam)}
                  </p>
                ) : null}

                <AdminSubmitButton
                  className="w-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-4 py-3 text-sm font-medium lowercase text-[var(--accent-text)] transition hover:bg-transparent hover:text-[var(--accent-surface)]"
                >
                  {copy.signInButton}
                </AdminSubmitButton>
              </form>
            )}
          </div>

          <div className="border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8">
            <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--text-muted)]">
              {copy.passwordResetTitle}
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              {copy.resetHelpTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {copy.resetHelpBody}
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
              {copy.passwordResetBody}
            </p>

            <form action={requestPasswordResetAction} method="post" autoComplete="on" className="mt-8 space-y-5">
              <input name="lang" type="hidden" value={lang} />
              <div>
                <label
                  className="block text-[11px] lowercase tracking-[0.18em] text-[var(--text-muted)]"
                  htmlFor="reset-email"
                >
                  {copy.signInEmailLabel}
                </label>
                <input
                  className="mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)]"
                  id="reset-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="facilitator@example.com"
                />
              </div>

              <AdminSubmitButton
                className="w-full border border-[var(--border-strong)] px-4 py-3 text-sm font-medium lowercase text-[var(--text-primary)] transition hover:bg-[var(--surface)]"
              >
                {copy.passwordResetButton}
              </AdminSubmitButton>
            </form>
          </div>
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
