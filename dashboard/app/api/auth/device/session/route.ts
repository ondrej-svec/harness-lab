import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getCliSessionFromBearerToken, parseBearerToken } from "@/lib/facilitator-cli-auth-repository";

export async function GET(request: Request) {
  if (!auth) {
    return NextResponse.json({ error: "device_auth_unavailable" }, { status: 503 });
  }

  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "bearer_token_required" }, { status: 401 });
  }

  const session = await getCliSessionFromBearerToken(token);
  if (!session) {
    return NextResponse.json({ error: "invalid_session" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, session });
}
