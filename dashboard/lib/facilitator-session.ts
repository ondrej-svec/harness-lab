import { auth } from "./auth/server";
import { getInstanceGrantRepository } from "./instance-grant-repository";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import type { InstanceGrantRecord } from "./runtime-contracts";
import { assertValidNeonAuthConfiguration, isNeonRuntimeMode } from "./runtime-auth-configuration";

export type AuthenticatedFacilitator = {
  neonUserId: string;
};

export type FacilitatorSession = {
  neonUserId: string;
  grant: InstanceGrantRecord;
};

export async function getAuthenticatedFacilitator(): Promise<AuthenticatedFacilitator | null> {
  if (!isNeonRuntimeMode()) {
    return null;
  }

  assertValidNeonAuthConfiguration();

  if (!auth) {
    return null;
  }

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  return userId ? { neonUserId: userId } : null;
}

export async function resolveFacilitatorGrant(instanceId: string, neonUserId: string): Promise<InstanceGrantRecord | null> {
  const repo = getInstanceGrantRepository();
  let grant = await repo.getActiveGrantByNeonUserId(instanceId, neonUserId);

  if (!grant) {
    const grantCount = await repo.countActiveGrants(instanceId);
    if (grantCount === 0) {
      grant = await repo.createGrant(instanceId, neonUserId, "owner");
    }
  }

  return grant;
}

/**
 * Get the current facilitator's session and grant info.
 * Returns null if not authenticated or no grant exists.
 */
export async function getFacilitatorSession(instanceId = getCurrentWorkshopInstanceId()): Promise<FacilitatorSession | null> {
  const facilitator = await getAuthenticatedFacilitator();
  if (!facilitator) {
    return null;
  }

  const grant = await resolveFacilitatorGrant(instanceId, facilitator.neonUserId);
  if (!grant) return null;

  return { neonUserId: facilitator.neonUserId, grant };
}
