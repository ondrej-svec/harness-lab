function readRepoUrl() {
  const value = process.env.NEXT_PUBLIC_HARNESS_REPO_URL?.trim();
  if (value) {
    return value.replace(/\/+$/, "");
  }

  const owner = process.env.VERCEL_GIT_REPO_OWNER?.trim();
  const slug = process.env.VERCEL_GIT_REPO_SLUG?.trim();
  if (owner && slug) {
    return `https://github.com/${owner}/${slug}`;
  }

  return null;
}

function readRepoBranch() {
  const value = process.env.NEXT_PUBLIC_HARNESS_REPO_BRANCH?.trim();
  if (value) {
    return value;
  }

  const vercelRef = process.env.VERCEL_GIT_COMMIT_REF?.trim();
  return vercelRef || "main";
}

function normalizeRepoPath(path: string) {
  return path.replace(/^\/+/, "");
}

function isExternalHref(value: string) {
  return /^[a-z]+:/i.test(value);
}

export function getPublicRepoUrl() {
  return readRepoUrl();
}

export function getBlueprintRepoUrl() {
  return buildRepoTreeUrl("workshop-blueprint");
}

export function buildRepoBlobUrl(path: string) {
  const repoUrl = readRepoUrl();
  if (!repoUrl) {
    return null;
  }

  return `${repoUrl}/blob/${readRepoBranch()}/${normalizeRepoPath(path)}`;
}

export function buildRepoTreeUrl(path: string) {
  const repoUrl = readRepoUrl();
  if (!repoUrl) {
    return null;
  }

  return `${repoUrl}/tree/${readRepoBranch()}/${normalizeRepoPath(path)}`;
}

export function resolveRepoLinkedHref(href: string | null | undefined) {
  if (!href) {
    return null;
  }

  if (href.startsWith("#") || href.startsWith("/") || isExternalHref(href)) {
    return href;
  }

  return buildRepoBlobUrl(href);
}
