import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { prepareWorkshopInstance, removeWorkshopInstance, resetWorkshopState } from "@/lib/workshop-store";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  const instance = await getWorkshopInstanceRepository().getInstance(id);
  if (!instance) {
    return NextResponse.json({ ok: false, error: "instance not found" }, { status: 404 });
  }

  return NextResponse.json({ instance });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as {
    action?: "prepare" | "reset" | "remove";
    templateId?: string;
  };
  const action = body.action ?? "prepare";
  const facilitator = await getFacilitatorSession(id);

  if (action === "prepare") {
    const instance = await prepareWorkshopInstance(id, facilitator?.neonUserId ?? null);
    return NextResponse.json({ ok: true, instance });
  }

  if (action === "remove") {
    if (facilitator && facilitator.grant.role !== "owner") {
      return NextResponse.json({ ok: false, error: "owner role required" }, { status: 403 });
    }

    await removeWorkshopInstance(id, facilitator?.neonUserId ?? null);
    return NextResponse.json({ ok: true });
  }

  if (!body.templateId) {
    return NextResponse.json({ ok: false, error: "templateId is required" }, { status: 400 });
  }

  const state = await resetWorkshopState(body.templateId, id);
  return NextResponse.json({ ok: true, workshopId: state.workshopId, workshopMeta: state.workshopMeta });
}
