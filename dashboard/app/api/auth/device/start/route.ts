import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { startDeviceAuthorization } from "@/lib/facilitator-cli-auth-repository";

export async function POST() {
  if (!auth) {
    return NextResponse.json({ error: "device_auth_unavailable" }, { status: 503 });
  }

  return NextResponse.json(await startDeviceAuthorization());
}
