import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import { getWorkshopState } from "@/lib/workshop-store";

export async function GET(request: Request) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const state = await getWorkshopState(access.session.instanceId);
  return NextResponse.json({
    items: state.teams,
  });
}
