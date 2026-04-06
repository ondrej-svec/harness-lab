import { NextResponse, type NextRequest } from "next/server";
import { resolveUiLanguage, uiLanguageCookieName } from "@/lib/ui-language";

/**
 * Neon Auth session cookie name.
 * When present, the facilitator has an active session (validated server-side).
 */
const NEON_AUTH_SESSION_COOKIE = "session_token";

/**
 * Check if Neon Auth is configured (middleware runs in Edge, so we check env directly).
 */
function isNeonAuthEnabled() {
  return Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);
}

export async function middleware(request: NextRequest) {
  const urlLanguage = request.nextUrl.searchParams.get("lang") ?? undefined;
  const cookieLanguage = request.cookies.get(uiLanguageCookieName)?.value;
  const resolvedLanguage = resolveUiLanguage(urlLanguage ?? cookieLanguage);

  // Protect /admin routes (but not /admin/sign-in itself)
  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/sign-in")) {
    if (isNeonAuthEnabled()) {
      // Neon Auth mode: redirect to sign-in if no session cookie
      const hasSession = request.cookies.has(NEON_AUTH_SESSION_COOKIE);
      if (!hasSession) {
        const signInUrl = new URL("/admin/sign-in", request.url);
        if (resolvedLanguage !== "cs") {
          signInUrl.searchParams.set("lang", resolvedLanguage);
        }
        return NextResponse.redirect(signInUrl);
      }
    }
    // File-mode: no middleware gate — requireFacilitatorPageAccess handles auth server-side
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-harness-ui-lang", resolvedLanguage);

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
