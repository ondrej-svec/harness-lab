import { NextRequest, NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import { completeChallenge } from "@/lib/workshop-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { teamId?: string; instanceId?: string };

  const instanceId = body.instanceId?.trim();
  if (!instanceId) {
    return NextResponse.json(
      { ok: false, error: "Pole instanceId je povinné." },
      { status: 400 },
    );
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) {
    return denied;
  }

  if (!body.teamId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Pole teamId je povinné.",
      },
      { status: 400 },
    );
  }

  let state;
  try {
    state = await completeChallenge(id, body.teamId, instanceId);
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
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
