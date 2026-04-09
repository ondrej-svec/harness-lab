import { afterEach, describe, expect, it } from "vitest";
import { buildRepoBlobUrl, getBlueprintRepoUrl, getPublicRepoUrl, resolveRepoLinkedHref } from "./repo-links";

const originalEnv = {
  NEXT_PUBLIC_HARNESS_REPO_URL: process.env.NEXT_PUBLIC_HARNESS_REPO_URL,
  NEXT_PUBLIC_HARNESS_REPO_BRANCH: process.env.NEXT_PUBLIC_HARNESS_REPO_BRANCH,
  VERCEL_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER,
  VERCEL_GIT_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG,
  VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
};

function resetRepoEnv() {
  process.env.NEXT_PUBLIC_HARNESS_REPO_URL = originalEnv.NEXT_PUBLIC_HARNESS_REPO_URL;
  process.env.NEXT_PUBLIC_HARNESS_REPO_BRANCH = originalEnv.NEXT_PUBLIC_HARNESS_REPO_BRANCH;
  process.env.VERCEL_GIT_REPO_OWNER = originalEnv.VERCEL_GIT_REPO_OWNER;
  process.env.VERCEL_GIT_REPO_SLUG = originalEnv.VERCEL_GIT_REPO_SLUG;
  process.env.VERCEL_GIT_COMMIT_REF = originalEnv.VERCEL_GIT_COMMIT_REF;
}

describe("repo-links", () => {
  afterEach(() => {
    resetRepoEnv();
  });

  it("prefers explicit public repo env values when present", () => {
    process.env.NEXT_PUBLIC_HARNESS_REPO_URL = "https://github.com/example/custom-harness";
    process.env.NEXT_PUBLIC_HARNESS_REPO_BRANCH = "release-ready";
    process.env.VERCEL_GIT_REPO_OWNER = "fallback-owner";
    process.env.VERCEL_GIT_REPO_SLUG = "fallback-slug";
    process.env.VERCEL_GIT_COMMIT_REF = "preview-branch";

    expect(getPublicRepoUrl()).toBe("https://github.com/example/custom-harness");
    expect(getBlueprintRepoUrl()).toBe("https://github.com/example/custom-harness/tree/release-ready/workshop-blueprint");
    expect(buildRepoBlobUrl("workshop-skill/install.md")).toBe(
      "https://github.com/example/custom-harness/blob/release-ready/workshop-skill/install.md",
    );
  });

  it("falls back to Vercel git metadata when explicit repo env is absent", () => {
    delete process.env.NEXT_PUBLIC_HARNESS_REPO_URL;
    delete process.env.NEXT_PUBLIC_HARNESS_REPO_BRANCH;
    process.env.VERCEL_GIT_REPO_OWNER = "ondrej-svec";
    process.env.VERCEL_GIT_REPO_SLUG = "harness-lab";
    process.env.VERCEL_GIT_COMMIT_REF = "main";

    expect(getPublicRepoUrl()).toBe("https://github.com/ondrej-svec/harness-lab");
    expect(buildRepoBlobUrl("content/facilitation/master-guide.md")).toBe(
      "https://github.com/ondrej-svec/harness-lab/blob/main/content/facilitation/master-guide.md",
    );
    expect(resolveRepoLinkedHref("README.md")).toBe("https://github.com/ondrej-svec/harness-lab/blob/main/README.md");
  });

  it("keeps external and hash links unchanged", () => {
    process.env.NEXT_PUBLIC_HARNESS_REPO_URL = "https://github.com/example/custom-harness";

    expect(resolveRepoLinkedHref("https://example.com/guide")).toBe("https://example.com/guide");
    expect(resolveRepoLinkedHref("#overview")).toBe("#overview");
    expect(resolveRepoLinkedHref("/admin")).toBe("/admin");
  });
});
