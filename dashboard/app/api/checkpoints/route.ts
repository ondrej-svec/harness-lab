import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import type { SprintUpdate } from "@/lib/workshop-data";
import { addSprintUpdate, getWorkshopState } from "@/lib/workshop-store";

export async function GET(request: Request) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const state = await getWorkshopState(access.session.instanceId);
  return NextResponse.json({
    items: state.sprintUpdates,
    storageMode: getRuntimeStorageMode(),
  });
}

export async function POST(request: Request) {
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as SprintUpdate;
  if (!body.id || !body.teamId || !body.text || !body.at) {
    return NextResponse.json({ ok: false, error: "id, teamId, text and at are required" }, { status: 400 });
  }

  try {
    const state = await addSprintUpdate(body);
    return NextResponse.json({ ok: true, items: state.sprintUpdates });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
