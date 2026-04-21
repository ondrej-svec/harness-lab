import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { getArtifactRepository } from "@/lib/artifact-repository";
import { getBlobStorage } from "@/lib/blob-storage";

export const runtime = "nodejs";

/**
 * DELETE /api/workshop/instances/[id]/artifacts/[artifactId]
 *
 * Removes the artifact row and the underlying blob. If the blob
 * delete fails, log and continue — the row is gone so the participant
 * surface already forgets the artifact; a stray blob is addressable by
 * a later cleanup sweep. 404 if the id does not belong to this instance.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; artifactId: string }> },
) {
  const { id, artifactId } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) return denied;

  const repo = getArtifactRepository();
  const record = await repo.get(id, artifactId);
  if (!record) {
    return NextResponse.json({ ok: false, error: "artifact not found" }, { status: 404 });
  }

  await repo.delete(id, artifactId);
  try {
    await getBlobStorage().delete(record.blobKey);
  } catch (err) {
    console.error("[artifacts] blob delete failed after row removed", {
      blobKey: record.blobKey,
      err,
    });
  }

  const facilitator = await getFacilitatorSession(id);
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId: id,
    actorKind: "facilitator",
    action: "instance_artifact_removed",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: {
      actorNeonUserId: facilitator?.neonUserId ?? null,
      artifactId: record.id,
      filename: record.filename,
    },
  });

  return NextResponse.json({ ok: true, artifactId: record.id });
}
