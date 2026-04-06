import { NextResponse } from "next/server";
import { participantSessionCookieName, revokeParticipantSession } from "@/lib/event-access";

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
  await revokeParticipantSession(readCookieValue(request));

  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.set(participantSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
