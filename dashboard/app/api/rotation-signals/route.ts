import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getCurrentWorkshopInstanceId } from "@/lib/instance-context";
import { captureRotationSignal, listRotationSignals, type RotationSignalInput } from "@/lib/workshop-store";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";

type PostBody = Partial<RotationSignalInput> & { instanceId?: string };

function extractInstanceId(body: PostBody, url: URL): string {
  if (body.instanceId && body.instanceId.trim().length > 0) {
    return body.instanceId.trim();
  }
  const queryInstance = url.searchParams.get("instanceId");
  if (queryInstance && queryInstance.trim().length > 0) {
    return queryInstance.trim();
  }
  return getCurrentWorkshopInstanceId();
}

export async function GET(request: Request) {
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  const url = new URL(request.url);
  const instanceId =
    url.searchParams.get("instanceId")?.trim() || getCurrentWorkshopInstanceId();

  try {
    const signals = await listRotationSignals(instanceId);
    return NextResponse.json({ ok: true, instanceId, signals });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
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

  const url = new URL(request.url);
  const instanceId = extractInstanceId(body, url);

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
