import { NextResponse } from "next/server";
import { getParticipantSessionCookieOptions, participantSessionCookieName, revokeParticipantSession } from "@/lib/event-access";
import { isTrustedOrigin, untrustedOriginResponse } from "@/lib/request-integrity";

function readCookieValue(request: Request) {
  const rawCookie = request.headers.get("cookie");
  if (!rawCookie) {
    return null;
  }

  const value = rawCookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${participantSessionCookieName}=`));

  return value ? decodeURIComponent(value.slice(participantSessionCookieName.length + 1)) : null;
}

export async function POST(request: Request) {
  if (
    !isTrustedOrigin({
      originHeader: request.headers.get("origin"),
      hostHeader: request.headers.get("host"),
      forwardedHostHeader: request.headers.get("x-forwarded-host"),
      requestUrl: request.url,
    })
  ) {
    return untrustedOriginResponse();
  }

  await revokeParticipantSession(readCookieValue(request));

  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.set(participantSessionCookieName, "", getParticipantSessionCookieOptions(new Date(0)));

  return response;
}
