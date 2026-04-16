import { NextResponse } from "next/server";
import {
  bindParticipantToSession,
  getParticipantSessionWithTokenHash,
  participantSessionCookieName,
} from "@/lib/event-access";
import { isTrustedOrigin, untrustedOriginResponse } from "@/lib/request-integrity";
import { getCurrentWorkshopInstanceId } from "@/lib/instance-context";
import { emitRuntimeAlert } from "@/lib/runtime-alert";

/**
 * POST /api/event-access/identify
 *
 * Bind a name to an already-authenticated participant session. For
 * participants who redeemed the event code without providing a name and
 * are self-identifying after the fact (Phase 4 UI). Idempotent if the
 * same name is submitted on an already-bound session; rejects rebinding
 * to a different identity with 409.
 *
 * Body (JSON or form): { displayName: string }
 * Returns: 200 { ok: true, participantId } | 400 invalid_display_name
 *          | 401 no_session | 409 already_bound
 */
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

  // Pull the session cookie directly from the request header so this route
  // works the same way the redeem route does — no next/headers dependency
  // in the body of the handler.
  const rawCookie = request.headers.get("cookie") ?? "";
  const token = readCookieValue(rawCookie, participantSessionCookieName);
  const bundle = await getParticipantSessionWithTokenHash(token);
  if (!bundle) {
    return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let displayName = "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as { displayName?: unknown };
    displayName = typeof body.displayName === "string" ? body.displayName : "";
  } else {
    const form = await request.formData();
    displayName = String(form.get("displayName") ?? "");
  }

  const result = await bindParticipantToSession(bundle.session, bundle.tokenHash, displayName);
  if (!result.ok) {
    if (result.reason === "invalid_display_name") {
      return NextResponse.json({ ok: false, error: "invalid_display_name" }, { status: 400 });
    }
    if (result.reason === "already_bound") {
      emitRuntimeAlert({
        category: "participant_identify_rebind_attempt",
        severity: "warning",
        instanceId: bundle.session.instanceId ?? getCurrentWorkshopInstanceId(),
      });
      return NextResponse.json({ ok: false, error: "already_bound" }, { status: 409 });
    }
  }

  return NextResponse.json({ ok: true, participantId: (result as { ok: true; participantId: string }).participantId });
}

function readCookieValue(rawCookie: string, cookieName: string): string | null {
  if (!rawCookie) return null;
  const entry = rawCookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`));
  return entry ? decodeURIComponent(entry.slice(cookieName.length + 1)) : null;
}
