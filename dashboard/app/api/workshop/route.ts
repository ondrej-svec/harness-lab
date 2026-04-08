import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getAuthenticatedFacilitator, getFacilitatorSession } from "@/lib/facilitator-session";
import { parseWorkshopInstanceCreateBody } from "@/lib/workshop-instance-api";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { workshopTemplates } from "@/lib/workshop-data";
import { createWorkshopInstance, getWorkshopState, prepareWorkshopInstance, resetWorkshopState } from "@/lib/workshop-store";

export async function GET() {
  const state = await getWorkshopState();
  return NextResponse.json({
    workshopId: state.workshopId,
    workshopMeta: state.workshopMeta,
    templates: workshopTemplates,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: "create" | "prepare" | "reset";
    instanceId?: string;
    id?: string;
    templateId?: string;
  };
  const action = body.action ?? "reset";

  if (action === "create") {
    const denied = await requireFacilitatorRequest(request, null);
    if (denied) {
      return denied;
    }

    const parsed = parseWorkshopInstanceCreateBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const existing = await getWorkshopInstanceRepository().getInstance(parsed.value.id);
    const facilitator = await getAuthenticatedFacilitator();
    const instance = await createWorkshopInstance(
      {
        ...parsed.value,
        templateId: parsed.value.templateId ?? workshopTemplates[0]?.id,
      },
      facilitator?.neonUserId ?? null,
    );
    return NextResponse.json({ ok: true, created: !existing, instance });
  }

  if (action === "prepare") {
    const targetInstanceId = body.instanceId;
    if (!targetInstanceId) {
      return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
    }

    const denied = await requireFacilitatorRequest(request, targetInstanceId);
    if (denied) {
      return denied;
    }

    const facilitator = await getFacilitatorSession(targetInstanceId);
    const instance = await prepareWorkshopInstance(targetInstanceId, facilitator?.neonUserId ?? null);
    return NextResponse.json({ ok: true, instance });
  }

  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  const state = await resetWorkshopState(body.templateId ?? workshopTemplates[0]?.id);
  return NextResponse.json({ ok: true, workshopId: state.workshopId, workshopMeta: state.workshopMeta });
}
