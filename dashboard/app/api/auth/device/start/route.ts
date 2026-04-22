import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  getDeviceAuthFingerprint,
  isDeviceAuthRateLimited,
  recordDeviceAuthFailure,
} from "@/lib/device-auth-rate-limit";
import { startDeviceAuthorization } from "@/lib/facilitator-cli-auth-repository";
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

  try {
    return NextResponse.json(await startDeviceAuthorization(new URL(request.url).origin));
  } catch (error) {
    recordDeviceAuthFailure(fingerprint);
    throw error;
  }
}
