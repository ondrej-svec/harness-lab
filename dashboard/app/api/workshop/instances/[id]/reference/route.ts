import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { parseWorkshopInstanceReferenceGroupsBody } from "@/lib/workshop-instance-api";
import { resolveEffectiveReferenceGroups } from "@/lib/workshop-data";
import { updateWorkshopInstanceReferenceGroups } from "@/lib/workshop-store";

/**
 * GET /api/workshop/instances/[id]/reference
 *
 * Returns the currently stored override (or null if none). CLI callers
 * resolve the compiled default on their side when this returns null, so
 * the server contract stays "what's in the row."
 */
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

  return NextResponse.json({
    ok: true,
    referenceGroups: resolveEffectiveReferenceGroups(instance),
  });
}

/**
 * PATCH /api/workshop/instances/[id]/reference
 *
 * Body: `{ referenceGroups: GeneratedReferenceGroup[] | null }`.
 * Null (or `[]`) clears the override — the participant page falls back
 * to the compiled default for the instance's locale. A non-empty array
 * replaces the catalog verbatim (no merge with defaults).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) {
    return denied;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = parseWorkshopInstanceReferenceGroupsBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const facilitator = await getFacilitatorSession(id);
  const instance = await updateWorkshopInstanceReferenceGroups(
    id,
    parsed.value.referenceGroups,
    facilitator?.neonUserId ?? null,
  );
  if (!instance) {
    return NextResponse.json({ ok: false, error: "instance not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    referenceGroups: resolveEffectiveReferenceGroups(instance),
  });
}
