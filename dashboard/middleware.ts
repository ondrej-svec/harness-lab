import { NextResponse, type NextRequest } from "next/server";
import { resolveUiLanguage, uiLanguageCookieName } from "@/lib/ui-language";

function decodeBasicAuth(header: string | null) {
  if (!header?.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = atob(header.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const urlLanguage = request.nextUrl.searchParams.get("lang") ?? undefined;
  const cookieLanguage = request.cookies.get(uiLanguageCookieName)?.value;
  const resolvedLanguage = resolveUiLanguage(urlLanguage ?? cookieLanguage);

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!decodeBasicAuth(request.headers.get("authorization"))) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Harness Lab Admin"',
        },
      });
    }
  }

  const requestHeaders = new Headers(request.headers);
  const authorization = request.headers.get("authorization");

  if (authorization) {
    requestHeaders.set("x-harness-authorization", authorization);
  }
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
