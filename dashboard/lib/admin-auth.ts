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

  if (pathname.startsWith("/api/workshop/instances")) {
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

export const fileModeAuthCookieName = "harness-admin-file-auth";

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

export function getExpectedFileModeCredentials() {
  return {
    username: process.env.HARNESS_ADMIN_USERNAME ?? "facilitator",
    password: process.env.HARNESS_ADMIN_PASSWORD ?? "secret",
  };
}

export function hasValidFileModeCredentials(authorizationHeader: string | null) {
  const credentials = decodeBasicAuthHeader(authorizationHeader);
  if (!credentials) {
    return false;
  }

  const { username, password } = getExpectedFileModeCredentials();
  return credentials.username === username && credentials.password === password;
}

export function hasValidFileModeSignInIdentity(identity: string) {
  const normalizedIdentity = identity.trim().toLowerCase();
  if (!normalizedIdentity) {
    return false;
  }

  const { username } = getExpectedFileModeCredentials();
  const acceptedIdentities = new Set([
    username.toLowerCase(),
    `${username.toLowerCase()}@example.com`,
  ]);
  return acceptedIdentities.has(normalizedIdentity);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function buildFileModeAuthToken(username: string, password: string) {
  const payload = new TextEncoder().encode(`${username}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return bytesToHex(new Uint8Array(digest));
}

export async function getExpectedFileModeAuthToken() {
  const { username, password } = getExpectedFileModeCredentials();
  return buildFileModeAuthToken(username, password);
}

export async function hasValidFileModeAuthToken(token: string | null) {
  if (!token) {
    return false;
  }

  return token === await getExpectedFileModeAuthToken();
}

export function getFileModeAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
}

export function parseCookieHeader(cookieHeader: string | null, cookieName: string) {
  if (!cookieHeader) {
    return null;
  }

  for (const entry of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = entry.trim().split("=");
    if (rawName === cookieName) {
      return rawValue.join("=") || null;
    }
  }

  return null;
}
