import { getArtifactRepository } from "@/lib/artifact-repository";
import { getBlobStorage } from "@/lib/blob-storage";
import { getParticipantSessionFromRequest } from "@/lib/event-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOT_FOUND_BODY = "Not found";

/** 404 both for "no such artifact" and "you're not in the right cohort" / "not signed in".
 *  We deliberately never leak the distinction — see the plan's Decision Rationale. */
function notFound() {
  return new Response(NOT_FOUND_BODY, {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function sanitizeHeaderFilename(filename: string): string {
  // Strip anything outside ASCII printable for the fallback `filename=` param.
  // Browsers handle the RFC 5987 fallback fine; we only need to avoid
  // characters that would break the header itself.
  return filename.replace(/[\r\n"\\]/g, "_");
}

/**
 * GET /participant/artifact/[artifactId]
 *
 * Streams a cohort-scoped artifact to an authenticated participant of
 * the *same* instance. Any mismatch — no session, wrong cohort,
 * unknown id — returns 404 so existence is never leaked.
 *
 * Uploaded HTML runs its own scripts (theme toggles, charts) but
 * cannot touch the dashboard origin: the `sandbox` CSP isolates it
 * from cookies, localStorage, and the parent document. This is the
 * security boundary for user-uploaded HTML — we do NOT rewrite the
 * bytes.
 *
 * Query `?download=1` flips `Content-Disposition` from `inline` to
 * `attachment` for the download affordance in the participant UI.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const session = await getParticipantSessionFromRequest(request);
  if (!session?.instanceId) {
    return notFound();
  }

  const { artifactId } = await params;
  // CRITICAL: always look up with the composite (instanceId, artifactId).
  // Never let the path parameter alone select a row, or cohort isolation
  // collapses.
  const artifact = await getArtifactRepository().get(session.instanceId, artifactId);
  if (!artifact) {
    return notFound();
  }

  let streamResult;
  try {
    streamResult = await getBlobStorage().stream(artifact.blobKey);
  } catch (err) {
    console.error("[participant-artifact] blob stream failed", {
      instanceId: session.instanceId,
      artifactId,
      blobKey: artifact.blobKey,
      err,
    });
    return notFound();
  }

  const url = new URL(request.url);
  const asDownload = url.searchParams.get("download") === "1";
  const safeFilename = sanitizeHeaderFilename(artifact.filename);
  const disposition = `${asDownload ? "attachment" : "inline"}; filename="${safeFilename}"`;

  // Prefer the metadata we already have (authoritative on upload). The
  // blob-side contentType can be "application/octet-stream" in file mode.
  const contentType = artifact.contentType || streamResult.contentType;
  const byteSize = artifact.byteSize || streamResult.byteSize;

  return new Response(streamResult.stream, {
    headers: {
      "content-type": contentType,
      "content-length": String(byteSize),
      "content-disposition": disposition,
      // Sandbox is the security boundary for uploaded HTML. The flags
      // chosen here deliberately DO NOT include `allow-same-origin` —
      // without it the document renders with a unique opaque origin, so
      // its scripts cannot read cookies, localStorage, or any other
      // state on the dashboard origin. `allow-scripts` keeps interactive
      // artifacts (theme toggles, charts) working; `allow-popups` and
      // `allow-forms` preserve everyday document behaviour inside the
      // sandbox. We deliberately do NOT pin `default-src 'self'`: the
      // sandbox's origin isolation is the boundary, and a stricter CSP
      // on top would only break legitimate inline `<style>` / `<script>`
      // blocks that these artifacts rely on for their own visual system.
      "content-security-policy":
        "sandbox allow-scripts allow-popups allow-forms allow-downloads",
      "x-content-type-options": "nosniff",
      // Never cache at intermediaries; cohort membership can change mid-session.
      "cache-control": "private, max-age=0, must-revalidate",
      // Belt-and-suspenders: do not allow the artifact to be iframed.
      "x-frame-options": "DENY",
    },
  });
}
