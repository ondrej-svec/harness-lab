import { NextResponse, type NextRequest } from "next/server";

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
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const credentials = decodeBasicAuth(request.headers.get("authorization"));
    const expectedUsername = process.env.HARNESS_ADMIN_USERNAME ?? "facilitator";
    const expectedPassword = process.env.HARNESS_ADMIN_PASSWORD ?? "secret";

    if (!credentials || credentials.username !== expectedUsername || credentials.password !== expectedPassword) {
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

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return response;
}
