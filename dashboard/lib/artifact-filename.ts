/**
 * Sanitize a user-supplied filename into one safe to embed in a blob
 * path, display via `Content-Disposition`, or write to disk in file
 * mode. Not a defense against blob-level access — the auth boundary is
 * the participant session + `(instanceId, id)` lookup — just a rule
 * that the bytes-on-disk side never sees weird input.
 *
 * Rules:
 * - Lowercase.
 * - Strip any character not in `[a-z0-9._-]`, collapsing runs to `-`.
 * - Trim leading dots so it is never a hidden file on disk.
 * - Trim leading/trailing `-`.
 * - Cap at 120 characters (tail-preserved so the extension survives).
 * - Fall back to `"file"` if the result is empty.
 */
export function sanitizeArtifactFilename(input: string): string {
  const lowered = input.trim().toLowerCase();
  const replaced = lowered.replace(/[^a-z0-9._-]+/g, "-");
  const stripped = replaced.replace(/^[.\-]+/, "").replace(/-+$/, "");
  if (!stripped) {
    return "file";
  }
  if (stripped.length <= 120) {
    return stripped;
  }
  // Preserve the extension: keep the final `.<ext>` and truncate the stem.
  const dot = stripped.lastIndexOf(".");
  if (dot > 0 && dot >= stripped.length - 10) {
    const ext = stripped.slice(dot);
    const stem = stripped.slice(0, 120 - ext.length);
    return `${stem}${ext}`;
  }
  return stripped.slice(0, 120);
}

/** Build the canonical blob key for an artifact. */
export function buildArtifactBlobKey(
  instanceId: string,
  artifactId: string,
  filename: string,
): string {
  return `artifacts/${instanceId}/${artifactId}/${sanitizeArtifactFilename(filename)}`;
}
