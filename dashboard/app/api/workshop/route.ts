import { NextResponse } from "next/server";
import { workshopTemplates } from "@/lib/workshop-data";
import { getWorkshopState, resetWorkshopState } from "@/lib/workshop-store";

export async function GET() {
  const state = await getWorkshopState();
  return NextResponse.json({
    workshopId: state.workshopId,
    workshopMeta: state.workshopMeta,
    templates: workshopTemplates,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { templateId?: string };
  if (!body.templateId) {
    return NextResponse.json({ ok: false, error: "templateId is required" }, { status: 400 });
  }

  const state = await resetWorkshopState(body.templateId);
  return NextResponse.json({ ok: true, workshopId: state.workshopId, workshopMeta: state.workshopMeta });
}
