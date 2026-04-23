import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import { getPollResponseRepository } from "@/lib/poll-response-repository";
import { getTeamMemberRepository } from "@/lib/team-member-repository";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import {
  getLiveParticipantMoment,
  getWorkshopState,
  submitActivePollResponse,
} from "@/lib/workshop-store";

type PollBody = {
  pollId?: string;
  optionId?: string;
};

export async function PATCH(request: Request) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const body = (await request.json()) as PollBody;
  const optionId = body.optionId?.trim() ?? "";
  if (!optionId) {
    return NextResponse.json({ ok: false, error: "optionId is required" }, { status: 400 });
  }

  const instanceId = access.session.instanceId;

  // Fetch state once; reuse for active-poll validation, for
  // submitActivePollResponse, and for the in-memory summary recompute.
  // Membership + response list also fire in parallel so the poll-submit
  // hot path costs 1 getWorkshopState + 1 list + 1 membership + 1 upsert
  // (down from 15 Neon HTTP calls pre-Phase-3 — see plan 2026-04-22).
  const state = await getWorkshopState(instanceId);
  const { participantMoment } = getLiveParticipantMoment(state);
  const activePoll = participantMoment?.poll ?? null;
  if (!activePoll) {
    return NextResponse.json({ ok: false, error: "active poll not found" }, { status: 404 });
  }
  if (body.pollId && body.pollId !== activePoll.id) {
    return NextResponse.json({ ok: false, error: "active poll changed" }, { status: 409 });
  }

  const [membership, currentResponses] = await Promise.all([
    access.session.participantId
      ? getTeamMemberRepository().findMemberByParticipant(instanceId, access.session.participantId)
      : Promise.resolve(null),
    getPollResponseRepository().list(instanceId, activePoll.id),
  ]);

  try {
    const summary = await submitActivePollResponse(
      {
        sessionKey: access.session.participantId ?? `session:${instanceId}`,
        participantId: access.session.participantId ?? null,
        teamId: membership?.teamId ?? null,
        optionId,
      },
      instanceId,
      { state, currentResponses },
    );
    return NextResponse.json({ ok: true, poll: summary });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
