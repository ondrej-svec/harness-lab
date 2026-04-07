import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuditLogRecord, InstanceGrantRecord } from "./runtime-contracts";

describe("facilitator-auth-service (neon mode)", () => {
  const originalBaseUrl = process.env.NEON_AUTH_BASE_URL;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEON_AUTH_BASE_URL = "https://auth.example.com";
  });

  afterEach(() => {
    process.env.NEON_AUTH_BASE_URL = originalBaseUrl;
  });

  it("rejects a missing facilitator session and writes a failure audit log", async () => {
    const append = vi.fn<(record: AuditLogRecord) => Promise<void>>().mockResolvedValue();

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./auth/server", () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: null }),
      },
    }));
    vi.doMock("./audit-log-repository", () => ({
      getAuditLogRepository: () => ({ append }),
    }));
    vi.doMock("./instance-grant-repository", () => ({
      getInstanceGrantRepository: () => ({
        getActiveGrantByNeonUserId: vi.fn(),
        countActiveGrants: vi.fn(),
        createGrant: vi.fn(),
      }),
    }));
    vi.doMock("./runtime-alert", () => ({
      emitRuntimeAlert: vi.fn(),
    }));

    const { getFacilitatorAuthService } = await import("./facilitator-auth-service");

    await expect(
      getFacilitatorAuthService().hasValidSession({ instanceId: "sample-studio-a" }),
    ).resolves.toBe(false);
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        instanceId: "sample-studio-a",
        action: "facilitator_auth",
        result: "failure",
        metadata: { reason: "no_session" },
      }),
    );
  });

  it("auto-bootstraps the first facilitator as owner on a fresh instance", async () => {
    const append = vi.fn<(record: AuditLogRecord) => Promise<void>>().mockResolvedValue();
    const createdGrant: InstanceGrantRecord = {
      id: "grant-1",
      instanceId: "sample-studio-a",
      neonUserId: "user-1",
      role: "owner",
      grantedAt: "2026-04-07T12:00:00.000Z",
      revokedAt: null,
    };
    const repo = {
      getActiveGrantByNeonUserId: vi.fn().mockResolvedValue(null),
      countActiveGrants: vi.fn().mockResolvedValue(0),
      createGrant: vi.fn().mockResolvedValue(createdGrant),
    };

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./auth/server", () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
    }));
    vi.doMock("./audit-log-repository", () => ({
      getAuditLogRepository: () => ({ append }),
    }));
    vi.doMock("./instance-grant-repository", () => ({
      getInstanceGrantRepository: () => repo,
    }));
    vi.doMock("./runtime-alert", () => ({
      emitRuntimeAlert: vi.fn(),
    }));

    const { getFacilitatorAuthService } = await import("./facilitator-auth-service");

    await expect(
      getFacilitatorAuthService().hasValidSession({ instanceId: "sample-studio-a" }),
    ).resolves.toBe(true);
    expect(repo.createGrant).toHaveBeenCalledWith("sample-studio-a", "user-1", "owner");
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "facilitator_auto_bootstrap",
        result: "success",
        metadata: { neonUserId: "user-1", role: "owner" },
      }),
    );
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "facilitator_auth",
        result: "success",
        metadata: { neonUserId: "user-1", role: "owner" },
      }),
    );
  });

  it("emits a runtime alert when a signed-in user has no grant on a non-empty instance", async () => {
    const append = vi.fn<(record: AuditLogRecord) => Promise<void>>().mockResolvedValue();
    const emitRuntimeAlert = vi.fn();
    const repo = {
      getActiveGrantByNeonUserId: vi.fn().mockResolvedValue(null),
      countActiveGrants: vi.fn().mockResolvedValue(2),
      createGrant: vi.fn(),
    };

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./auth/server", () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { user: { id: "user-2" } } }),
      },
    }));
    vi.doMock("./audit-log-repository", () => ({
      getAuditLogRepository: () => ({ append }),
    }));
    vi.doMock("./instance-grant-repository", () => ({
      getInstanceGrantRepository: () => repo,
    }));
    vi.doMock("./runtime-alert", () => ({
      emitRuntimeAlert,
    }));

    const { getFacilitatorAuthService } = await import("./facilitator-auth-service");

    await expect(
      getFacilitatorAuthService().hasValidSession({ instanceId: "sample-studio-a" }),
    ).resolves.toBe(false);
    expect(emitRuntimeAlert).toHaveBeenCalledWith({
      category: "facilitator_auth_failure",
      severity: "warning",
      instanceId: "sample-studio-a",
      metadata: { reason: "missing_grant", neonUserId: "user-2" },
    });
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "facilitator_auth",
        result: "failure",
        metadata: { neonUserId: "user-2", role: null },
      }),
    );
  });

  it("accepts a facilitator with an existing active grant", async () => {
    const append = vi.fn<(record: AuditLogRecord) => Promise<void>>().mockResolvedValue();
    const repo = {
      getActiveGrantByNeonUserId: vi.fn().mockResolvedValue({
        id: "grant-2",
        instanceId: "sample-studio-a",
        neonUserId: "user-3",
        role: "operator",
        grantedAt: "2026-04-07T12:00:00.000Z",
        revokedAt: null,
      } satisfies InstanceGrantRecord),
      countActiveGrants: vi.fn(),
      createGrant: vi.fn(),
    };

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./auth/server", () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { user: { id: "user-3" } } }),
      },
    }));
    vi.doMock("./audit-log-repository", () => ({
      getAuditLogRepository: () => ({ append }),
    }));
    vi.doMock("./instance-grant-repository", () => ({
      getInstanceGrantRepository: () => repo,
    }));
    vi.doMock("./runtime-alert", () => ({
      emitRuntimeAlert: vi.fn(),
    }));

    const { getFacilitatorAuthService } = await import("./facilitator-auth-service");

    await expect(
      getFacilitatorAuthService().hasValidSession({ instanceId: "sample-studio-a" }),
    ).resolves.toBe(true);
    expect(repo.countActiveGrants).not.toHaveBeenCalled();
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "facilitator_auth",
        result: "success",
        metadata: { neonUserId: "user-3", role: "operator" },
      }),
    );
  });
});
