import { headers } from "next/headers";

function normalizeOriginHost(origin: string) {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

function getTrustedHost(hostHeader: string | null, forwardedHostHeader: string | null) {
  return forwardedHostHeader ?? hostHeader;
}

export function isTrustedOrigin(options: {
  originHeader: string | null;
  hostHeader: string | null;
  forwardedHostHeader?: string | null;
  requestUrl?: string | null;
}) {
  const { originHeader, hostHeader, forwardedHostHeader, requestUrl } = options;
  const originHost = originHeader ? normalizeOriginHost(originHeader) : null;
  const fallbackHost = requestUrl ? normalizeOriginHost(requestUrl) : null;
  const trustedHost = getTrustedHost(hostHeader, forwardedHostHeader ?? null) ?? fallbackHost;

  if (!originHost || !trustedHost) {
    return false;
  }

  return originHost === trustedHost;
}

export function untrustedOriginResponse() {
  return new Response("Invalid origin", { status: 403 });
}

export async function requireTrustedActionOrigin() {
  const headerStore = await headers();

  if (
    !isTrustedOrigin({
      originHeader: headerStore.get("origin"),
      hostHeader: headerStore.get("host"),
      forwardedHostHeader: headerStore.get("x-forwarded-host"),
    })
  ) {
    return false;
  }

  return true;
}
