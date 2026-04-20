import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkBotId } from "botid/server";
import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { auth } from "@/lib/auth/server";
import {
  getSession as proxyGetSession,
  requestPasswordReset as proxyRequestPasswordReset,
} from "@/lib/auth/neon-auth-proxy";
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

  // Test environments (Playwright Neon mode) bypass the Vercel BotId
  // check because there's no OIDC token issuer locally. Same gate as
  // the redeem path — gated by an explicit env var.
  const botCheck = process.env.HARNESS_BYPASS_BOT_CHECK === "1"
    ? { isBot: false, isHuman: true, isVerifiedBot: false, bypassed: true }
    : await checkBotId();
  if (botCheck.isBot) {
    return redirect(withLang("/admin/sign-in?error=denied", lang));
  }

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!auth || !baseUrl) {
    return redirect(withLang("/admin/sign-in?error=unavailable", lang));
  }

  // Use raw fetch with explicit Origin instead of `auth.signIn.email`.
  // The SDK's server-side proxy doesn't reliably forward an Origin
  // header, and Neon Auth's CSRF check rejects requests without one
  // ("Invalid origin"). Same workaround as `authenticateParticipant`
  // in lib/participant-auth.ts.
  const origin = new URL(baseUrl).origin;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    console.error("[facilitator-sign-in] error:", body.message ?? response.statusText);
    return redirect(withLang(`/admin/sign-in?error=${encodeURIComponent(body.message || "invalid")}`, lang));
  }

  // Forward Set-Cookie headers from the upstream response onto the
  // outgoing redirect so the browser receives the Neon Auth session.
  // We preserve the upstream's Secure / SameSite flags verbatim —
  // browsers enforce these correctly in production. Tests that need
  // to reach admin endpoints over HTTP read the cookie from the
  // context and attach it as an explicit `Cookie` header to bypass
  // browser-level enforcement (Playwright request fixture).
  const setCookies = response.headers.getSetCookie?.() ?? [];
  const cookieStore = await cookies();
  for (const header of setCookies) {
    const [pair, ...attrs] = header.split(";").map((s) => s.trim());
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    const opts: Record<string, unknown> = { path: "/", httpOnly: true, sameSite: "lax" };
    for (const attr of attrs) {
      const [k, v] = attr.split("=");
      const lower = k.toLowerCase();
      if (lower === "httponly") opts.httpOnly = true;
      else if (lower === "secure") opts.secure = true;
      else if (lower === "samesite") opts.sameSite = (v ?? "lax").toLowerCase();
      else if (lower === "max-age") opts.maxAge = Number(v);
      else if (lower === "path") opts.path = v;
    }
    cookieStore.set(name, value, opts);
  }

  return redirect(withLang("/admin", lang));
}

export async function requestPasswordResetAction(formData: FormData) {
  "use server";

  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const email = String(formData.get("email") ?? "").trim();

  // Test environments bypass — same gate as signInAction.
  const botCheck = process.env.HARNESS_BYPASS_BOT_CHECK === "1"
    ? { isBot: false, isHuman: true, isVerifiedBot: false, bypassed: true }
    : await checkBotId();
  if (botCheck.isBot) {
    return redirect(withLang("/admin/sign-in?error=denied", lang));
  }

  if (!process.env.NEON_AUTH_BASE_URL) {
    return redirect(withLang("/admin/sign-in?error=unavailable", lang));
  }

  const requestOrigin = await getRequestOrigin();
  const redirectTo = requestOrigin ? `${requestOrigin}${withLang("/admin/reset-password", lang)}` : undefined;
  const result = await proxyRequestPasswordReset({ email, redirectTo });
  if (!result.ok) {
    console.error("[facilitator-password-reset] error:", result.error);
    return redirect(withLang(`/admin/sign-in?error=${encodeURIComponent(result.error || "reset_failed")}`, lang));
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

  // If already authenticated, redirect to admin.
  if (process.env.NEON_AUTH_BASE_URL) {
    const { data: session } = await proxyGetSession();
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
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8 shadow-[var(--shadow-soft)]">
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
              <p className="mt-6 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)]">
                {resetParam === "done" ? copy.passwordResetDone : copy.passwordResetSent}
              </p>
            ) : null}

            {errorParam === "unavailable" ? (
              <p className="mt-6 rounded-[20px] border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
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
                    className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)]"
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
                    className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)]"
                    id="sign-in-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </div>

                {errorParam && errorParam !== "unavailable" ? (
                  <p className="rounded-[20px] border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
                    {errorParam === "invalid" ? copy.signInError : decodeURIComponent(errorParam)}
                  </p>
                ) : null}

                <AdminSubmitButton
                  className="w-full rounded-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-4 py-3 text-sm font-medium lowercase text-[var(--accent-text)] transition hover:bg-transparent hover:text-[var(--accent-surface)]"
                >
                  {copy.signInButton}
                </AdminSubmitButton>
              </form>
            )}
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-6 sm:p-8 shadow-[var(--shadow-soft)]">
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
                  className="mt-2 w-full rounded-[16px] border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)]"
                  id="reset-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="facilitator@example.com"
                />
              </div>

              <AdminSubmitButton
                className="w-full rounded-full border border-[var(--border-strong)] px-4 py-3 text-sm font-medium lowercase text-[var(--text-primary)] transition hover:bg-[var(--surface)]"
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
