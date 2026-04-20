import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import type { MonitoringSnapshot } from "@/lib/workshop-data";
import { getWorkshopState, replaceMonitoring } from "@/lib/workshop-store";

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

  const state = await getWorkshopState(instanceId);
  return NextResponse.json({
    items: state.monitoring,
    storageMode: getRuntimeStorageMode(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { items?: MonitoringSnapshot[]; instanceId?: string };
  const instanceId = body.instanceId?.trim();
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) {
    return denied;
  }

  if (!body.items) {
    return NextResponse.json({ ok: false, error: "items are required" }, { status: 400 });
  }

  try {
    const state = await replaceMonitoring(body.items, instanceId);
    return NextResponse.json({ ok: true, items: state.monitoring });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
