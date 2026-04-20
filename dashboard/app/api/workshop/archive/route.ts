import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { applyRuntimeRetentionPolicy, createWorkshopArchive, getLatestWorkshopArchive } from "@/lib/workshop-store";

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

  const archive = await getLatestWorkshopArchive(instanceId);
  return NextResponse.json({
    archive: archive
      ? {
          id: archive.id,
          createdAt: archive.createdAt,
          retentionUntil: archive.retentionUntil,
          reason: archive.payload.reason,
          notes: archive.notes,
        }
      : null,
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { notes?: string; instanceId?: string };
  const instanceId = body.instanceId?.trim();
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) {
    return denied;
  }

  const archive = await createWorkshopArchive({ reason: "manual", notes: body.notes ?? null }, instanceId);
  await applyRuntimeRetentionPolicy(instanceId);

  return NextResponse.json({
    ok: true,
    archive: {
      id: archive.id,
      createdAt: archive.createdAt,
      retentionUntil: archive.retentionUntil,
      reason: archive.payload.reason,
      notes: archive.notes,
    },
  });
}
