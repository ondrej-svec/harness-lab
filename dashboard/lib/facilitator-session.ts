import { auth } from "./auth/server";
import { getInstanceGrantRepository } from "./instance-grant-repository";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { getRuntimeStorageMode } from "./runtime-storage";
import type { InstanceGrantRecord } from "./runtime-contracts";

export type FacilitatorSession = {
  neonUserId: string;
  grant: InstanceGrantRecord;
};

/**
 * Get the current facilitator's session and grant info.
 * Returns null if not authenticated or no grant exists.
 */
export async function getFacilitatorSession(instanceId = getCurrentWorkshopInstanceId()): Promise<FacilitatorSession | null> {
  if (getRuntimeStorageMode() !== "neon" || !process.env.NEON_AUTH_BASE_URL) {
    return null;
  }

  if (!auth) return null;

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  const grant = await getInstanceGrantRepository().getActiveGrantByNeonUserId(instanceId, userId);
  if (!grant) return null;

  return { neonUserId: userId, grant };
}
