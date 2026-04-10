import { NextResponse } from "next/server";
import { requireParticipantSession } from "@/lib/event-access";
import { updateTeamFromParticipant, isWorkshopStateTargetError } from "@/lib/workshop-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const access = await requireParticipantSession(request);
  if (!access.ok) {
    return access.response;
  }

  const { teamId } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
  }

  const patch: { name?: string; repoUrl?: string; members?: string[] } = {};

  if ("name" in body) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "name must be a non-empty string" }, { status: 400 });
    }
    patch.name = body.name.trim();
  }

  if ("repoUrl" in body) {
    if (typeof body.repoUrl !== "string") {
      return NextResponse.json({ ok: false, error: "repoUrl must be a string" }, { status: 400 });
    }
    const trimmedUrl = body.repoUrl.trim();
    if (trimmedUrl.length > 0) {
      try {
        new URL(trimmedUrl);
      } catch {
        return NextResponse.json({ ok: false, error: "repoUrl must be a valid URL" }, { status: 400 });
      }
    }
    patch.repoUrl = trimmedUrl;
  }

  if ("members" in body) {
    if (!Array.isArray(body.members) || !body.members.every((m: unknown) => typeof m === "string")) {
      return NextResponse.json({ ok: false, error: "members must be an array of strings" }, { status: 400 });
    }
    patch.members = body.members.map((m: string) => m.trim()).filter(Boolean);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "no valid fields to update" }, { status: 400 });
  }

  try {
    await updateTeamFromParticipant(teamId, patch, access.session.instanceId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isWorkshopStateTargetError(error)) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    throw error;
  }
}
