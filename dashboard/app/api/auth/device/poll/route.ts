import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  getDeviceAuthFingerprint,
  isDeviceAuthRateLimited,
  recordDeviceAuthFailure,
} from "@/lib/device-auth-rate-limit";
import { pollDeviceAuthorization } from "@/lib/facilitator-cli-auth-repository";
import { emitRuntimeAlert } from "@/lib/runtime-alert";

export async function POST(request: Request) {
  if (!auth) {
    return NextResponse.json({ error: "device_auth_unavailable" }, { status: 503 });
  }

  const fingerprint = getDeviceAuthFingerprint(request);
  if (isDeviceAuthRateLimited(fingerprint)) {
    emitRuntimeAlert({
      category: "device_auth_rate_limited",
      severity: "warning",
      instanceId: null,
    });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = (await request.json()) as { deviceCode?: string };
  if (!body.deviceCode) {
    recordDeviceAuthFailure(fingerprint);
    return NextResponse.json({ error: "deviceCode is required" }, { status: 400 });
  }

  const result = await pollDeviceAuthorization(body.deviceCode);

  // `authorization_pending` is the normal polling state — not a failure.
  // Only record true failures: invalid/expired codes or denied access.
  if (
    result.status === "invalid_device_code" ||
    result.status === "expired_token" ||
    result.status === "access_denied"
  ) {
    recordDeviceAuthFailure(fingerprint);
  }

  return NextResponse.json(result, { status: result.status === "invalid_device_code" ? 400 : 200 });
}
