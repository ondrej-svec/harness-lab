import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { parseBearerToken, revokeCliSessionFromBearerToken } from "@/lib/facilitator-cli-auth-repository";

export async function POST(request: Request) {
  if (!auth) {
    return NextResponse.json({ error: "device_auth_unavailable" }, { status: 503 });
  }

  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "bearer_token_required" }, { status: 401 });
  }

  const result = await revokeCliSessionFromBearerToken(token);
  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}
