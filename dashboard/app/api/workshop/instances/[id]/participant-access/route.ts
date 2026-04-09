import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import {
  getFacilitatorParticipantAccessState,
  issueParticipantEventAccess,
} from "@/lib/participant-access-management";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  const participantAccess = await getFacilitatorParticipantAccessState(id);
  return NextResponse.json({ ok: true, participantAccess });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as {
    action?: "issue" | "rotate";
    code?: string;
  };

  if (body.action && body.action !== "issue" && body.action !== "rotate") {
    return NextResponse.json({ ok: false, error: "unsupported participant access action" }, { status: 400 });
  }

  const facilitator = await getFacilitatorSession(id);
  const result = await issueParticipantEventAccess(
    {
      code: typeof body.code === "string" ? body.code : undefined,
      actorNeonUserId: facilitator?.neonUserId ?? null,
    },
    id,
  );

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    issuedCode: result.issuedCode,
    participantAccess: result.access,
  });
}
