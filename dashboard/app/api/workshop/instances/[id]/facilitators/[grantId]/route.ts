import { NextResponse } from "next/server";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getInstanceGrantRepository } from "@/lib/instance-grant-repository";
import { getAuditLogRepository } from "@/lib/audit-log-repository";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; grantId: string }> },
) {
  const { id: instanceId, grantId } = await params;
  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  const facilitator = await getFacilitatorSession(instanceId);
  if (!facilitator || facilitator.grant.role !== "owner") {
    return NextResponse.json({ ok: false, error: "owner role required" }, { status: 403 });
  }

  // Prevent self-revocation
  if (grantId === facilitator.grant.id) {
    return NextResponse.json({ ok: false, error: "cannot revoke your own grant" }, { status: 400 });
  }

  await getInstanceGrantRepository().revokeGrant(grantId);

  await getAuditLogRepository().append({
    id: `audit-${Date.now()}`,
    instanceId,
    actorKind: "facilitator",
    action: "facilitator_grant_revoked",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: {
      revokedByNeonUserId: facilitator.neonUserId,
      revokedGrantId: grantId,
    },
  });

  return NextResponse.json({ ok: true });
}
