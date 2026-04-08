import type { FacilitatorAuthService } from "./runtime-contracts";
import { decodeBasicAuthHeader } from "./admin-auth";
import { getAuditLogRepository } from "./audit-log-repository";
import { getAuthenticatedFacilitator, resolveFacilitatorGrantWithBootstrap } from "./facilitator-session";
import { getRuntimeStorageMode } from "./runtime-storage";
import { emitRuntimeAlert } from "./runtime-alert";
import { assertValidNeonAuthConfiguration } from "./runtime-auth-configuration";

/**
 * File-mode facilitator auth: Basic Auth header → password compare → grant check.
 * Used when HARNESS_STORAGE_MODE=file (local dev).
 */
class BasicFacilitatorAuthService implements FacilitatorAuthService {
  async hasValidRequestCredentials(options: {
    authorizationHeader: string | null;
    instanceId?: string | null;
  }) {
    const { authorizationHeader, instanceId } = options;
    const credentials = decodeBasicAuthHeader(authorizationHeader);

    if (!credentials) {
      return false;
    }

    // File mode: accept sample credentials (facilitator/secret)
    const expectedPassword = process.env.HARNESS_ADMIN_PASSWORD ?? "secret";
    const expectedUsername = process.env.HARNESS_ADMIN_USERNAME ?? "facilitator";

    if (credentials.username !== expectedUsername || credentials.password !== expectedPassword) {
      return false;
    }

    // File mode grants are auto-seeded, so this always passes
    void instanceId;
    return true;
  }

  async hasValidSession() {
    // Basic auth mode does not support session-based auth
    return false;
  }
}

/**
 * Neon Auth facilitator auth: session → neon_user_id → grant check (one hop).
 * Auto-bootstraps the first user as owner on a fresh instance.
 */
class NeonAuthFacilitatorAuthService implements FacilitatorAuthService {
  async hasValidRequestCredentials(
    _: { authorizationHeader: string | null; instanceId?: string | null },
  ) {
    void _;
    return false;
  }

  async hasValidSession(options: { instanceId?: string | null }) {
    const { instanceId } = options;
    const facilitator = await getAuthenticatedFacilitator();
    const userId = facilitator?.neonUserId ?? null;

    if (!userId) {
      await getAuditLogRepository().append({
        id: `audit-${Date.now()}`,
        instanceId: instanceId ?? null,
        actorKind: "facilitator",
        action: "facilitator_auth",
        result: "failure",
        createdAt: new Date().toISOString(),
        metadata: { reason: "no_session" },
      });
      return false;
    }

    if (!instanceId) {
      await getAuditLogRepository().append({
        id: `audit-${Date.now()}`,
        instanceId: null,
        actorKind: "facilitator",
        action: "facilitator_auth",
        result: "success",
        createdAt: new Date().toISOString(),
        metadata: { neonUserId: userId, scope: "platform" },
      });
      return true;
    }

    const { grant, autoBootstrapped } = await resolveFacilitatorGrantWithBootstrap(instanceId, userId);
    const hasGrant = Boolean(grant);

    if (!hasGrant) {
      emitRuntimeAlert({
        category: "facilitator_auth_failure",
        severity: "warning",
        instanceId,
        metadata: { reason: "missing_grant", neonUserId: userId },
      });
    }

    if (autoBootstrapped && grant) {
      await getAuditLogRepository().append({
        id: `audit-${Date.now()}`,
        instanceId,
        actorKind: "facilitator",
        action: "facilitator_auto_bootstrap",
        result: "success",
        createdAt: new Date().toISOString(),
        metadata: { neonUserId: userId, role: grant.role },
      });
    }

    await getAuditLogRepository().append({
      id: `audit-${Date.now()}`,
      instanceId,
      actorKind: "facilitator",
      action: "facilitator_auth",
      result: hasGrant ? "success" : "failure",
      createdAt: new Date().toISOString(),
      metadata: { neonUserId: userId, role: grant?.role ?? null },
    });

    return hasGrant;
  }
}

export function getFacilitatorAuthService(): FacilitatorAuthService {
  if (overrideService) {
    return overrideService;
  }

  if (getRuntimeStorageMode() === "neon") {
    assertValidNeonAuthConfiguration();
    return new NeonAuthFacilitatorAuthService();
  }

  return new BasicFacilitatorAuthService();
}

let overrideService: FacilitatorAuthService | null = null;

export function setFacilitatorAuthServiceForTests(service: FacilitatorAuthService | null) {
  overrideService = service;
}
