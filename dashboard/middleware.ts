import { NextResponse, type NextRequest } from "next/server";

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}

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
  const credentials = decodeBasicAuth(authorization);

  if (authorization) {
    requestHeaders.set("x-harness-authorization", authorization);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (credentials) {
    response.cookies.set("harness_facilitator_username", credentials.username, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    response.cookies.set("harness_facilitator_password_hash", await sha256(credentials.password), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  } else {
    response.cookies.delete("harness_facilitator_username");
    response.cookies.delete("harness_facilitator_password_hash");
  }

  return response;
}
