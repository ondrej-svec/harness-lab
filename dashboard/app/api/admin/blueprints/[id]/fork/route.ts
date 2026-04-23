import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import {
  BlueprintNotFoundError,
  getBlueprintRepository,
} from "@/lib/blueprint-repository";

/**
 * POST /api/admin/blueprints/[id]/fork
 * Create a new blueprint by copying an existing one. Body: { newId, newName? }.
 * Returns 404 if the source does not exist, 409 if the target id already exists.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireFacilitatorRequest(request, null);
  if (denied) return denied;

  const { id: sourceId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { newId?: unknown; newName?: unknown }
    | null;
  if (!body || typeof body.newId !== "string" || body.newId.length === 0) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const newName = typeof body.newName === "string" ? body.newName : undefined;

  try {
    const record = await getBlueprintRepository().fork(sourceId, body.newId, newName);
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId: null,
      actorKind: "facilitator",
      action: "blueprint_fork",
      result: "success",
      createdAt: new Date().toISOString(),
      metadata: {
        sourceBlueprintId: sourceId,
        newBlueprintId: record.id,
      },
    });
    return NextResponse.json({ ok: true, blueprint: record });
  } catch (error) {
    if (error instanceof BlueprintNotFoundError) {
      return NextResponse.json({ ok: false, error: "source_not_found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ ok: false, error: "target_exists" }, { status: 409 });
    }
    throw error;
  }
}
