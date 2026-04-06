import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getFacilitatorAuthService } from "./facilitator-auth-service";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { requireTrustedActionOrigin, isTrustedOrigin, untrustedOriginResponse } from "./request-integrity";

function unauthorizedResponse() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Harness Lab Admin"',
    },
  });
}

export async function isAuthorizedFacilitatorRequest(authorizationHeader: string | null) {
  return getFacilitatorAuthService().hasValidRequestCredentials({
    authorizationHeader,
    instanceId: getCurrentWorkshopInstanceId(),
  });
}

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

  if (await isAuthorizedFacilitatorRequest(request.headers.get("authorization"))) {
    return null;
  }

  return unauthorizedResponse();
}

export async function requireFacilitatorPageAccess() {
  const headerStore = await headers();
  const authorizationHeader = headerStore.get("x-harness-authorization") ?? headerStore.get("authorization");

  if (!(await isAuthorizedFacilitatorRequest(authorizationHeader))) {
    redirect("/");
  }
}

export async function requireFacilitatorActionAccess() {
  if (!(await requireTrustedActionOrigin())) {
    redirect("/");
  }

  await requireFacilitatorPageAccess();
}
