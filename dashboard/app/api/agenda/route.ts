import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import { getWorkshopState, setCurrentAgendaItem } from "@/lib/workshop-store";

export async function GET(request: Request) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const state = await getWorkshopState(access.session.instanceId);
  const current = state.agenda.find((item) => item.status === "current") ?? null;

  return NextResponse.json({
    phase: current,
    title: state.workshopMeta.title,
    items: state.agenda,
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { currentId?: string; instanceId?: string };
  const instanceId = body.instanceId?.trim();
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) {
    return denied;
  }

  if (!body.currentId) {
    return NextResponse.json({ ok: false, error: "currentId is required" }, { status: 400 });
  }

  try {
    const state = await setCurrentAgendaItem(body.currentId, instanceId);
    return NextResponse.json({ ok: true, items: state.agenda, phase: state.workshopMeta.currentPhaseLabel });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
