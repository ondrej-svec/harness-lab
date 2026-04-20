function isAllowedLocalHttpHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]"
  );
}

export function normalizeTeamRepoUrl(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: true as const, value: "" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false as const, error: "repoUrl must be a valid URL" };
  }

  if (parsed.protocol === "https:") {
    return { ok: true as const, value: trimmed };
  }

  if (parsed.protocol === "http:" && isAllowedLocalHttpHost(parsed.hostname)) {
    return { ok: true as const, value: trimmed };
  }

  return {
    ok: false as const,
    error: "repoUrl must use https unless it points to localhost",
  };
}
