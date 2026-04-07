import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCliSessionFromBearerToken, parseBearerToken } from "./facilitator-cli-auth-repository";
import { getFacilitatorAuthService } from "./facilitator-auth-service";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { getRuntimeStorageMode } from "./runtime-storage";
import { requireTrustedActionOrigin, isTrustedOrigin, untrustedOriginResponse } from "./request-integrity";

function unauthorizedResponse() {
  return new Response("Authentication required", { status: 401 });
}

function isNeonAuthMode() {
  return getRuntimeStorageMode() === "neon" && Boolean(process.env.NEON_AUTH_BASE_URL);
}

/**
 * Guard for API routes: returns an error response if unauthorized, null if authorized.
 * Uses the Request object directly (no next/headers dependency).
 */
export async function requireFacilitatorRequest(request: Request) {
  if (request.method !== "GET") {
    if (
      !isTrustedOrigin({
        originHeader: request.headers.get("origin"),
        hostHeader: request.headers.get("host"),
        forwardedHostHeader: request.headers.get("x-forwarded-host"),
        requestUrl: request.url,
      })
    ) {
      return untrustedOriginResponse();
    }
  }

  const instanceId = getCurrentWorkshopInstanceId();
  const service = getFacilitatorAuthService();

  if (isNeonAuthMode()) {
    const bearerToken = parseBearerToken(request.headers.get("authorization"));
    if (bearerToken) {
      const cliSession = await getCliSessionFromBearerToken(bearerToken);
      return cliSession ? null : unauthorizedResponse();
    }

    // Neon Auth: session-based check (reads cookies from request context)
    const authorized = await service.hasValidSession({ instanceId });
    return authorized ? null : unauthorizedResponse();
  }

  // File mode: Basic Auth from request header
  const authorized = await service.hasValidRequestCredentials({
    authorizationHeader: request.headers.get("authorization"),
    instanceId,
  });
  return authorized ? null : unauthorizedResponse();
}

/**
 * Guard for admin page access (Server Components): redirects to sign-in if unauthorized.
 * Uses next/headers for Server Component context.
 */
export async function requireFacilitatorPageAccess(instanceId = getCurrentWorkshopInstanceId()) {
  const service = getFacilitatorAuthService();

  if (isNeonAuthMode()) {
    const authorized = await service.hasValidSession({ instanceId });
    if (!authorized) {
      redirect("/admin/sign-in");
    }
    return;
  }

  // File mode: Basic Auth from forwarded header
  const headerStore = await headers();
  const authorizationHeader = headerStore.get("x-harness-authorization") ?? headerStore.get("authorization");
  const authorized = await service.hasValidRequestCredentials({ authorizationHeader, instanceId });
  if (!authorized) {
    redirect("/admin/sign-in");
  }
}

/**
 * Guard for admin server actions: checks origin trust + auth.
 */
export async function requireFacilitatorActionAccess(instanceId = getCurrentWorkshopInstanceId()) {
  if (!(await requireTrustedActionOrigin())) {
    redirect("/");
  }

  await requireFacilitatorPageAccess(instanceId);
}
