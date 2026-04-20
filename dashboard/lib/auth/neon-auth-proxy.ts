import { cookies } from "next/headers";

/**
 * Server-side raw-fetch wrappers around the Neon Auth REST endpoints.
 *
 * Why this exists, in plain language: the Neon Auth SDK
 * (`@neondatabase/auth/next/server`) doesn't reliably forward an
 * `Origin` header when called from inside a Next server action /
 * route handler / Server Component. Better-auth's CSRF check rejects
 * those requests with `Invalid origin` (HTTP 403). Symptom:
 * `auth.getSession()`, `auth.signIn.email()`, `auth.requestPasswordReset()`,
 * and the `auth.admin.*` operations all silently fail outside a
 * Vercel-fronted deployment.
 *
 * This proxy bypasses the SDK and hits Neon Auth's REST endpoints
 * directly with explicit `Origin: <NEON_AUTH_BASE_URL origin>`. It
 * also forwards browser cookies (so session-scoped calls like
 * `getSession` and `admin.*` work) and forwards Set-Cookie headers
 * back to the participant/facilitator browser when the upstream
 * issues new ones (`signOut`).
 *
 * Cookie forwarding preserves the Secure / SameSite attributes
 * verbatim. Browsers and Playwright follow standard rules for those.
 * The HTTP-localhost gap (Secure cookies refused over HTTP) is
 * handled by tests that attach Cookie via the request fixture
 * directly — see `e2e/neon-mode/facilitator-reset.spec.ts`.
 */

function baseUrl(): string {
  const v = process.env.NEON_AUTH_BASE_URL;
  if (!v) throw new Error("NEON_AUTH_BASE_URL is required for neon-auth-proxy");
  return v.replace(/\/$/, "");
}

function origin(): string {
  return new URL(baseUrl()).origin;
}

async function buildCookieHeader(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

async function forwardSetCookies(setCookies: string[]): Promise<void> {
  const store = await cookies();
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
    store.set(name, value, opts);
  }
}

export type NeonSessionUser = {
  id: string;
  email?: string;
  name?: string | null;
  role?: string | null;
  emailVerified?: boolean;
};

export type NeonSession = {
  user: NeonSessionUser;
  session?: { id?: string };
};

export type GetSessionResult = { data: NeonSession | null; error?: string };

/**
 * Proxy for `auth.getSession()`. Reads the request's cookies via
 * next/headers, forwards them with Origin to the upstream
 * `/get-session` endpoint, returns the session shape the SDK uses so
 * existing call sites can swap with minimal churn.
 */
export async function getSession(): Promise<GetSessionResult> {
  const cookie = await buildCookieHeader();
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/get-session`, {
      headers: { origin: origin(), cookie },
    });
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
  if (!response.ok) {
    return { data: null, error: `${response.status} ${response.statusText}` };
  }
  const body = (await response.json().catch(() => null)) as NeonSession | null;
  return { data: body && body.user ? body : null };
}

/**
 * Proxy for `auth.signOut()`. Forwards the upstream Set-Cookie
 * headers (which clear the session cookie) onto the response so the
 * caller's browser actually loses its session.
 */
export async function signOut(): Promise<{ ok: boolean; error?: string }> {
  const cookie = await buildCookieHeader();
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/sign-out`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: origin(), cookie },
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  if (response.ok) {
    const setCookies = response.headers.getSetCookie?.() ?? [];
    await forwardSetCookies(setCookies);
  }
  return { ok: response.ok };
}

/**
 * Proxy for `auth.requestPasswordReset()`. No cookie forwarding —
 * password reset is unauthenticated.
 */
export async function requestPasswordReset(opts: {
  email: string;
  redirectTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/request-password-reset`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: origin() },
      body: JSON.stringify(opts),
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    return { ok: false, error: body.message ?? `${response.status} ${response.statusText}` };
  }
  return { ok: true };
}

/**
 * Admin operations — all require the caller's request to carry an
 * admin-role Neon Auth session cookie. The proxy forwards cookies
 * automatically; callers don't need to thread anything through.
 */
export const admin = {
  async setUserPassword(opts: { userId: string; newPassword: string }): Promise<{
    ok: boolean;
    reason?: "not_admin" | "not_found" | "unknown";
    error?: string;
  }> {
    const cookie = await buildCookieHeader();
    let response: Response;
    try {
      response = await fetch(`${baseUrl()}/admin/set-user-password`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: origin(), cookie },
        body: JSON.stringify(opts),
      });
    } catch (e) {
      return { ok: false, reason: "unknown", error: e instanceof Error ? e.message : String(e) };
    }
    if (response.ok) return { ok: true };
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    const msg = (body.message ?? "").toLowerCase();
    if (response.status === 401 || response.status === 403 || msg.includes("admin") || msg.includes("forbidden")) {
      return { ok: false, reason: "not_admin", error: body.message };
    }
    if (response.status === 404 || msg.includes("not found")) {
      return { ok: false, reason: "not_found", error: body.message };
    }
    return { ok: false, reason: "unknown", error: body.message ?? `${response.status}` };
  },

  async revokeUserSessions(opts: { userId: string }): Promise<{ ok: boolean }> {
    const cookie = await buildCookieHeader();
    try {
      const response = await fetch(`${baseUrl()}/admin/revoke-user-sessions`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: origin(), cookie },
        body: JSON.stringify(opts),
      });
      return { ok: response.ok };
    } catch {
      return { ok: false };
    }
  },
};
