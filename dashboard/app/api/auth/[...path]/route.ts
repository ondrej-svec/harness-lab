import { getNeonAuthAsync } from "@/lib/auth/server";
import { NextResponse } from "next/server";

function notConfiguredResponse() {
  return NextResponse.json(
    { error: "Neon Auth is not configured" },
    { status: 503 },
  );
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const auth = await getNeonAuthAsync();
  if (!auth) return notConfiguredResponse();

  const { GET: handler } = auth.handler();
  return handler(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const auth = await getNeonAuthAsync();
  if (!auth) return notConfiguredResponse();

  const { POST: handler } = auth.handler();
  return handler(request, context);
}
