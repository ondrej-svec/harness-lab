import type { FacilitatorAuthService } from "./runtime-contracts";
import { decodeBasicAuthHeader } from "./admin-auth";
import { getAuditLogRepository } from "./audit-log-repository";
import { getFacilitatorIdentityRepository } from "./facilitator-identity-repository";
import { getInstanceGrantRepository } from "./instance-grant-repository";
import { hashSecret } from "./participant-event-access-repository";
import { emitRuntimeAlert } from "./runtime-alert";

class BasicFacilitatorAuthService implements FacilitatorAuthService {
  async hasValidRequestCredentials(options: {
    authorizationHeader: string | null;
    instanceId: string;
  }) {
    const { authorizationHeader, instanceId } = options;
    const credentials = decodeBasicAuthHeader(authorizationHeader);
    const username = credentials?.username ?? null;
    const passwordHash = credentials ? hashSecret(credentials.password) : null;

    if (!username || !passwordHash) {
      emitRuntimeAlert({
        category: "facilitator_auth_failure",
        severity: "warning",
        instanceId,
        metadata: { reason: "missing_credentials" },
      });
      await getAuditLogRepository().append({
        id: `audit-${Date.now()}`,
        instanceId,
        actorKind: "facilitator",
        action: "facilitator_auth",
        result: "failure",
        createdAt: new Date().toISOString(),
        metadata: { reason: "missing_credentials" },
      });
      return false;
    }

    const identity = await getFacilitatorIdentityRepository().findByUsername(username);
    if (!identity || identity.status !== "active" || !identity.passwordHash) {
      emitRuntimeAlert({
        category: "facilitator_auth_failure",
        severity: "warning",
        instanceId,
        metadata: { reason: "unknown_identity", username },
      });
      await getAuditLogRepository().append({
        id: `audit-${Date.now()}`,
        instanceId,
        actorKind: "facilitator",
        action: "facilitator_auth",
        result: "failure",
        createdAt: new Date().toISOString(),
        metadata: { reason: "unknown_identity", username },
      });
      return false;
    }

    if (identity.passwordHash !== passwordHash) {
      emitRuntimeAlert({
        category: "facilitator_auth_failure",
        severity: "warning",
        instanceId,
        metadata: { reason: "invalid_password", username },
      });
      await getAuditLogRepository().append({
        id: `audit-${Date.now()}`,
        instanceId,
        actorKind: "facilitator",
        action: "facilitator_auth",
        result: "failure",
        createdAt: new Date().toISOString(),
        metadata: { reason: "invalid_password", username },
      });
      return false;
    }

    const grant = await getInstanceGrantRepository().getActiveGrant(instanceId, identity.id);
    const hasGrant = Boolean(grant);

    if (!hasGrant) {
      emitRuntimeAlert({
        category: "facilitator_auth_failure",
        severity: "warning",
        instanceId,
        metadata: { reason: "missing_grant", username },
      });
    }

    await getAuditLogRepository().append({
      id: `audit-${Date.now()}`,
      instanceId,
      actorKind: "facilitator",
      action: "facilitator_auth",
      result: hasGrant ? "success" : "failure",
      createdAt: new Date().toISOString(),
      metadata: { username, role: grant?.role ?? null },
    });

    return hasGrant;
  }
}

export function getFacilitatorAuthService(): FacilitatorAuthService {
  return overrideService ?? new BasicFacilitatorAuthService();
}

let overrideService: FacilitatorAuthService | null = null;

export function setFacilitatorAuthServiceForTests(service: FacilitatorAuthService | null) {
  overrideService = service;
}
