import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import { getWorkshopState, setRotationReveal } from "@/lib/workshop-store";

export async function GET() {
  const state = await getWorkshopState();
  return NextResponse.json(state.rotation);
}

export async function PATCH(request: Request) {
  const denied = await requireFacilitatorRequest(request);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as { revealed?: boolean };
  if (typeof body.revealed !== "boolean") {
    return NextResponse.json({ ok: false, error: "revealed must be a boolean" }, { status: 400 });
  }

  try {
    const state = await setRotationReveal(body.revealed);
    return NextResponse.json({ ok: true, rotation: state.rotation });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
