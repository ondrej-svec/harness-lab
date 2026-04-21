import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { parseWorkshopInstanceReferenceGroupsBody } from "@/lib/workshop-instance-api";
import { resolveEffectiveReferenceGroups } from "@/lib/workshop-data";
import { updateWorkshopInstanceReferenceGroups } from "@/lib/workshop-store";
import { getArtifactRepository } from "@/lib/artifact-repository";
import type { GeneratedReferenceGroup } from "@/lib/types/bilingual-reference";

/**
 * Cohort-scoped artifact kind is only valid when the referenced
 * `artifactId` actually exists for the target instance. Every artifact
 * item in the payload is checked against `workshop_artifacts`; the
 * first mismatch rejects the entire PATCH.
 */
async function validateArtifactReferences(
  instanceId: string,
  groups: GeneratedReferenceGroup[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const repo = getArtifactRepository();
  for (const [gi, group] of groups.entries()) {
    for (const [ii, item] of group.items.entries()) {
      if (item.kind !== "artifact") continue;
      const record = await repo.get(instanceId, item.artifactId);
      if (!record) {
        return {
          ok: false,
          error: `referenceGroups[${gi}].items[${ii}].artifactId '${item.artifactId}' does not exist on this instance`,
        };
      }
    }
  }
  return { ok: true };
}

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

  // Cross-instance artifact guard. Any artifact item must reference an
  // artifactId that exists for THIS instance — prevents a facilitator
  // from attaching cohort B's artifact id into cohort A's catalog.
  if (parsed.value.referenceGroups) {
    const artifactCheck = await validateArtifactReferences(id, parsed.value.referenceGroups);
    if (!artifactCheck.ok) {
      return NextResponse.json({ ok: false, error: artifactCheck.error }, { status: 400 });
    }
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
