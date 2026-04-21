import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { getReferenceBodyRepository } from "@/lib/reference-body-repository";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { resolveEffectiveReferenceGroups } from "@/lib/workshop-data";
import referenceViewEn from "@/lib/generated/reference-en.json";
import referenceViewCs from "@/lib/generated/reference-cs.json";
import type { GeneratedReferenceView } from "@/lib/types/bilingual-reference";
import { randomUUID } from "node:crypto";

const MAX_BODY_BYTES = 256 * 1024; // 256 KiB — ample headroom for long docs

function findHostedItem(groups: GeneratedReferenceView["groups"], itemId: string) {
  for (const group of groups) {
    const item = group.items.find((i) => i.id === itemId);
    if (item && item.kind === "hosted") {
      return item;
    }
  }
  return null;
}

async function resolveDefaultBody(instanceId: string, itemId: string) {
  const instance = await getWorkshopInstanceRepository().getInstance(instanceId);
  if (!instance) return null;
  const lang = instance.workshopMeta?.contentLang === "en" ? "en" : "cs";
  const view = (lang === "en" ? referenceViewEn : referenceViewCs) as GeneratedReferenceView;
  const item = findHostedItem(view.groups, itemId);
  return item?.body ?? null;
}

/**
 * GET /api/workshop/instances/[id]/reference/[itemId]/body
 *
 * Returns the effective Markdown body for a hosted reference item —
 * instance-specific override first, compiled-default second, 404 if
 * neither exists (or the item isn't a hosted kind).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) return denied;

  const override = await getReferenceBodyRepository().get(id, itemId);
  if (override) {
    return NextResponse.json({
      ok: true,
      itemId,
      body: override.body,
      source: "override" as const,
      updatedAt: override.updatedAt,
    });
  }

  const defaultBody = await resolveDefaultBody(id, itemId);
  if (defaultBody) {
    return NextResponse.json({
      ok: true,
      itemId,
      body: defaultBody,
      source: "default" as const,
    });
  }
  return NextResponse.json({ ok: false, error: "hosted item not found" }, { status: 404 });
}

/**
 * PUT /api/workshop/instances/[id]/reference/[itemId]/body
 *
 * Stores a per-instance Markdown body override. Accepts raw text/markdown
 * or JSON `{ body: string }`. Emits an audit log entry.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) return denied;

  const contentType = request.headers.get("content-type") ?? "";
  let body: string | null = null;
  try {
    if (contentType.includes("application/json")) {
      const parsed = (await request.json()) as { body?: unknown };
      if (typeof parsed.body === "string") {
        body = parsed.body;
      } else {
        return NextResponse.json(
          { ok: false, error: "JSON body must contain a `body` string field" },
          { status: 400 },
        );
      }
    } else {
      body = await request.text();
    }
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body payload" }, { status: 400 });
  }

  if (!body || body.trim().length === 0) {
    return NextResponse.json(
      { ok: false, error: "body must be a non-empty string" },
      { status: 400 },
    );
  }
  if (Buffer.byteLength(body, "utf-8") > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: `body exceeds ${MAX_BODY_BYTES} bytes` },
      { status: 413 },
    );
  }

  const instance = await getWorkshopInstanceRepository().getInstance(id);
  if (!instance) {
    return NextResponse.json({ ok: false, error: "instance not found" }, { status: 404 });
  }

  const record = await getReferenceBodyRepository().upsert(id, itemId, body);
  const facilitator = await getFacilitatorSession(id);
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId: id,
    actorKind: "facilitator",
    action: "instance_reference_body_updated",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: {
      actorNeonUserId: facilitator?.neonUserId ?? null,
      itemId,
      bytes: Buffer.byteLength(body, "utf-8"),
    },
  });

  return NextResponse.json({
    ok: true,
    itemId,
    body: record.body,
    source: "override" as const,
    updatedAt: record.updatedAt,
  });
}

/**
 * DELETE /api/workshop/instances/[id]/reference/[itemId]/body
 *
 * Clears the per-instance override; subsequent reads fall back to the
 * compiled default (or 404 if there's no default for this item id).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) return denied;

  await getReferenceBodyRepository().delete(id, itemId);
  const facilitator = await getFacilitatorSession(id);
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId: id,
    actorKind: "facilitator",
    action: "instance_reference_body_cleared",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: {
      actorNeonUserId: facilitator?.neonUserId ?? null,
      itemId,
    },
  });

  return NextResponse.json({ ok: true, itemId });
}
