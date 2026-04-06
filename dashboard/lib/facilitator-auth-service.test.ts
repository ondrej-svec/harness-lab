import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "./audit-log-repository";
import {
  setFacilitatorIdentityRepositoryForTests,
  type FacilitatorIdentityRepository,
} from "./facilitator-identity-repository";
import { getFacilitatorAuthService } from "./facilitator-auth-service";
import { setInstanceGrantRepositoryForTests, type InstanceGrantRepository } from "./instance-grant-repository";
import { hashSecret } from "./participant-event-access-repository";
import type { AuditLogRecord, FacilitatorIdentityRecord, InstanceGrantRecord } from "./runtime-contracts";

function encodeBasicAuth(value: string) {
  return `Basic ${Buffer.from(value).toString("base64")}`;
}

class MemoryFacilitatorIdentityRepository implements FacilitatorIdentityRepository {
  constructor(private readonly identities: FacilitatorIdentityRecord[]) {}

  async findByUsername(username: string) {
    return this.identities.find((item) => item.username === username) ?? null;
  }

  async findBySubject(subject: string) {
    return this.identities.find((item) => item.authSubject === subject) ?? null;
  }
}

class MemoryInstanceGrantRepository implements InstanceGrantRepository {
  constructor(private readonly grants: InstanceGrantRecord[]) {}

  async getActiveGrant(instanceId: string, facilitatorIdentityId: string) {
    return (
      this.grants.find(
        (item) =>
          item.instanceId === instanceId &&
          item.facilitatorIdentityId === facilitatorIdentityId &&
          item.revokedAt === null,
      ) ?? null
    );
  }
}

class MemoryAuditLogRepository implements AuditLogRepository {
  async append(record: AuditLogRecord) {
    void record;
  }
}

describe("facilitator-auth-service", () => {
  const identity: FacilitatorIdentityRecord = {
    id: "facilitator-sample",
    username: "facilitator",
    displayName: "Sample Facilitator",
    email: "facilitator@example.com",
    passwordHash: hashSecret("secret"),
    authSubject: null,
    status: "active",
  };

  beforeEach(() => {
    setFacilitatorIdentityRepositoryForTests(new MemoryFacilitatorIdentityRepository([identity]));
    setInstanceGrantRepositoryForTests(
      new MemoryInstanceGrantRepository([
        {
          id: "grant-sample",
          instanceId: "sample-studio-a",
          facilitatorIdentityId: identity.id,
          role: "owner",
          revokedAt: null,
        },
      ]),
    );
    setAuditLogRepositoryForTests(new MemoryAuditLogRepository());
  });

  afterEach(() => {
    setFacilitatorIdentityRepositoryForTests(null);
    setInstanceGrantRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
  });

  it("delegates credential checks through the current facilitator auth service seam", async () => {
    await expect(
      getFacilitatorAuthService().hasValidRequestCredentials({
        authorizationHeader: encodeBasicAuth("facilitator:secret"),
        instanceId: "sample-studio-a",
      }),
    ).resolves.toBe(true);

    await expect(
      getFacilitatorAuthService().hasValidRequestCredentials({
        authorizationHeader: encodeBasicAuth("facilitator:wrong"),
        instanceId: "sample-studio-a",
      }),
    ).resolves.toBe(false);
  });

  it("rejects valid credentials without an active grant for the instance", async () => {
    await expect(
      getFacilitatorAuthService().hasValidRequestCredentials({
        authorizationHeader: encodeBasicAuth("facilitator:secret"),
        instanceId: "sample-lab-c",
      }),
    ).resolves.toBe(false);
  });

  it("rejects missing credentials instead of accepting forwarded state", async () => {
    await expect(
      getFacilitatorAuthService().hasValidRequestCredentials({
        authorizationHeader: null,
        instanceId: "sample-studio-a",
      }),
    ).resolves.toBe(false);
  });
});
