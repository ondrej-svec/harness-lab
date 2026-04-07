import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { pollDeviceAuthorization } from "@/lib/facilitator-cli-auth-repository";

export async function POST(request: Request) {
  if (!auth) {
    return NextResponse.json({ error: "device_auth_unavailable" }, { status: 503 });
  }

  const body = (await request.json()) as { deviceCode?: string };
  if (!body.deviceCode) {
    return NextResponse.json({ error: "deviceCode is required" }, { status: 400 });
  }

  const result = await pollDeviceAuthorization(body.deviceCode);
  return NextResponse.json(result, { status: result.status === "invalid_device_code" ? 400 : 200 });
}
