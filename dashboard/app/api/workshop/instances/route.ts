import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { createWorkshopInstance, getWorkshopInstances } from "@/lib/workshop-store";

export async function GET(request: Request) {
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  const instances = await getWorkshopInstances();
  return NextResponse.json({ items: instances });
}

export async function POST(request: Request) {
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as {
    id?: string;
    templateId?: string;
    city?: string;
    dateRange?: string;
  };
  if (!body.id || !body.templateId) {
    return NextResponse.json({ ok: false, error: "id and templateId are required" }, { status: 400 });
  }

  const facilitator = await getFacilitatorSession();
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
