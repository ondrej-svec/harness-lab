/**
 * Bilingual participant reference catalog schema (v1).
 *
 * Authoring source: workshop-content/reference.json. English is canonical;
 * Czech is a reviewed adaptation. Generated views (reference-cs.json,
 * reference-en.json) are emitted by scripts/content/generate-views.ts and
 * consumed at render time by dashboard/lib/public-page-view-model.ts.
 *
 * Href resolution stays in code because it depends on runtime env vars
 * (NEXT_PUBLIC_HARNESS_REPO_URL, VERCEL_GIT_REPO_OWNER/SLUG). The source
 * carries a `kind` discriminant and, when applicable, a repo-relative
 * `path`; repo-links.ts does the resolution at render time.
 */

// ---------------------------------------------------------------------------
// Item kinds — discriminated union by `kind`
// ---------------------------------------------------------------------------

type ReferenceItemBase = {
  id: string;
};

/** Literal absolute URL (e.g. `https://agents.md/`). */
export type ExternalReferenceItemShape = ReferenceItemBase & {
  kind: "external";
  href: string;
};

/** Repo-relative path to a file — rendered as a GitHub blob URL. */
export type RepoBlobReferenceItemShape = ReferenceItemBase & {
  kind: "repo-blob";
  path: string;
};

/** Repo-relative path to a directory — rendered as a GitHub tree URL. */
export type RepoTreeReferenceItemShape = ReferenceItemBase & {
  kind: "repo-tree";
  path: string;
};

/** The repository root — rendered as the public repo URL. */
export type RepoRootReferenceItemShape = ReferenceItemBase & {
  kind: "repo-root";
};

/**
 * A dashboard-hosted Markdown document — the body is authored in
 * `bodyPath` (a repo-relative .md file), inlined at build time into the
 * generated view as `body`, and rendered via the dashboard at
 * `/participant/reference/<id>`. An optional `sourceUrl` surfaces a
 * "view source" link back to GitHub for audit/trust.
 */
export type HostedReferenceItemShape = ReferenceItemBase & {
  kind: "hosted";
  /** Repo-relative path to the source .md file (build-time only). */
  bodyPath?: string;
  /** Optional GitHub link surfaced as "view source" on the body page. */
  sourceUrl?: string;
};

export type ReferenceItemShape =
  | ExternalReferenceItemShape
  | RepoBlobReferenceItemShape
  | RepoTreeReferenceItemShape
  | RepoRootReferenceItemShape
  | HostedReferenceItemShape;

export type ReferenceItemKind = ReferenceItemShape["kind"];

// ---------------------------------------------------------------------------
// Language-specific content
// ---------------------------------------------------------------------------

export type BilingualReferenceItemContent = {
  label: string;
  description: string;
};

export type BilingualReferenceGroupContent = {
  title: string;
  description: string;
};

// ---------------------------------------------------------------------------
// Bilingual nodes — structural fields + per-language content
// ---------------------------------------------------------------------------

export type BilingualReferenceItem = ReferenceItemShape & {
  en: BilingualReferenceItemContent;
  cs: BilingualReferenceItemContent;
  cs_reviewed: boolean;
};

export type ReferenceGroupId = "defaults" | "accelerators" | "explore";

export type BilingualReferenceGroup = {
  id: ReferenceGroupId;
  en: BilingualReferenceGroupContent;
  cs: BilingualReferenceGroupContent;
  cs_reviewed: boolean;
  items: BilingualReferenceItem[];
};

export type BilingualReferenceSource = {
  schemaVersion: 1;
  groups: BilingualReferenceGroup[];
};

// ---------------------------------------------------------------------------
// Generated view shape (single locale, pre-resolution)
// ---------------------------------------------------------------------------

/**
 * Generated (per-locale) item. Hosted items carry an inlined Markdown
 * `body` from the build step; bodyPath is stripped from the generated
 * view since it's only meaningful during generation. Other kinds leave
 * `body` undefined.
 */
export type GeneratedReferenceItem = ReferenceItemShape & BilingualReferenceItemContent & {
  /**
   * Markdown body, inlined from `bodyPath` at build time. Only set on
   * hosted items in the compiled default view. Wire-side (API PATCH of
   * the catalog) this field is rejected by the validator — bodies are
   * managed through a separate body endpoint + sidecar table.
   */
  body?: string;
};

export type GeneratedReferenceGroup = {
  id: ReferenceGroupId;
  title: string;
  description: string;
  items: GeneratedReferenceItem[];
};

export type GeneratedReferenceView = {
  schemaVersion: 1;
  groups: GeneratedReferenceGroup[];
};
