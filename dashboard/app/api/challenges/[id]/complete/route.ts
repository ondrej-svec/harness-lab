import { NextRequest, NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { completeChallenge } from "@/lib/workshop-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

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

  const state = await completeChallenge(id, body.teamId);
  const challenge = state.challenges.find((item) => item.id === id);

  if (!challenge) {
    return NextResponse.json({ ok: false, error: "Challenge nebyla nalezena." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    persisted: true,
    challengeId: id,
    completedBy: challenge.completedBy,
  });
}
