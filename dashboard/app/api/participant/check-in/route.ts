import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import {
  isParticipantTeamAccessError,
  isTeamModeEnabled,
  requireParticipantScopedWrite,
} from "@/lib/participant-team-access";
import { getParticipantRepository } from "@/lib/participant-repository";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import { appendParticipantCheckIn, getWorkshopState } from "@/lib/workshop-store";

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

/**
 * Participant-scoped check-in — used when the workshop instance has
 * team_mode_enabled = false. No teamId in the URL: the write attaches
 * to the participantId from the session directly. Storage goes to
 * workshop_state.participantCheckIns (parallel to teams[].checkIns for
 * the team-mode path).
 *
 * Returns 409 when the instance is in team mode, nudging callers
 * toward /api/participant/teams/[teamId]/check-in instead. This is a
 * defense-in-depth guard; in practice the participant UI only renders
 * the form that matches the active mode.
 */
export async function POST(request: Request) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const body = (await request.json()) as CheckInBody;
  const changed = body.changed?.trim() ?? "";
  const verified = body.verified?.trim() ?? "";
  const nextStep = body.nextStep?.trim() ?? "";
  const hasStructuredPayload = Boolean(changed && verified && nextStep);
  const content = hasStructuredPayload
    ? buildStructuredCheckInContent({ changed, verified, nextStep })
    : (body.content?.trim() ?? "");
  if (!content || !hasStructuredPayload) {
    return NextResponse.json(
      { ok: false, error: "changed, verified, and nextStep are required" },
      { status: 400 },
    );
  }

  const instanceId = access.session.instanceId;

  if (await isTeamModeEnabled(instanceId)) {
    return NextResponse.json(
      { ok: false, error: "team_mode_active" },
      { status: 409 },
    );
  }

  try {
    const { participantId } = await requireParticipantScopedWrite({
      instanceId,
      participantId: access.session.participantId,
    });

    const state = await getWorkshopState(instanceId);
    const phaseId =
      body.phaseId?.trim() ||
      state.agenda.find((item) => item.status === "current")?.id ||
      state.agenda[0]?.id ||
      "opening";
    const participantRecord = await getParticipantRepository().findParticipant(
      instanceId,
      participantId,
    );

    await appendParticipantCheckIn(
      participantId,
      {
        phaseId,
        content,
        writtenBy: participantRecord?.displayName ?? body.writtenBy ?? null,
        changed,
        verified,
        nextStep,
      },
      instanceId,
    );

    return NextResponse.json({ ok: true, participantId });
  } catch (error) {
    if (isParticipantTeamAccessError(error)) {
      return NextResponse.json({ ok: false, error: error.code }, { status: 403 });
    }
    return workshopMutationErrorResponse(error);
  }
}
