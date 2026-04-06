import { NextResponse, type NextRequest } from "next/server";
import { hasValidAdminCredentials, isProtectedPath } from "@/lib/admin-auth";

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Harness Lab Admin"',
    },
  });
}

export function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname, request.method)) {
    return NextResponse.next();
  }

  if (!hasValidAdminCredentials({
    authorizationHeader: request.headers.get("authorization"),
    configuredPassword: process.env.HARNESS_ADMIN_PASSWORD,
    configuredUsername: process.env.HARNESS_ADMIN_USERNAME,
  })) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
