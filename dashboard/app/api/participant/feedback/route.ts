import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import { getTeamMemberRepository } from "@/lib/team-member-repository";
import { submitParticipantFeedback } from "@/lib/workshop-store";

type FeedbackBody = {
  kind?: "blocker" | "question";
  message?: string;
};

export async function POST(request: Request) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const body = (await request.json()) as FeedbackBody;
  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ ok: false, error: "message is required" }, { status: 400 });
  }

  const kind = body.kind === "blocker" ? "blocker" : "question";
  const instanceId = access.session.instanceId;
  const membership = access.session.participantId
    ? await getTeamMemberRepository().findMemberByParticipant(instanceId, access.session.participantId)
    : null;

  const feedback = await submitParticipantFeedback(
    {
      sessionKey: access.session.participantId ?? `session:${instanceId}`,
      participantId: access.session.participantId ?? null,
      teamId: membership?.teamId ?? null,
      kind,
      message,
    },
    instanceId,
  );

  return NextResponse.json({ ok: true, feedback });
}
