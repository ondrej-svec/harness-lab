import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireFacilitatorRequest } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import {
  generateArtifactId,
  getArtifactRepository,
  type ArtifactRecord,
} from "@/lib/artifact-repository";
import { getBlobStorage } from "@/lib/blob-storage";
import { validateArtifactUpload } from "@/lib/artifact-validation";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";

export const runtime = "nodejs";

function toApiArtifact(record: ArtifactRecord) {
  return {
    id: record.id,
    label: record.label,
    description: record.description,
    filename: record.filename,
    contentType: record.contentType,
    byteSize: record.byteSize,
    uploadedAt: record.uploadedAt,
  };
}

/**
 * GET /api/workshop/instances/[id]/artifacts
 *
 * Lists cohort-scoped artifacts. Blob keys are deliberately omitted —
 * this API is for management surfaces, not for constructing direct
 * blob URLs (those stay server-side).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) return denied;

  const records = await getArtifactRepository().listForInstance(id);
  return NextResponse.json({
    ok: true,
    artifacts: records.map(toApiArtifact),
  });
}

/**
 * POST /api/workshop/instances/[id]/artifacts
 *
 * Multipart upload. Fields:
 * - `file`       (required) — the artifact bytes, with `type` as MIME
 * - `label`      (required) — short human label shown in the reference catalog
 * - `description` (optional) — longer human description
 *
 * Validates size + MIME + label shape, uploads bytes to blob storage,
 * records the row, emits an audit log. Returns the created record
 * (without the blob key).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const denied = await requireFacilitatorRequest(request, id);
  if (denied) return denied;

  const instance = await getWorkshopInstanceRepository().getInstance(id);
  if (!instance) {
    return NextResponse.json({ ok: false, error: "instance not found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "expected multipart/form-data body" },
      { status: 400 },
    );
  }

  const fileEntry = form.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "multipart field `file` is required" },
      { status: 400 },
    );
  }

  const label = typeof form.get("label") === "string" ? (form.get("label") as string) : "";
  const descriptionRaw = form.get("description");
  const description = typeof descriptionRaw === "string" ? descriptionRaw : null;

  const validation = validateArtifactUpload({
    contentType: fileEntry.type,
    filename: fileEntry.name,
    byteSize: fileEntry.size,
    label,
    description,
  });
  if (!validation.ok) {
    const status = validation.error.code === "file_too_large" ? 413 : 400;
    return NextResponse.json({ ok: false, error: validation.error }, { status });
  }

  const artifactId = generateArtifactId();
  const data = Buffer.from(await fileEntry.arrayBuffer());

  let blobKey: string;
  let byteSize: number;
  try {
    const uploaded = await getBlobStorage().upload({
      instanceId: id,
      artifactId,
      filename: validation.value.filename,
      contentType: validation.value.contentType,
      data,
    });
    blobKey = uploaded.blobKey;
    byteSize = uploaded.byteSize;
  } catch (err) {
    console.error("[artifacts] blob upload failed", { instanceId: id, artifactId, err });
    return NextResponse.json(
      { ok: false, error: "blob upload failed" },
      { status: 502 },
    );
  }

  let record: ArtifactRecord;
  try {
    record = await getArtifactRepository().create({
      instanceId: id,
      id: artifactId,
      blobKey,
      contentType: validation.value.contentType,
      filename: validation.value.filename,
      byteSize,
      label: validation.value.label,
      description: validation.value.description,
    });
  } catch (err) {
    // DB write failed after blob write — clean up the orphan blob so
    // storage doesn't accumulate rows we can't serve.
    console.error("[artifacts] repository write failed after blob upload", {
      instanceId: id,
      artifactId,
      err,
    });
    try {
      await getBlobStorage().delete(blobKey);
    } catch (cleanupErr) {
      console.error("[artifacts] orphan blob cleanup failed", { blobKey, cleanupErr });
    }
    return NextResponse.json({ ok: false, error: "artifact write failed" }, { status: 500 });
  }

  const facilitator = await getFacilitatorSession(id);
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId: id,
    actorKind: "facilitator",
    action: "instance_artifact_uploaded",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: {
      actorNeonUserId: facilitator?.neonUserId ?? null,
      artifactId: record.id,
      contentType: record.contentType,
      byteSize: record.byteSize,
      filename: record.filename,
    },
  });

  return NextResponse.json(
    { ok: true, artifact: toApiArtifact(record) },
    { status: 201 },
  );
}
