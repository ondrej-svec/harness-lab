import { NextResponse } from "next/server";
import { getParticipantSessionCookieOptions, participantSessionCookieName } from "@/lib/event-access";
import { guardedRedeemEventCode } from "@/lib/redeem-guard";
import { untrustedOriginResponse } from "@/lib/request-integrity";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let eventCode = "";
  let displayName: string | undefined;
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { eventCode?: string; displayName?: string };
    eventCode = String(body.eventCode ?? "");
    if (typeof body.displayName === "string" && body.displayName.trim().length > 0) {
      displayName = body.displayName;
    }
  } else {
    const form = await request.formData();
    eventCode = String(form.get("eventCode") ?? "");
    const formName = form.get("displayName");
    if (typeof formName === "string" && formName.trim().length > 0) {
      displayName = formName;
    }
  }

  const result = await guardedRedeemEventCode(eventCode, displayName, request);

  if (!result.ok) {
    if (result.reason === "untrusted_origin") {
      return untrustedOriginResponse();
    }
    if (result.reason === "rate_limited") {
      if (contentType.includes("application/json")) {
        return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
      }
      const url = new URL("/", request.url);
      url.searchParams.set("eventAccess", "rate_limited");
      return NextResponse.redirect(url, { status: 303 });
    }
    const status = result.reason === "invalid_display_name" ? 400 : 401;
    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: false, error: result.reason }, { status });
    }
    const url = new URL("/", request.url);
    url.searchParams.set("eventAccess", result.reason);
    return NextResponse.redirect(url, { status: 303 });
  }

  const response = contentType.includes("application/json")
    ? NextResponse.json({
        ok: true,
        instanceId: result.session.instanceId,
        expiresAt: result.session.expiresAt,
        participantId: result.session.participantId,
      })
    : NextResponse.redirect(new URL("/", request.url), { status: 303 });

  response.cookies.set(
    participantSessionCookieName,
    result.session.token,
    getParticipantSessionCookieOptions(new Date(result.session.expiresAt)),
  );

  return response;
}
