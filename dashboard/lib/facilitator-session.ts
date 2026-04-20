import { auth } from "./auth/server";
import { getInstanceGrantRepository } from "./instance-grant-repository";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { getNeonSql } from "./neon-db";
import type { InstanceGrantRecord } from "./runtime-contracts";
import { assertValidNeonAuthConfiguration, isNeonRuntimeMode } from "./runtime-auth-configuration";

export type AuthenticatedFacilitator = {
  neonUserId: string;
};

export type FacilitatorSession = {
  neonUserId: string;
  grant: InstanceGrantRecord;
};

export type ResolvedFacilitatorGrant = {
  grant: InstanceGrantRecord | null;
  autoBootstrapped: boolean;
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

export async function hasFacilitatorPlatformAccess(neonUserId: string): Promise<boolean> {
  if (!isNeonRuntimeMode()) {
    return false;
  }

  const sql = getNeonSql();
  const rows = (await sql.query(
    `
      SELECT role
      FROM neon_auth."user"
      WHERE id::text = $1
      LIMIT 1
    `,
    [neonUserId],
  )) as Array<{ role: string | null }>;

  return rows[0]?.role === "admin";
}

export async function resolveFacilitatorGrantWithBootstrap(
  instanceId: string,
  neonUserId: string,
): Promise<ResolvedFacilitatorGrant> {
  const repo = getInstanceGrantRepository();
  let grant = await repo.getActiveGrantByNeonUserId(instanceId, neonUserId);
  let autoBootstrapped = false;

  if (!grant) {
    const grantCount = await repo.countActiveGrants(instanceId);
    if (grantCount === 0 && (await hasFacilitatorPlatformAccess(neonUserId))) {
      grant = await repo.createGrant(instanceId, neonUserId, "owner");
      autoBootstrapped = true;
    }
  }

  return { grant, autoBootstrapped };
}

export async function resolveFacilitatorGrant(instanceId: string, neonUserId: string): Promise<InstanceGrantRecord | null> {
  return getInstanceGrantRepository().getActiveGrantByNeonUserId(instanceId, neonUserId);
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
