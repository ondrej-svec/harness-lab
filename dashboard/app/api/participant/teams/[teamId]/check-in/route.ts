import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import {
  isParticipantTeamAccessError,
  isTeamModeEnabled,
  requireParticipantTeamAccess,
} from "@/lib/participant-team-access";
import { getParticipantRepository } from "@/lib/participant-repository";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import { appendCheckIn, getWorkshopState } from "@/lib/workshop-store";

type CheckInBody = {
  phaseId?: string;
  content?: string;
  changed?: string;
  verified?: string;
  nextStep?: string;
  writtenBy?: string | null;
};

function buildStructuredCheckInContent(input: {
  changed: string;
  verified: string;
  nextStep: string;
}) {
  const parts = [
    `What changed: ${input.changed}`,
    `What verifies it: ${input.verified}`,
    `Next safe move: ${input.nextStep}`,
  ];

  return parts.join("\n");
}

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
  const changed = body.changed?.trim() ?? "";
  const verified = body.verified?.trim() ?? "";
  const nextStep = body.nextStep?.trim() ?? "";
  const hasStructuredPayload = Boolean(changed && verified && nextStep);
  const content = hasStructuredPayload ? buildStructuredCheckInContent({ changed, verified, nextStep }) : (body.content?.trim() ?? "");
  if (!content || !hasStructuredPayload) {
    return NextResponse.json({ ok: false, error: "changed, verified, and nextStep are required" }, { status: 400 });
  }

  const instanceId = access.session.instanceId;

  // Team-mode-only endpoint. Participant-mode instances should call
  // POST /api/participant/check-in instead; return 404 so clients that
  // accidentally route here (cached UI, racing mode switch) see a
  // clean "not available" rather than a membership-required 403.
  if (!(await isTeamModeEnabled(instanceId))) {
    return NextResponse.json({ ok: false, error: "team_mode_disabled" }, { status: 404 });
  }

  try {
    await requireParticipantTeamAccess({
      instanceId,
      participantId: access.session.participantId,
      teamId,
    });
  } catch (error) {
    if (isParticipantTeamAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    throw error;
  }

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
  const participantRecord = access.session.participantId
    ? await getParticipantRepository().findParticipant(instanceId, access.session.participantId)
    : null;

  try {
    const nextState = await appendCheckIn(
      teamId,
      {
        phaseId,
        content,
        participantId: access.session.participantId ?? null,
        writtenBy: participantRecord?.displayName ?? body.writtenBy ?? null,
        changed,
        verified,
        nextStep,
      },
      instanceId,
    );
    const updatedTeam = nextState.teams.find((item) => item.id === teamId);
    return NextResponse.json({ ok: true, team: updatedTeam });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
