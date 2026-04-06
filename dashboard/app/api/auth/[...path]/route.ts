import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";

function notConfiguredResponse() {
  return NextResponse.json(
    { error: "Neon Auth is not configured" },
    { status: 503 },
  );
}

export const GET = auth
  ? auth.handler().GET
  : () => notConfiguredResponse();

export const POST = auth
  ? auth.handler().POST
  : () => notConfiguredResponse();
