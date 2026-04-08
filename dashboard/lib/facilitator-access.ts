import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCliSessionFromBearerToken, parseBearerToken } from "./facilitator-cli-auth-repository";
import { getFacilitatorAuthService } from "./facilitator-auth-service";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { resolveFacilitatorGrant } from "./facilitator-session";
import { requireTrustedActionOrigin, isTrustedOrigin, untrustedOriginResponse } from "./request-integrity";
import { assertValidNeonAuthConfiguration, isNeonRuntimeMode } from "./runtime-auth-configuration";

function unauthorizedResponse() {
  return new Response("Authentication required", { status: 401 });
}

function isNeonAuthMode() {
  if (!isNeonRuntimeMode()) {
    return false;
  }

  assertValidNeonAuthConfiguration();
  return true;
}

/**
 * Guard for API routes: returns an error response if unauthorized, null if authorized.
 * Uses the Request object directly (no next/headers dependency).
 */
export async function requireFacilitatorRequest(request: Request, instanceId?: string | null) {
  const resolvedInstanceId = instanceId === undefined ? getCurrentWorkshopInstanceId() : instanceId;
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

  const service = getFacilitatorAuthService();

  if (isNeonAuthMode()) {
    const bearerToken = parseBearerToken(request.headers.get("authorization"));
    if (bearerToken) {
      const cliSession = await getCliSessionFromBearerToken(bearerToken);
      if (!cliSession) {
        return unauthorizedResponse();
      }

      if (!resolvedInstanceId) {
        return null;
      }

      const grant = await resolveFacilitatorGrant(resolvedInstanceId, cliSession.neonUserId);
      return grant ? null : unauthorizedResponse();
    }

    // Neon Auth: session-based check (reads cookies from request context)
    const authorized = await service.hasValidSession({ instanceId: resolvedInstanceId });
    return authorized ? null : unauthorizedResponse();
  }

  // File mode: Basic Auth from request header
  const authorized = await service.hasValidRequestCredentials({
    authorizationHeader: request.headers.get("authorization"),
    instanceId: resolvedInstanceId,
  });
  return authorized ? null : unauthorizedResponse();
}

/**
 * Guard for admin page access (Server Components): redirects to sign-in if unauthorized.
 * Uses next/headers for Server Component context.
 */
export async function requireFacilitatorPageAccess(instanceId?: string | null) {
  const resolvedInstanceId = instanceId === undefined ? getCurrentWorkshopInstanceId() : instanceId;
  const service = getFacilitatorAuthService();

  if (isNeonAuthMode()) {
    const authorized = await service.hasValidSession({ instanceId: resolvedInstanceId });
    if (!authorized) {
      redirect("/admin/sign-in");
    }
    return;
  }

  // File mode: Basic Auth from forwarded header
  const headerStore = await headers();
  const authorizationHeader = headerStore.get("x-harness-authorization") ?? headerStore.get("authorization");
  const authorized = await service.hasValidRequestCredentials({ authorizationHeader, instanceId: resolvedInstanceId });
  if (!authorized) {
    redirect("/admin/sign-in");
  }
}

/**
 * Guard for admin server actions: checks origin trust + auth.
 */
export async function requireFacilitatorActionAccess(instanceId?: string | null) {
  if (!(await requireTrustedActionOrigin())) {
    redirect("/");
  }

  await requireFacilitatorPageAccess(instanceId);
}
