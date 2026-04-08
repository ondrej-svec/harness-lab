import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import { addAgendaItem, getWorkshopState, moveAgendaItem, removeAgendaItem, setCurrentAgendaItem, updateAgendaItem } from "@/lib/workshop-store";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  const state = await getWorkshopState(id);
  return NextResponse.json({
    phase: state.agenda.find((item) => item.status === "current") ?? null,
    items: state.agenda,
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as {
    title?: string;
    time?: string;
    description?: string;
    afterItemId?: string | null;
  };
  if (!body.title || !body.time || !body.description) {
    return NextResponse.json({ ok: false, error: "title, time and description are required" }, { status: 400 });
  }

  try {
    const state = await addAgendaItem(
      {
        title: body.title,
        time: body.time,
        description: body.description,
        afterItemId: body.afterItemId ?? null,
      },
      id,
    );
    return NextResponse.json({ ok: true, items: state.agenda });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as
    | { action?: "set_current"; itemId?: string }
    | { action: "move"; itemId?: string; direction?: "up" | "down" }
    | { action: "update"; itemId?: string; title?: string; time?: string; description?: string };

  if (body.action === "move") {
    if (!body.itemId || !body.direction) {
      return NextResponse.json({ ok: false, error: "itemId and direction are required" }, { status: 400 });
    }

    try {
      const state = await moveAgendaItem(body.itemId, body.direction, id);
      return NextResponse.json({ ok: true, items: state.agenda });
    } catch (error) {
      return workshopMutationErrorResponse(error);
    }
  }

  if (body.action === "update") {
    if (!body.itemId || !body.title || !body.time || !body.description) {
      return NextResponse.json({ ok: false, error: "itemId, title, time and description are required" }, { status: 400 });
    }

    try {
      const state = await updateAgendaItem(
        body.itemId,
        {
          title: body.title,
          time: body.time,
          description: body.description,
        },
        id,
      );
      return NextResponse.json({ ok: true, items: state.agenda });
    } catch (error) {
      return workshopMutationErrorResponse(error);
    }
  }

  if (!body.itemId) {
    return NextResponse.json({ ok: false, error: "itemId is required" }, { status: 400 });
  }

  try {
    const state = await setCurrentAgendaItem(body.itemId, id);
    return NextResponse.json({ ok: true, items: state.agenda, phase: state.workshopMeta.currentPhaseLabel });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as { itemId?: string };
  if (!body.itemId) {
    return NextResponse.json({ ok: false, error: "itemId is required" }, { status: 400 });
  }

  try {
    const state = await removeAgendaItem(body.itemId, id);
    return NextResponse.json({ ok: true, items: state.agenda });
  } catch (error) {
    return workshopMutationErrorResponse(error);
  }
}
