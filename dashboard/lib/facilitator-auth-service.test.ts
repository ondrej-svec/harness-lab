import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "./audit-log-repository";
import { getFacilitatorAuthService } from "./facilitator-auth-service";
import { setInstanceGrantRepositoryForTests } from "./instance-grant-repository";
import type {
  AuditLogRecord,
  FacilitatorGrantInfo,
  InstanceGrantRecord,
  InstanceGrantRepository,
} from "./runtime-contracts";

class MemoryInstanceGrantRepository implements InstanceGrantRepository {
  constructor(private grants: InstanceGrantRecord[]) {}

  async getActiveGrantByNeonUserId(instanceId: string, neonUserId: string) {
    return (
      this.grants.find(
        (item) =>
          item.instanceId === instanceId &&
          item.neonUserId === neonUserId &&
          item.revokedAt === null,
      ) ?? null
    );
  }

  async listActiveGrants(instanceId: string): Promise<FacilitatorGrantInfo[]> {
    return this.grants
      .filter((item) => item.instanceId === instanceId && !item.revokedAt)
      .map((item) => ({
        id: item.id,
        instanceId: item.instanceId,
        neonUserId: item.neonUserId ?? "",
        role: item.role,
        grantedAt: item.grantedAt,
        revokedAt: item.revokedAt,
        userName: null,
        userEmail: null,
      }));
  }

  async countActiveGrants(instanceId: string) {
    return this.grants.filter((item) => item.instanceId === instanceId && !item.revokedAt).length;
  }

  async createGrant(instanceId: string, neonUserId: string, role: InstanceGrantRecord["role"]) {
    const grant: InstanceGrantRecord = {
      id: `grant-${Date.now()}`,
      instanceId,
      neonUserId,
      role,
      grantedAt: new Date().toISOString(),
      revokedAt: null,
    };
    this.grants.push(grant);
    return grant;
  }

  async revokeGrant(grantId: string) {
    const grant = this.grants.find((g) => g.id === grantId);
    if (grant) {
      grant.revokedAt = new Date().toISOString();
    }
  }
}

class MemoryAuditLogRepository implements AuditLogRepository {
  async append(record: AuditLogRecord) {
    void record;
  }
  async deleteOlderThan() {}
}

describe("facilitator-auth-service (file mode)", () => {
  beforeEach(() => {
    setInstanceGrantRepositoryForTests(
      new MemoryInstanceGrantRepository([
        {
          id: "grant-sample",
          instanceId: "sample-studio-a",
          neonUserId: "file-mode-sample",
          role: "owner",
          grantedAt: new Date().toISOString(),
          revokedAt: null,
        },
      ]),
    );
    setAuditLogRepositoryForTests(new MemoryAuditLogRepository());
  });

  afterEach(() => {
    setInstanceGrantRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
  });

  it("returns false for session-based auth in file mode", async () => {
    await expect(
      getFacilitatorAuthService().hasValidSession({
        instanceId: "sample-studio-a",
      }),
    ).resolves.toBe(false);
  });
});
