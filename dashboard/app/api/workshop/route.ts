import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { workshopTemplates } from "@/lib/workshop-data";
import { createWorkshopInstance, getWorkshopInstances, getWorkshopState, prepareWorkshopInstance, resetWorkshopState } from "@/lib/workshop-store";

export async function GET() {
  const state = await getWorkshopState();
  return NextResponse.json({
    workshopId: state.workshopId,
    workshopMeta: state.workshopMeta,
    templates: workshopTemplates,
    instances: await getWorkshopInstances(),
  });
}

export async function POST(request: Request) {
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as {
    action?: "create" | "prepare" | "reset";
    id?: string;
    instanceId?: string;
    templateId?: string;
    city?: string;
    dateRange?: string;
  };
  const action = body.action ?? "reset";
  const facilitator = await getFacilitatorSession();

  if (action === "create") {
    if (!body.id || !body.templateId) {
      return NextResponse.json({ ok: false, error: "id and templateId are required" }, { status: 400 });
    }

    const instance = await createWorkshopInstance(
      {
        id: body.id,
        templateId: body.templateId,
        city: body.city,
        dateRange: body.dateRange,
      },
      facilitator?.neonUserId ?? null,
    );
    return NextResponse.json({ ok: true, instance });
  }

  if (action === "prepare") {
    const targetInstanceId = body.instanceId;
    if (!targetInstanceId) {
      return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
    }

    const instance = await prepareWorkshopInstance(targetInstanceId, facilitator?.neonUserId ?? null);
    return NextResponse.json({ ok: true, instance });
  }

  if (!body.templateId) {
    return NextResponse.json({ ok: false, error: "templateId is required" }, { status: 400 });
  }

  const state = await resetWorkshopState(body.templateId);
  return NextResponse.json({ ok: true, workshopId: state.workshopId, workshopMeta: state.workshopMeta });
}
