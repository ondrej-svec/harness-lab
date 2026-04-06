import { NextResponse } from "next/server";
import { participantSessionCookieName, redeemEventCode } from "@/lib/event-access";
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

  if (await isRedeemRateLimited(request)) {
    emitRuntimeAlert({
      category: "participant_redeem_rate_limited",
      severity: "warning",
      instanceId: getCurrentWorkshopInstanceId(),
    });
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const eventCode =
    contentType.includes("application/json")
      ? String(((await request.json()) as { eventCode?: string }).eventCode ?? "")
      : String((await request.formData()).get("eventCode") ?? "");

  const result = await redeemEventCode(eventCode);
  await recordRedeemAttempt(request, result.ok ? "success" : "failure");

  if (!result.ok) {
    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: false, error: result.reason }, { status: 401 });
    }

    const url = new URL("/", request.url);
    url.searchParams.set("eventAccess", result.reason);
    return NextResponse.redirect(url, { status: 303 });
  }

  const response = contentType.includes("application/json")
    ? NextResponse.json({ ok: true, expiresAt: result.session.expiresAt })
    : NextResponse.redirect(new URL("/", request.url), { status: 303 });

  response.cookies.set(participantSessionCookieName, result.session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(result.session.expiresAt),
  });

  return response;
}
