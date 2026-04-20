import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { captureRotationSignal, listRotationSignals, type RotationSignalInput } from "@/lib/workshop-store";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";

type PostBody = Partial<RotationSignalInput> & { instanceId?: string };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const instanceId = url.searchParams.get("instanceId")?.trim();
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId query parameter is required" }, { status: 400 });
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) {
    return denied;
  }

  try {
    const signals = await listRotationSignals(instanceId);
    return NextResponse.json({ ok: true, instanceId, signals });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}

export async function POST(request: Request) {
  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const url = new URL(request.url);
  const instanceId =
    body.instanceId?.trim() || url.searchParams.get("instanceId")?.trim() || undefined;
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) {
    return denied;
  }

  if (typeof body.freeText !== "string" || body.freeText.trim().length === 0) {
    return NextResponse.json(
      { ok: false, error: "freeText is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  if (body.tags !== undefined && !Array.isArray(body.tags)) {
    return NextResponse.json({ ok: false, error: "tags must be an array of strings" }, { status: 400 });
  }
  if (body.tags !== undefined && body.tags.some((tag) => typeof tag !== "string")) {
    return NextResponse.json({ ok: false, error: "tags must be an array of strings" }, { status: 400 });
  }

  if (body.teamId !== undefined && typeof body.teamId !== "string") {
    return NextResponse.json({ ok: false, error: "teamId must be a string" }, { status: 400 });
  }

  if (body.artifactPaths !== undefined) {
    if (!Array.isArray(body.artifactPaths)) {
      return NextResponse.json(
        { ok: false, error: "artifactPaths must be an array of strings" },
        { status: 400 },
      );
    }
    if (body.artifactPaths.some((p) => typeof p !== "string")) {
      return NextResponse.json(
        { ok: false, error: "artifactPaths must be an array of strings" },
        { status: 400 },
      );
    }
  }

  try {
    const signal = await captureRotationSignal(
      {
        freeText: body.freeText,
        tags: body.tags,
        teamId: body.teamId,
        artifactPaths: body.artifactPaths,
      },
      instanceId,
    );
    return NextResponse.json({ ok: true, signal });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
