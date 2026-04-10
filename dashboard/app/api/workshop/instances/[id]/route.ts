import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { parseWorkshopInstanceMetadataUpdateBody } from "@/lib/workshop-instance-api";
import { workshopTemplates } from "@/lib/workshop-data";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { prepareWorkshopInstance, removeWorkshopInstance, resetWorkshopState, updateWorkshopInstanceMetadata } from "@/lib/workshop-store";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";

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
    action?: "prepare" | "reset" | "remove" | "update" | "update_metadata";
    templateId?: string;
  };
  const action = body.action ?? "prepare";
  const facilitator = await getFacilitatorSession(id);

  if (action === "update" || action === "update_metadata") {
    const parsed = parseWorkshopInstanceMetadataUpdateBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    try {
      const instance = await updateWorkshopInstanceMetadata(id, parsed.value, facilitator?.neonUserId ?? null);
      if (!instance) {
        return NextResponse.json({ ok: false, error: "instance not found" }, { status: 404 });
      }

      return NextResponse.json({ ok: true, instance });
    } catch (error) {
      return workshopMutationErrorResponse(error);
    }
  }

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

  const state = await resetWorkshopState(body.templateId ?? workshopTemplates[0]?.id, id);
  return NextResponse.json({
    ok: true,
    workshopId: state.workshopId,
    workshopMeta: state.workshopMeta,
    contentSummary: {
      phases: state.agenda.length,
      scenes: state.agenda.reduce((sum, item) => sum + item.presenterScenes.length, 0),
      briefs: state.briefs.length,
      challenges: state.challenges.length,
      blueprintVersion: state.version,
    },
  });
}
