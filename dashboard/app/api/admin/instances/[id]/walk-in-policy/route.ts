import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";

/**
 * PUT /api/admin/instances/[id]/walk-in-policy
 *
 * Facilitator toggle for `allow_walk_ins` on a workshop instance.
 * Default true preserves today's behavior; flipping to false turns
 * unknown-name identify into a polite "ask your facilitator to add you"
 * refusal.
 *
 * Body: { allowWalkIns: boolean }
 */
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: instanceId } = await context.params;

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  const body = (await request.json().catch(() => ({}))) as { allowWalkIns?: unknown };
  if (typeof body.allowWalkIns !== "boolean") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const repository = getWorkshopInstanceRepository();
  const existing = await repository.getInstance(instanceId);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (existing.allowWalkIns === body.allowWalkIns) {
    return NextResponse.json({ ok: true, allowWalkIns: existing.allowWalkIns });
  }

  await repository.updateInstance(instanceId, { ...existing, allowWalkIns: body.allowWalkIns });

  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "facilitator_walk_in_policy",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: { allowWalkIns: body.allowWalkIns },
  });

  return NextResponse.json({ ok: true, allowWalkIns: body.allowWalkIns });
}
