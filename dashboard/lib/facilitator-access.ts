import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getFacilitatorAuthService } from "./facilitator-auth-service";
import { getCurrentWorkshopInstanceId } from "./instance-context";

function unauthorizedResponse() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Harness Lab Admin"',
    },
  });
}

export async function isAuthorizedFacilitatorRequest(authorizationHeader: string | null) {
  const cookieStore = await cookies();
  return getFacilitatorAuthService().hasValidRequestCredentials({
    authorizationHeader,
    instanceId: getCurrentWorkshopInstanceId(),
    forwardedUsername: cookieStore.get("harness_facilitator_username")?.value ?? null,
    forwardedPasswordHash: cookieStore.get("harness_facilitator_password_hash")?.value ?? null,
  });
}

export async function requireFacilitatorRequest(request: Request) {
  if (await isAuthorizedFacilitatorRequest(request.headers.get("authorization"))) {
    return null;
  }

  return unauthorizedResponse();
}

export async function requireFacilitatorPageAccess() {
  const headerStore = await headers();
  const authorizationHeader = headerStore.get("x-harness-authorization");

  if (!(await isAuthorizedFacilitatorRequest(authorizationHeader))) {
    redirect("/");
  }
}
