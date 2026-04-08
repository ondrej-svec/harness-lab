import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { workshopMutationErrorResponse } from "@/lib/workshop-mutation-response";
import { getWorkshopState } from "@/lib/workshop-store";
import {
  addPresenterScene,
  movePresenterScene,
  removePresenterScene,
  setDefaultPresenterScene,
  setPresenterSceneEnabled,
  updatePresenterScene,
} from "@/lib/workshop-store";

function sceneMutationErrorResponse(error: unknown) {
  return workshopMutationErrorResponse(error);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  const { searchParams } = new URL(request.url);
  const agendaItemId = searchParams.get("agendaItemId");
  const state = await getWorkshopState(id);
  const items = state.agenda
    .filter((item) => !agendaItemId || item.id === agendaItemId)
    .map((item) => ({
      agendaItemId: item.id,
      agendaTitle: item.title,
      defaultSceneId: item.defaultPresenterSceneId,
      scenes: item.presenterScenes,
    }));

  return NextResponse.json({
    ok: true,
    currentAgendaItemId: state.agenda.find((item) => item.status === "current")?.id ?? null,
    items,
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as {
    agendaItemId?: string;
    label?: string;
    sceneType?: "briefing" | "demo" | "participant-view" | "checkpoint" | "reflection" | "custom";
    title?: string;
    body?: string;
    ctaLabel?: string | null;
    ctaHref?: string | null;
  };
  if (!body.agendaItemId || !body.label || !body.sceneType || !body.title || !body.body) {
    return NextResponse.json(
      { ok: false, error: "agendaItemId, label, sceneType, title and body are required" },
      { status: 400 },
    );
  }

  try {
    const state = await addPresenterScene(
      body.agendaItemId,
      {
        label: body.label,
        sceneType: body.sceneType,
        title: body.title,
        body: body.body,
        ctaLabel: body.ctaLabel ?? null,
        ctaHref: body.ctaHref ?? null,
      },
      id,
    );
    const agendaItem = state.agenda.find((item) => item.id === body.agendaItemId) ?? null;
    return NextResponse.json({ ok: true, agendaItem });
  } catch (error) {
    return sceneMutationErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as
    | {
        action: "update";
        agendaItemId?: string;
        sceneId?: string;
        label?: string;
        sceneType?: "briefing" | "demo" | "participant-view" | "checkpoint" | "reflection" | "custom";
        title?: string;
        body?: string;
        ctaLabel?: string | null;
        ctaHref?: string | null;
      }
    | {
        action: "move";
        agendaItemId?: string;
        sceneId?: string;
        direction?: "up" | "down";
      }
    | {
        action: "set_default";
        agendaItemId?: string;
        sceneId?: string;
      }
    | {
        action: "set_enabled";
        agendaItemId?: string;
        sceneId?: string;
        enabled?: boolean;
      };

  if (!body.agendaItemId || !body.sceneId) {
    return NextResponse.json({ ok: false, error: "agendaItemId and sceneId are required" }, { status: 400 });
  }

  if (body.action === "move") {
    if (!body.direction) {
      return NextResponse.json({ ok: false, error: "direction is required" }, { status: 400 });
    }

    try {
      const state = await movePresenterScene(body.agendaItemId, body.sceneId, body.direction, id);
      const agendaItem = state.agenda.find((item) => item.id === body.agendaItemId) ?? null;
      return NextResponse.json({ ok: true, agendaItem });
    } catch (error) {
      return sceneMutationErrorResponse(error);
    }
  }

  if (body.action === "set_default") {
    try {
      const state = await setDefaultPresenterScene(body.agendaItemId, body.sceneId, id);
      const agendaItem = state.agenda.find((item) => item.id === body.agendaItemId) ?? null;
      return NextResponse.json({ ok: true, agendaItem });
    } catch (error) {
      return sceneMutationErrorResponse(error);
    }
  }

  if (body.action === "set_enabled") {
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ ok: false, error: "enabled is required" }, { status: 400 });
    }

    try {
      const state = await setPresenterSceneEnabled(body.agendaItemId, body.sceneId, body.enabled, id);
      const agendaItem = state.agenda.find((item) => item.id === body.agendaItemId) ?? null;
      return NextResponse.json({ ok: true, agendaItem });
    } catch (error) {
      return sceneMutationErrorResponse(error);
    }
  }

  if (!body.label || !body.sceneType || !body.title || !body.body) {
    return NextResponse.json(
      { ok: false, error: "label, sceneType, title and body are required for update" },
      { status: 400 },
    );
  }

  try {
    const state = await updatePresenterScene(
      body.agendaItemId,
      body.sceneId,
      {
        label: body.label,
        sceneType: body.sceneType,
        title: body.title,
        body: body.body,
        ctaLabel: body.ctaLabel ?? null,
        ctaHref: body.ctaHref ?? null,
      },
      id,
    );
    const agendaItem = state.agenda.find((item) => item.id === body.agendaItemId) ?? null;
    return NextResponse.json({ ok: true, agendaItem });
  } catch (error) {
    return sceneMutationErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  const body = (await request.json()) as { agendaItemId?: string; sceneId?: string };
  if (!body.agendaItemId || !body.sceneId) {
    return NextResponse.json({ ok: false, error: "agendaItemId and sceneId are required" }, { status: 400 });
  }

  try {
    const state = await removePresenterScene(body.agendaItemId, body.sceneId, id);
    const agendaItem = state.agenda.find((item) => item.id === body.agendaItemId) ?? null;
    return NextResponse.json({ ok: true, agendaItem });
  } catch (error) {
    return sceneMutationErrorResponse(error);
  }
}
