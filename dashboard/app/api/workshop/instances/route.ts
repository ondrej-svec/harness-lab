import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getAuthenticatedFacilitator } from "@/lib/facilitator-session";
import { parseWorkshopInstanceCreateBody } from "@/lib/workshop-instance-api";
import { workshopTemplates } from "@/lib/workshop-data";
import { createWorkshopInstance, getWorkshopInstances } from "@/lib/workshop-store";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";

export async function GET(request: Request) {
  const denied = await requireFacilitatorRequest(request, null);
  if (denied) {
    return denied;
  }

  const instances = await getWorkshopInstances();
  return NextResponse.json({ items: instances });
}

export async function POST(request: Request) {
  const denied = await requireFacilitatorRequest(request, null);
  if (denied) {
    return denied;
  }

  const parsed = parseWorkshopInstanceCreateBody(await request.json());
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const existing = await getWorkshopInstanceRepository().getInstance(parsed.value.id);
  const facilitator = await getAuthenticatedFacilitator();
  const instance = await createWorkshopInstance(
    {
      ...parsed.value,
      templateId: parsed.value.templateId ?? workshopTemplates[0]?.id,
      blueprintId: parsed.value.blueprintId,
    },
    facilitator?.neonUserId ?? null,
  );
  return NextResponse.json({ ok: true, created: !existing, instance });
}
