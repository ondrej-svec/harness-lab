/**
 * Upload validation for cohort-scoped artifacts. Enforces size + MIME
 * allowlist + label shape before the API hands bytes to blob storage.
 *
 * The facilitator-trusted upload path still runs these checks —
 * accidental oversize or wrong-type uploads are rejected cleanly at
 * ingress rather than discovered at serve time.
 */

const DEFAULT_MAX_BYTES = 25 * 1024 * 1024; // 25 MiB

const DEFAULT_ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  "text/html",
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
]);

const MAX_LABEL_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;

export type ArtifactUploadInput = {
  contentType: string;
  filename: string;
  byteSize: number;
  label: string;
  description?: string | null;
};

export type ArtifactUploadConstraints = {
  maxBytes?: number;
  allowedMimeTypes?: ReadonlySet<string>;
};

export type ArtifactValidationError =
  | { code: "empty_file"; message: string }
  | { code: "file_too_large"; message: string; maxBytes: number; actualBytes: number }
  | { code: "unsupported_content_type"; message: string; contentType: string }
  | { code: "missing_label"; message: string }
  | { code: "label_too_long"; message: string; maxLength: number }
  | { code: "description_too_long"; message: string; maxLength: number }
  | { code: "missing_filename"; message: string };

export type ArtifactValidationResult =
  | {
      ok: true;
      value: {
        contentType: string;
        filename: string;
        byteSize: number;
        label: string;
        description: string | null;
      };
    }
  | { ok: false; error: ArtifactValidationError };

function resolveMaxBytes(override?: number): number {
  if (typeof override === "number" && Number.isFinite(override) && override > 0) {
    return Math.floor(override);
  }
  const envRaw = process.env.ARTIFACT_MAX_BYTES;
  if (envRaw) {
    const parsed = Number.parseInt(envRaw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_MAX_BYTES;
}

export function validateArtifactUpload(
  input: ArtifactUploadInput,
  constraints: ArtifactUploadConstraints = {},
): ArtifactValidationResult {
  const maxBytes = resolveMaxBytes(constraints.maxBytes);
  const allowed = constraints.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;

  if (!Number.isFinite(input.byteSize) || input.byteSize <= 0) {
    return {
      ok: false,
      error: { code: "empty_file", message: "Artifact file must be non-empty." },
    };
  }

  if (input.byteSize > maxBytes) {
    return {
      ok: false,
      error: {
        code: "file_too_large",
        message: `Artifact exceeds the ${maxBytes}-byte limit.`,
        maxBytes,
        actualBytes: input.byteSize,
      },
    };
  }

  const contentType = input.contentType.trim().toLowerCase();
  if (!contentType || !allowed.has(contentType)) {
    return {
      ok: false,
      error: {
        code: "unsupported_content_type",
        message: `Content type "${input.contentType}" is not allowed.`,
        contentType: input.contentType,
      },
    };
  }

  const filename = input.filename.trim();
  if (!filename) {
    return {
      ok: false,
      error: {
        code: "missing_filename",
        message: "Artifact file must have a non-empty filename.",
      },
    };
  }

  const label = input.label.trim();
  if (!label) {
    return {
      ok: false,
      error: { code: "missing_label", message: "Artifact label is required." },
    };
  }
  if (label.length > MAX_LABEL_LENGTH) {
    return {
      ok: false,
      error: {
        code: "label_too_long",
        message: `Label must be ${MAX_LABEL_LENGTH} characters or fewer.`,
        maxLength: MAX_LABEL_LENGTH,
      },
    };
  }

  const descriptionRaw = input.description?.trim() ?? "";
  const description = descriptionRaw || null;
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      error: {
        code: "description_too_long",
        message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
        maxLength: MAX_DESCRIPTION_LENGTH,
      },
    };
  }

  return {
    ok: true,
    value: {
      contentType,
      filename,
      byteSize: input.byteSize,
      label,
      description,
    },
  };
}

export const ARTIFACT_MAX_LABEL_LENGTH = MAX_LABEL_LENGTH;
export const ARTIFACT_MAX_DESCRIPTION_LENGTH = MAX_DESCRIPTION_LENGTH;
export const ARTIFACT_ALLOWED_MIME_TYPES = DEFAULT_ALLOWED_MIME_TYPES;
