import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { getParticipantSessionCookieOptions, participantSessionCookieName, redeemEventCode } from "@/lib/event-access";
import { isTrustedOrigin, untrustedOriginResponse } from "@/lib/request-integrity";
import { isRedeemRateLimited, recordRedeemAttempt } from "@/lib/redeem-rate-limit";
import { getCurrentWorkshopInstanceId } from "@/lib/instance-context";
import { emitRuntimeAlert } from "@/lib/runtime-alert";

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

  const botCheck = await checkBotId();
  if (botCheck.isBot) {
    emitRuntimeAlert({
      category: "participant_redeem_bot_signal",
      severity: "warning",
      instanceId: getCurrentWorkshopInstanceId(),
    });
  }

  if (await isRedeemRateLimited(request)) {
    emitRuntimeAlert({
      category: "participant_redeem_rate_limited",
      severity: "warning",
      instanceId: getCurrentWorkshopInstanceId(),
    });
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

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

  const result = await redeemEventCode(eventCode, displayName);
  await recordRedeemAttempt(request, result.ok ? "success" : "failure");

  if (!result.ok) {
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
