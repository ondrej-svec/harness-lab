import { headers } from "next/headers";
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
  return getFacilitatorAuthService().hasValidRequestCredentials({
    authorizationHeader,
    instanceId: getCurrentWorkshopInstanceId(),
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
