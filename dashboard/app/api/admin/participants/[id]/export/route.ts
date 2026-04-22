import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { exportParticipantData } from "@/lib/participant-data-export";
import { getParticipantRepository } from "@/lib/participant-repository";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";

// GDPR Art. 20 export endpoint — returns a JSON dump of all data linked
// to a participant. Facilitator-gated and audit-logged. File mode is
// not supported because workshop data in file mode lives in tracked
// JSON fixtures, not in a privacy-relevant runtime.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const instanceId = url.searchParams.get("instanceId")?.trim();
  if (!instanceId) {
    return NextResponse.json({ ok: false, error: "instanceId is required" }, { status: 400 });
  }

  if (getRuntimeStorageMode() !== "neon") {
    return NextResponse.json(
      { ok: false, error: "gdpr_export_requires_neon_mode" },
      { status: 400 },
    );
  }

  const denied = await requireFacilitatorRequest(request, instanceId);
  if (denied) return denied;

  const participants = getParticipantRepository();
  const participant = await participants.findParticipant(instanceId, id);
  if (!participant) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const payload = await exportParticipantData(id, instanceId);

  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "participant.export",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: { participantId: id, displayName: participant.displayName },
  });

  const filename = `participant-${id}-${instanceId}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
