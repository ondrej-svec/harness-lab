import { NextRequest, NextResponse } from "next/server";
import { completeChallenge } from "@/lib/challenge-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { teamId?: string };

  if (!body.teamId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Pole teamId je povinné.",
      },
      { status: 400 },
    );
  }

  const result = completeChallenge(id, body.teamId);
  return NextResponse.json(result, { status: result.ok ? 200 : 404 });
}
