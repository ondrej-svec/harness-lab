import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { denyDeviceAuthorization } from "@/lib/facilitator-cli-auth-repository";

export async function POST(request: Request) {
  if (!auth) {
    return NextResponse.json({ error: "device_auth_unavailable" }, { status: 503 });
  }

  const body = (await request.json()) as { userCode?: string };
  if (!body.userCode) {
    return NextResponse.json({ error: "userCode is required" }, { status: 400 });
  }

  const result = await denyDeviceAuthorization(body.userCode);
  return NextResponse.json(result, { status: result.ok ? 200 : 404 });
}
