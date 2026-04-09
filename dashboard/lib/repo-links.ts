function readRepoUrl() {
  const value = process.env.NEXT_PUBLIC_HARNESS_REPO_URL?.trim();
  return value ? value.replace(/\/+$/, "") : null;
}

function readRepoBranch() {
  const value = process.env.NEXT_PUBLIC_HARNESS_REPO_BRANCH?.trim();
  return value || "main";
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
  const repoUrl = readRepoUrl();
  if (!repoUrl) {
    return null;
  }

  return `${repoUrl}/tree/${readRepoBranch()}/workshop-blueprint`;
}

export function buildRepoBlobUrl(path: string) {
  const repoUrl = readRepoUrl();
  if (!repoUrl) {
    return null;
  }

  return `${repoUrl}/blob/${readRepoBranch()}/${normalizeRepoPath(path)}`;
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
