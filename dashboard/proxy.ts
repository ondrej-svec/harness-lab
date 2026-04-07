import { NextResponse, type NextRequest } from "next/server";
import { resolveUiLanguage, uiLanguageCookieName } from "@/lib/ui-language";

/**
 * Neon Auth session cookie names.
 * Better Auth uses __Secure- prefix on HTTPS (production) and plain names on HTTP (dev).
 */
const NEON_AUTH_SESSION_COOKIES = [
  "__Secure-neon-auth.session_token",  // HTTPS (Vercel production/preview)
  "neon-auth.session_token",            // HTTP fallback (local dev)
  "session_token",                      // Legacy/plain name
];

/**
 * Check if Neon Auth is configured (proxy runs before the app, so we check env directly).
 */
function isNeonAuthEnabled() {
  return Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);
}

export async function proxy(request: NextRequest) {
  const urlLanguage = request.nextUrl.searchParams.get("lang") ?? undefined;
  const cookieLanguage = request.cookies.get(uiLanguageCookieName)?.value;
  const resolvedLanguage = resolveUiLanguage(urlLanguage ?? cookieLanguage);

  // Protect /admin routes (but not /admin/sign-in itself)
  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/sign-in")) {
    if (isNeonAuthEnabled()) {
      // Neon Auth mode: redirect to sign-in if no session cookie
      const hasSession = NEON_AUTH_SESSION_COOKIES.some((name) => request.cookies.has(name));
      if (!hasSession) {
        const signInUrl = new URL("/admin/sign-in", request.url);
        if (resolvedLanguage !== "cs") {
          signInUrl.searchParams.set("lang", resolvedLanguage);
        }
        return NextResponse.redirect(signInUrl);
      }
    }
    // File-mode: no proxy gate — requireFacilitatorPageAccess handles auth server-side
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-harness-ui-lang", resolvedLanguage);

  // Forward Authorization header for file-mode Basic Auth fallback
  if (!isNeonAuthEnabled()) {
    const authorization = request.headers.get("authorization");
    if (authorization) {
      requestHeaders.set("x-harness-authorization", authorization);
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (urlLanguage) {
    response.cookies.set(uiLanguageCookieName, resolvedLanguage, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
