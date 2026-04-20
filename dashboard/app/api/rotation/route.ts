import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import { getWorkshopState, setRotationReveal } from "@/lib/workshop-store";

export async function GET(request: Request) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const state = await getWorkshopState(access.session.instanceId);
  return NextResponse.json(state.rotation);
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { revealed?: boolean; instanceId?: string };
  const instanceId = body.instanceId?.trim();
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) {
    return denied;
  }

  if (typeof body.revealed !== "boolean") {
    return NextResponse.json({ ok: false, error: "revealed must be a boolean" }, { status: 400 });
  }

  try {
    const state = await setRotationReveal(body.revealed, instanceId);
    return NextResponse.json({ ok: true, rotation: state.rotation });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
