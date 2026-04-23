import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getBlueprintRepository } from "@/lib/blueprint-repository";

/**
 * GET /api/admin/blueprints/[id]
 * Fetch one blueprint. Returns 404 if not found.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireFacilitatorRequest(request, null);
  if (denied) return denied;

  const { id } = await context.params;
  const record = await getBlueprintRepository().get(id);
  if (!record) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, blueprint: record });
}

/**
 * DELETE /api/admin/blueprints/[id]
 * Remove a blueprint. Idempotent — deleting a non-existent id returns 200.
 * Deleting the default reference blueprint is refused to protect the
 * seed-from-empty invariant.
 */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireFacilitatorRequest(request, null);
  if (denied) return denied;

  const { id } = await context.params;

  if (id === "harness-lab-default") {
    return NextResponse.json(
      { ok: false, error: "cannot_delete_default" },
      { status: 400 },
    );
  }

  await getBlueprintRepository().delete(id);
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId: null,
    actorKind: "facilitator",
    action: "blueprint_delete",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: { blueprintId: id },
  });
  return NextResponse.json({ ok: true });
}
