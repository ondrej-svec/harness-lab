import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import type { Team } from "@/lib/workshop-data";
import { getWorkshopState, updateCheckpoint, upsertTeam } from "@/lib/workshop-store";

export async function GET(request: Request) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const state = await getWorkshopState();
  return NextResponse.json({
    items: state.teams,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Team;
  if (!body.id || !body.name || !body.repoUrl || !body.projectBriefId) {
    return NextResponse.json({ ok: false, error: "id, name, repoUrl and projectBriefId are required" }, { status: 400 });
  }

  const state = await upsertTeam(body);
  return NextResponse.json({ ok: true, items: state.teams });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { teamId?: string; checkpoint?: string };
  if (!body.teamId || !body.checkpoint) {
    return NextResponse.json({ ok: false, error: "teamId and checkpoint are required" }, { status: 400 });
  }

  const state = await updateCheckpoint(body.teamId, body.checkpoint);
  return NextResponse.json({ ok: true, items: state.teams });
}
