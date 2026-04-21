import { describe, expect, it } from "vitest";
import { buildArtifactBlobKey, sanitizeArtifactFilename } from "./artifact-filename";

describe("sanitizeArtifactFilename", () => {
  it("lowercases and preserves safe characters", () => {
    expect(sanitizeArtifactFilename("Case-Study.HTML")).toBe("case-study.html");
  });

  it("collapses whitespace and unsafe runs into a single dash", () => {
    expect(sanitizeArtifactFilename("My Case Study v2.html")).toBe("my-case-study-v2.html");
    expect(sanitizeArtifactFilename("a///b???c.pdf")).toBe("a-b-c.pdf");
  });

  it("strips leading dots so it is never a hidden file", () => {
    expect(sanitizeArtifactFilename("..hidden.html")).toBe("hidden.html");
    expect(sanitizeArtifactFilename(".env")).toBe("env");
  });

  it("trims trailing dashes", () => {
    expect(sanitizeArtifactFilename("weird---")).toBe("weird");
  });

  it("rejects path traversal attempts", () => {
    expect(sanitizeArtifactFilename("../../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeArtifactFilename("../a.html")).toBe("a.html");
  });

  it("falls back to 'file' when the result is empty", () => {
    expect(sanitizeArtifactFilename("")).toBe("file");
    expect(sanitizeArtifactFilename("!!!")).toBe("file");
    expect(sanitizeArtifactFilename("...")).toBe("file");
  });

  it("caps length at 120 characters", () => {
    const long = "a".repeat(200) + ".html";
    const result = sanitizeArtifactFilename(long);
    expect(result.length).toBeLessThanOrEqual(120);
    // Extension preserved when short enough.
    expect(result.endsWith(".html")).toBe(true);
  });

  it("truncates without preserving extension when the 'extension' is very long", () => {
    const long = "a".repeat(130) + "." + "x".repeat(40);
    const result = sanitizeArtifactFilename(long);
    expect(result.length).toBeLessThanOrEqual(120);
  });
});

describe("buildArtifactBlobKey", () => {
  it("composes the canonical path with sanitized filename", () => {
    expect(buildArtifactBlobKey("inst-a", "abc123", "Case Study.html")).toBe(
      "artifacts/inst-a/abc123/case-study.html",
    );
  });
});
