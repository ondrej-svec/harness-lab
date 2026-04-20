import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { normalizeTeamRepoUrl } from "@/lib/team-repo-url";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import type { Team } from "@/lib/workshop-data";
import { appendCheckIn, upsertTeam } from "@/lib/workshop-store";

export async function POST(request: Request) {
  const body = (await request.json()) as Team & { instanceId?: string };
  const instanceId = body.instanceId?.trim();
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) {
    return denied;
  }

  if (!body.id || !body.name || !body.repoUrl || !body.projectBriefId) {
    return NextResponse.json({ ok: false, error: "id, name, repoUrl and projectBriefId are required" }, { status: 400 });
  }
  const repoUrl = normalizeTeamRepoUrl(body.repoUrl);
  if (!repoUrl.ok) {
    return NextResponse.json({ ok: false, error: repoUrl.error }, { status: 400 });
  }
  if (!Array.isArray(body.checkIns)) {
    body.checkIns = [];
  }
  if (body.anchor === undefined) {
    body.anchor = null;
  }

  try {
    const state = await upsertTeam({ ...body, repoUrl: repoUrl.value }, instanceId);
    return NextResponse.json({ ok: true, items: state.teams });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    teamId?: string;
    phaseId?: string;
    content?: string;
    writtenBy?: string | null;
    instanceId?: string;
  };
  const instanceId = body.instanceId?.trim();
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) {
    return denied;
  }

  if (!body.teamId || !body.phaseId || !body.content) {
    return NextResponse.json(
      { ok: false, error: "teamId, phaseId and content are required" },
      { status: 400 },
    );
  }

  try {
    const state = await appendCheckIn(
      body.teamId,
      {
        phaseId: body.phaseId,
        content: body.content,
        writtenBy: body.writtenBy ?? null,
      },
      instanceId,
    );
    return NextResponse.json({ ok: true, items: state.teams });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
