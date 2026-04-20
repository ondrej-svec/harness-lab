import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCliSessionFromBearerToken, parseBearerToken } from "./facilitator-cli-auth-repository";
import { getFacilitatorAuthService } from "./facilitator-auth-service";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { hasFacilitatorPlatformAccess, resolveFacilitatorGrantWithBootstrap } from "./facilitator-session";
import { requireTrustedActionOrigin, isTrustedOrigin, untrustedOriginResponse } from "./request-integrity";
import { assertValidNeonAuthConfiguration, isNeonRuntimeMode } from "./runtime-auth-configuration";
import { resolveUiLanguage, withLang } from "./ui-language";
import { getWorkshopInstanceRepository } from "./workshop-instance-repository";

async function resolveRedirectLanguage() {
  const headerStore = await headers();
  const headerLang = headerStore.get("x-harness-ui-lang");
  return resolveUiLanguage(headerLang ?? undefined);
}

function unauthorizedResponse() {
  return new Response("Authentication required", { status: 401 });
}

function jsonErrorResponse(status: number, error: string) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function isNeonAuthMode() {
  if (!isNeonRuntimeMode()) {
    return false;
  }

  assertValidNeonAuthConfiguration();
  return true;
}

async function resolveTargetWorkshopInstance(instanceId?: string | null) {
  if (instanceId === null) {
    return { instanceId: null as null, errorResponse: null as Response | null };
  }

  const resolvedInstanceId = instanceId === undefined ? getCurrentWorkshopInstanceId() : instanceId;
  if (!resolvedInstanceId) {
    return {
      instanceId: null as null,
      errorResponse: jsonErrorResponse(400, "no target workshop selected"),
    };
  }

  const instance = await getWorkshopInstanceRepository().getInstance(resolvedInstanceId);
  if (!instance) {
    return {
      instanceId: null as null,
      errorResponse:
        instanceId === undefined
          ? jsonErrorResponse(400, "default workshop instance is not available")
          : jsonErrorResponse(404, "instance not found"),
    };
  }

  return { instanceId: resolvedInstanceId, errorResponse: null as Response | null };
}

/**
 * Guard for API routes: returns an error response if unauthorized, null if authorized.
 * Uses the Request object directly (no next/headers dependency).
 */
export async function requireFacilitatorRequest(request: Request, instanceId?: string | null) {
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

  const { instanceId: resolvedInstanceId, errorResponse } = await resolveTargetWorkshopInstance(instanceId);
  if (errorResponse) {
    return errorResponse;
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
        const hasPlatformAccess = await hasFacilitatorPlatformAccess(cliSession.neonUserId);
        return hasPlatformAccess ? null : unauthorizedResponse();
      }

      const { grant } = await resolveFacilitatorGrantWithBootstrap(resolvedInstanceId, cliSession.neonUserId);
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
  const { instanceId: resolvedInstanceId, errorResponse } = await resolveTargetWorkshopInstance(instanceId);
  if (errorResponse) {
    redirect(instanceId === undefined ? "/admin?error=default_instance_missing" : "/admin?error=instance_not_found");
  }

  const service = getFacilitatorAuthService();

  if (isNeonAuthMode()) {
    const authorized = await service.hasValidSession({ instanceId: resolvedInstanceId });
    if (!authorized) {
      const lang = await resolveRedirectLanguage();
      redirect(withLang("/admin/sign-in", lang));
    }
    return;
  }

  // File mode: Basic Auth from forwarded header
  const headerStore = await headers();
  const authorizationHeader = headerStore.get("x-harness-authorization") ?? headerStore.get("authorization");
  const authorized = await service.hasValidRequestCredentials({ authorizationHeader, instanceId: resolvedInstanceId });
  if (!authorized) {
    const lang = await resolveRedirectLanguage();
    redirect(withLang("/admin/sign-in", lang));
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
