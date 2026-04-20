import { getSession as proxyGetSession } from "./auth/neon-auth-proxy";
import { getInstanceGrantRepository } from "./instance-grant-repository";
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

  // Uses the raw-fetch proxy (lib/auth/neon-auth-proxy.ts) instead of
  // the Neon Auth SDK because the SDK doesn't reliably forward an
  // Origin header from server-side calls — see the proxy module
  // header for the full story.
  const { data: session } = await proxyGetSession();
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
  // Defense-in-depth privilege boundary: a participant-role Neon user
  // with a stale grant must not pass the facilitator gate. Role check
  // first, grant lookup second. Bootstrap path keeps the same role
  // requirement (it always did), now made explicit at the entry.
  const hasPlatformAccess = await hasFacilitatorPlatformAccess(neonUserId);
  if (!hasPlatformAccess) {
    return { grant: null, autoBootstrapped: false };
  }

  const repo = getInstanceGrantRepository();
  let grant = await repo.getActiveGrantByNeonUserId(instanceId, neonUserId);
  let autoBootstrapped = false;

  if (!grant) {
    const grantCount = await repo.countActiveGrants(instanceId);
    if (grantCount === 0) {
      grant = await repo.createGrant(instanceId, neonUserId, "owner");
      autoBootstrapped = true;
    }
  }

  return { grant, autoBootstrapped };
}

export async function resolveFacilitatorGrant(instanceId: string, neonUserId: string): Promise<InstanceGrantRecord | null> {
  // Same privilege boundary as the bootstrap variant — never return a
  // grant for a non-admin Neon user, even if a row exists in
  // instance_grants. Today no code path can write such a row, but the
  // role check makes the boundary survive future refactors.
  const hasPlatformAccess = await hasFacilitatorPlatformAccess(neonUserId);
  if (!hasPlatformAccess) return null;
  return getInstanceGrantRepository().getActiveGrantByNeonUserId(instanceId, neonUserId);
}

/**
 * Get the current facilitator's session and grant info.
 * Returns null if not authenticated or no grant exists.
 */
export async function getFacilitatorSession(instanceId: string): Promise<FacilitatorSession | null> {
  const facilitator = await getAuthenticatedFacilitator();
  if (!facilitator) {
    return null;
  }

  const grant = await resolveFacilitatorGrant(instanceId, facilitator.neonUserId);
  if (!grant) return null;

  return { neonUserId: facilitator.neonUserId, grant };
}
