import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import {
  BlueprintConflictError,
  getBlueprintRepository,
  type UpsertBlueprintInput,
} from "@/lib/blueprint-repository";

/**
 * GET /api/admin/blueprints
 * List all blueprints. Workspace-scoped (not instance-scoped); any
 * authenticated facilitator with platform access can list.
 */
export async function GET(request: Request) {
  const denied = await requireFacilitatorRequest(request, null);
  if (denied) return denied;

  const blueprints = await getBlueprintRepository().list();
  return NextResponse.json({ ok: true, blueprints });
}

type UpsertBody = Partial<UpsertBlueprintInput> & { id?: unknown };

/**
 * POST /api/admin/blueprints
 * Upsert a blueprint. If `expectedVersion` is set, the write is gated by
 * optimistic concurrency and a conflict returns 409.
 *
 * Body: { id, name?, body, metadata?, language?, teamMode?, expectedVersion? }
 */
export async function POST(request: Request) {
  const denied = await requireFacilitatorRequest(request, null);
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as UpsertBody | null;
  if (!body || typeof body.id !== "string" || body.id.length === 0) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  if (!body.body || typeof body.body !== "object") {
    return NextResponse.json({ ok: false, error: "body_required" }, { status: 400 });
  }

  const input: UpsertBlueprintInput = {
    id: body.id,
    name: typeof body.name === "string" ? body.name : undefined,
    body: body.body as Record<string, unknown>,
    metadata:
      typeof body.metadata === "object" && body.metadata
        ? (body.metadata as Record<string, unknown>)
        : undefined,
    language: typeof body.language === "string" ? body.language : undefined,
    teamMode: typeof body.teamMode === "boolean" ? body.teamMode : undefined,
    expectedVersion:
      typeof body.expectedVersion === "number" ? body.expectedVersion : undefined,
  };

  try {
    const record = await getBlueprintRepository().put(input);
    await getAuditLogRepository().append({
      id: `audit-${randomUUID()}`,
      instanceId: null,
      actorKind: "facilitator",
      action: "blueprint_upsert",
      result: "success",
      createdAt: new Date().toISOString(),
      metadata: {
        blueprintId: record.id,
        version: record.version,
      },
    });
    return NextResponse.json({ ok: true, blueprint: record });
  } catch (error) {
    if (error instanceof BlueprintConflictError) {
      return NextResponse.json({ ok: false, error: "version_conflict" }, { status: 409 });
    }
    throw error;
  }
}
