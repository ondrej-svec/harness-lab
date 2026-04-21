import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { parseWorkshopInstanceParticipantCopyBody } from "@/lib/workshop-instance-api";
import { resolveEffectiveParticipantCopy } from "@/lib/workshop-data";
import { updateWorkshopInstanceParticipantCopy } from "@/lib/workshop-store";

/**
 * GET /api/workshop/instances/[id]/copy
 *
 * Returns the effective participantCopy override (or null when the
 * instance uses compiled defaults). Consumers deep-merge over defaults
 * at render time; this endpoint surfaces only the override.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) return denied;

  const instance = await getWorkshopInstanceRepository().getInstance(id);
  if (!instance) {
    return NextResponse.json({ ok: false, error: "instance not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    participantCopy: resolveEffectiveParticipantCopy(instance),
  });
}

/**
 * PATCH /api/workshop/instances/[id]/copy
 *
 * Body: `{ participantCopy: OverridableParticipantCopy | null }`. Null or
 * an empty object clears the override. Only the whitelisted keys on
 * `postWorkshop` are accepted; typos return 400.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = parseWorkshopInstanceParticipantCopyBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const facilitator = await getFacilitatorSession(id);
  const instance = await updateWorkshopInstanceParticipantCopy(
    id,
    parsed.value.participantCopy,
    facilitator?.neonUserId ?? null,
  );
  if (!instance) {
    return NextResponse.json({ ok: false, error: "instance not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    participantCopy: resolveEffectiveParticipantCopy(instance),
  });
}
