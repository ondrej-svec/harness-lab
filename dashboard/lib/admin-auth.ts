export const protectedWritePaths = new Set([
  "/api/agenda",
  "/api/admin/teams",
  "/api/checkpoints",
  "/api/monitoring",
  "/api/rotation",
  "/api/workshop",
  "/api/workshop/archive",
]);

export function isProtectedPath(pathname: string, method: string) {
  if (pathname.startsWith("/admin")) {
    return true;
  }

  if (pathname.startsWith("/api/challenges/") && pathname.endsWith("/complete")) {
    return true;
  }

  if (protectedWritePaths.has(pathname) && method !== "GET") {
    return true;
  }

  if (pathname === "/api/monitoring") {
    return true;
  }

  return false;
}

export function decodeBasicAuthHeader(header: string | null) {
  if (!header?.startsWith("Basic ")) {
    return null;
  }

  try {
    const encoded = header.slice("Basic ".length);
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}
