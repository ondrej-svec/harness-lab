import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import type { Team } from "@/lib/workshop-data";
import { appendCheckIn, upsertTeam } from "@/lib/workshop-store";

export async function POST(request: Request) {
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as Team;
  if (!body.id || !body.name || !body.repoUrl || !body.projectBriefId) {
    return NextResponse.json({ ok: false, error: "id, name, repoUrl and projectBriefId are required" }, { status: 400 });
  }
  if (!Array.isArray(body.checkIns)) {
    body.checkIns = [];
  }
  if (body.anchor === undefined) {
    body.anchor = null;
  }

  try {
    const state = await upsertTeam(body);
    return NextResponse.json({ ok: true, items: state.teams });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as {
    teamId?: string;
    phaseId?: string;
    content?: string;
    writtenBy?: string | null;
  };
  if (!body.teamId || !body.phaseId || !body.content) {
    return NextResponse.json(
      { ok: false, error: "teamId, phaseId and content are required" },
      { status: 400 },
    );
  }

  try {
    const state = await appendCheckIn(body.teamId, {
      phaseId: body.phaseId,
      content: body.content,
      writtenBy: body.writtenBy ?? null,
    });
    return NextResponse.json({ ok: true, items: state.teams });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
