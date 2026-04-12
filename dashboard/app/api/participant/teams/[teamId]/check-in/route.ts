import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import { appendCheckIn, getWorkshopState } from "@/lib/workshop-store";

type CheckInBody = {
  phaseId?: string;
  content?: string;
  writtenBy?: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const { teamId } = await params;
  const body = (await request.json()) as CheckInBody;
  const content = body.content?.trim() ?? "";
  if (!content) {
    return NextResponse.json({ ok: false, error: "content is required" }, { status: 400 });
  }

  const instanceId = access.session.instanceId;
  const state = await getWorkshopState(instanceId);
  const team = state.teams.find((item) => item.id === teamId);
  if (!team) {
    return NextResponse.json({ ok: false, error: "team not found" }, { status: 404 });
  }

  const phaseId =
    body.phaseId?.trim() ||
    state.agenda.find((item) => item.status === "current")?.id ||
    state.agenda[0]?.id ||
    "opening";

  try {
    const nextState = await appendCheckIn(
      teamId,
      {
        phaseId,
        content,
        writtenBy: body.writtenBy ?? null,
      },
      instanceId,
    );
    const updatedTeam = nextState.teams.find((item) => item.id === teamId);
    return NextResponse.json({ ok: true, team: updatedTeam });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
