import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { applyRuntimeRetentionPolicy, createWorkshopArchive, getLatestWorkshopArchive } from "@/lib/workshop-store";

export async function GET(request: Request) {
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  const archive = await getLatestWorkshopArchive();
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
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  const body = (await request.json().catch(() => ({}))) as { notes?: string };
  const archive = await createWorkshopArchive({ reason: "manual", notes: body.notes ?? null });
  await applyRuntimeRetentionPolicy();

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
