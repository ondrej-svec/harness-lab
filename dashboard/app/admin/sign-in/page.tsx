import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { adminCopy, resolveUiLanguage, withLang } from "@/lib/ui-language";
import { ThemeSwitcher } from "@/app/components/theme-switcher";

export const dynamic = "force-dynamic";

async function signInAction(formData: FormData) {
  "use server";

  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!auth) {
    redirect(withLang("/admin/sign-in?error=unavailable", lang));
  }

  const { error } = await auth.signIn.email({ email, password });

  if (error) {
    console.error("[facilitator-sign-in] error:", JSON.stringify(error));
    redirect(withLang(`/admin/sign-in?error=${encodeURIComponent(error.message || "invalid")}`, lang));
  }

  // Verify session was created (matches official Neon Auth pattern)
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect(withLang("/admin/sign-in?error=session_not_created", lang));
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
  const errorParam = params?.error;

  // If already authenticated, redirect to admin
  if (auth) {
    const { data: session } = await auth.getSession();
    if (session?.user) {
      redirect(withLang("/admin", lang));
    }
  }

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
