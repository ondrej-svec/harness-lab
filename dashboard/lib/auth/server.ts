/**
 * Neon Auth server instance for facilitator authentication.
 *
 * Requires:
 *   NEON_AUTH_BASE_URL   — Neon Auth endpoint (from Neon Console → Branch → Auth → Configuration)
 *   NEON_AUTH_COOKIE_SECRET — 32+ char secret for session cookie signing
 *
 * Only initialized when both env vars are present (production/preview with HARNESS_STORAGE_MODE=neon).
 * In file-mode local dev, facilitator auth falls back to legacy Basic Auth.
 *
 * The import of @neondatabase/auth is lazy (dynamic import) to avoid breaking vitest,
 * which cannot resolve next/headers at the module level.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NeonAuthInstance = any;

let _auth: NeonAuthInstance | null | undefined = undefined;

export function getNeonAuth(): NeonAuthInstance | null {
  if (_auth !== undefined) return _auth;

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (!baseUrl || !cookieSecret) {
    _auth = null;
    return null;
  }

  // Synchronous fallback: return null on first call, initialize async.
  // The auth instance is only needed when env vars are set (neon mode),
  // and the first call triggers lazy loading.
  _auth = null;
  return null;
}

let _initPromise: Promise<NeonAuthInstance | null> | null = null;

/**
 * Async version that ensures the Neon Auth SDK is loaded.
 * Use this in server components and server actions.
 */
export async function getNeonAuthAsync(): Promise<NeonAuthInstance | null> {
  if (_auth !== undefined && _auth !== null) return _auth;

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (!baseUrl || !cookieSecret) {
    _auth = null;
    return null;
  }

  if (!_initPromise) {
    _initPromise = (async () => {
      const { createNeonAuth } = await import("@neondatabase/auth/next/server");
      const instance = createNeonAuth({
        baseUrl,
        cookies: { secret: cookieSecret },
      });
      _auth = instance;
      return instance;
    })();
  }

  return _initPromise;
}

/**
 * Returns the Neon Auth instance or throws if unavailable.
 */
export async function requireNeonAuth() {
  const auth = await getNeonAuthAsync();
  if (!auth) {
    throw new Error(
      "Neon Auth is not configured. Set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET.",
    );
  }
  return auth;
}
