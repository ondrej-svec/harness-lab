import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateArtifactUpload } from "./artifact-validation";

function baseInput(overrides: Partial<Parameters<typeof validateArtifactUpload>[0]> = {}) {
  return {
    contentType: "text/html",
    filename: "case-study.html",
    byteSize: 1024,
    label: "Case study",
    ...overrides,
  };
}

describe("validateArtifactUpload", () => {
  let prevMax: string | undefined;

  beforeEach(() => {
    prevMax = process.env.ARTIFACT_MAX_BYTES;
    delete process.env.ARTIFACT_MAX_BYTES;
  });

  afterEach(() => {
    if (prevMax === undefined) {
      delete process.env.ARTIFACT_MAX_BYTES;
    } else {
      process.env.ARTIFACT_MAX_BYTES = prevMax;
    }
  });

  it("accepts a valid HTML upload", () => {
    const result = validateArtifactUpload(baseInput());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        contentType: "text/html",
        filename: "case-study.html",
        byteSize: 1024,
        label: "Case study",
        description: null,
      });
    }
  });

  it("accepts every default allowed MIME type", () => {
    const cases = [
      "text/html",
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/svg+xml",
      "image/webp",
    ];
    for (const contentType of cases) {
      const result = validateArtifactUpload(baseInput({ contentType }));
      expect(result.ok, `expected ${contentType} to be accepted`).toBe(true);
    }
  });

  it("rejects a zero-byte upload", () => {
    const result = validateArtifactUpload(baseInput({ byteSize: 0 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("empty_file");
  });

  it("rejects oversized upload with the default 25 MiB cap", () => {
    const result = validateArtifactUpload(baseInput({ byteSize: 26 * 1024 * 1024 }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("file_too_large");
      if (result.error.code === "file_too_large") {
        expect(result.error.maxBytes).toBe(25 * 1024 * 1024);
      }
    }
  });

  it("honours the ARTIFACT_MAX_BYTES env override", () => {
    process.env.ARTIFACT_MAX_BYTES = "1000";
    const under = validateArtifactUpload(baseInput({ byteSize: 999 }));
    expect(under.ok).toBe(true);
    const over = validateArtifactUpload(baseInput({ byteSize: 1001 }));
    expect(over.ok).toBe(false);
  });

  it("accepts a constraints.maxBytes override over the env", () => {
    process.env.ARTIFACT_MAX_BYTES = "500";
    const result = validateArtifactUpload(baseInput({ byteSize: 900 }), { maxBytes: 2000 });
    expect(result.ok).toBe(true);
  });

  it("rejects disallowed MIME types", () => {
    const result = validateArtifactUpload(baseInput({ contentType: "application/zip" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("unsupported_content_type");
  });

  it("is case-insensitive on content type", () => {
    const result = validateArtifactUpload(baseInput({ contentType: "TEXT/HTML" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.contentType).toBe("text/html");
  });

  it("rejects a missing filename", () => {
    const result = validateArtifactUpload(baseInput({ filename: "   " }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("missing_filename");
  });

  it("rejects a missing label", () => {
    const result = validateArtifactUpload(baseInput({ label: "  " }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("missing_label");
  });

  it("rejects an over-long label", () => {
    const result = validateArtifactUpload(baseInput({ label: "x".repeat(201) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("label_too_long");
  });

  it("rejects an over-long description", () => {
    const result = validateArtifactUpload(
      baseInput({ description: "x".repeat(1001) } as never),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("description_too_long");
  });

  it("normalises description: empty string → null", () => {
    const result = validateArtifactUpload(baseInput({ description: "" } as never));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.description).toBeNull();
  });

  it("trims label and keeps trimmed description", () => {
    const result = validateArtifactUpload(
      baseInput({ label: "  trimmed  ", description: "  keep me  " } as never),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.label).toBe("trimmed");
      expect(result.value.description).toBe("keep me");
    }
  });

  it("rejects a custom-allowlist MIME not in the custom list", () => {
    const result = validateArtifactUpload(baseInput({ contentType: "text/html" }), {
      allowedMimeTypes: new Set(["application/pdf"]),
    });
    expect(result.ok).toBe(false);
  });
});
