import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import { getTeamMemberRepository } from "@/lib/team-member-repository";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import { getActivePollSummary, submitActivePollResponse } from "@/lib/workshop-store";

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
  const activePoll = await getActivePollSummary(instanceId);
  if (!activePoll) {
    return NextResponse.json({ ok: false, error: "active poll not found" }, { status: 404 });
  }
  if (body.pollId && body.pollId !== activePoll.pollId) {
    return NextResponse.json({ ok: false, error: "active poll changed" }, { status: 409 });
  }

  const membership = access.session.participantId
    ? await getTeamMemberRepository().findMemberByParticipant(instanceId, access.session.participantId)
    : null;

  try {
    const summary = await submitActivePollResponse(
      {
        sessionKey: access.session.participantId ?? `session:${instanceId}`,
        participantId: access.session.participantId ?? null,
        teamId: membership?.teamId ?? null,
        optionId,
      },
      instanceId,
    );
    return NextResponse.json({ ok: true, poll: summary });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
