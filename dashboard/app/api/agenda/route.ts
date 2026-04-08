import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import { getWorkshopState, setCurrentAgendaItem } from "@/lib/workshop-store";

export async function GET() {
  const state = await getWorkshopState();
  const current = state.agenda.find((item) => item.status === "current") ?? null;

  return NextResponse.json({
    phase: current,
    title: state.workshopMeta.title,
    items: state.agenda,
  });
}

export async function PATCH(request: Request) {
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as { currentId?: string };
  if (!body.currentId) {
    return NextResponse.json({ ok: false, error: "currentId is required" }, { status: 400 });
  }

  try {
    const state = await setCurrentAgendaItem(body.currentId);
    return NextResponse.json({ ok: true, items: state.agenda, phase: state.workshopMeta.currentPhaseLabel });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
