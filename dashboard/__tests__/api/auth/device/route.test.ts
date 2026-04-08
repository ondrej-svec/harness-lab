import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setFacilitatorCliAuthDepsForTests,
  setFacilitatorCliAuthRepositoryForTests,
} from "@/lib/facilitator-cli-auth-repository";
import { setInstanceGrantRepositoryForTests } from "@/lib/instance-grant-repository";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import type {
  AuditLogRecord,
  FacilitatorCliAuthRepository,
  FacilitatorCliSessionRecord,
  FacilitatorDeviceAuthRecord,
  FacilitatorGrantInfo,
  InstanceGrantRecord,
  InstanceGrantRepository,
} from "@/lib/runtime-contracts";

const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  auth: {
    getSession: getSessionMock,
  },
}));

const { POST: startDeviceAuth } = await import("@/app/api/auth/device/start/route");
const { POST: pollDeviceAuth } = await import("@/app/api/auth/device/poll/route");
const { POST: approveDeviceAuth } = await import("@/app/api/auth/device/approve/route");
const { POST: denyDeviceAuth } = await import("@/app/api/auth/device/deny/route");
const { GET: getDeviceSession } = await import("@/app/api/auth/device/session/route");
const { POST: logoutDeviceSession } = await import("@/app/api/auth/device/logout/route");

class MemoryFacilitatorCliAuthRepository implements FacilitatorCliAuthRepository {
  deviceAuthorizations: FacilitatorDeviceAuthRecord[] = [];
  cliSessions: FacilitatorCliSessionRecord[] = [];

  async createDeviceAuthorization(record: FacilitatorDeviceAuthRecord) {
    this.deviceAuthorizations.push(structuredClone(record));
  }

  async getDeviceAuthorizationByDeviceCodeHash(deviceCodeHash: string) {
    return this.deviceAuthorizations.find((item) => item.deviceCodeHash === deviceCodeHash) ?? null;
  }

  async getDeviceAuthorizationByUserCodeHash(userCodeHash: string) {
    return this.deviceAuthorizations.find((item) => item.userCodeHash === userCodeHash) ?? null;
  }

  async updateDeviceAuthorization(record: FacilitatorDeviceAuthRecord) {
    this.deviceAuthorizations = this.deviceAuthorizations.map((item) => (item.id === record.id ? structuredClone(record) : item));
  }

  async createCliSession(record: FacilitatorCliSessionRecord) {
    this.cliSessions.push(structuredClone(record));
  }

  async getCliSessionByTokenHash(tokenHash: string) {
    return this.cliSessions.find((item) => item.tokenHash === tokenHash) ?? null;
  }

  async updateCliSession(record: FacilitatorCliSessionRecord) {
    this.cliSessions = this.cliSessions.map((item) => (item.tokenHash === record.tokenHash ? structuredClone(record) : item));
  }
}

class MemoryInstanceGrantRepository implements InstanceGrantRepository {
  constructor(private grants: InstanceGrantRecord[] = []) {}

  async getActiveGrantByNeonUserId(instanceId: string, neonUserId: string) {
    return this.grants.find((item) => item.instanceId === instanceId && item.neonUserId === neonUserId && !item.revokedAt) ?? null;
  }

  async listActiveGrants(instanceId: string): Promise<FacilitatorGrantInfo[]> {
    return this.grants
      .filter((item) => item.instanceId === instanceId && !item.revokedAt)
      .map((item) => ({
        ...item,
        userName: null,
        userEmail: null,
      }));
  }

  async countActiveGrants(instanceId: string) {
    return this.grants.filter((item) => item.instanceId === instanceId && !item.revokedAt).length;
  }

  async createGrant(instanceId: string, neonUserId: string, role: InstanceGrantRecord["role"]) {
    const grant = {
      id: `grant-${this.grants.length + 1}`,
      instanceId,
      neonUserId,
      role,
      grantedAt: new Date().toISOString(),
      revokedAt: null,
    } satisfies InstanceGrantRecord;
    this.grants.push(grant);
    return grant;
  }

  async revokeGrant(grantId: string) {
    const grant = this.grants.find((item) => item.id === grantId);
    if (grant) {
      grant.revokedAt = new Date().toISOString();
    }
  }
}

class MemoryAuditLogRepository implements AuditLogRepository {
  entries: AuditLogRecord[] = [];

  async append(record: AuditLogRecord) {
    this.entries.push(record);
  }

  async deleteOlderThan() {}
}

describe("device auth routes", () => {
  let repo: MemoryFacilitatorCliAuthRepository;
  let auditLog: MemoryAuditLogRepository;

  beforeEach(() => {
    repo = new MemoryFacilitatorCliAuthRepository();
    auditLog = new MemoryAuditLogRepository();
    setFacilitatorCliAuthRepositoryForTests(repo);
    setAuditLogRepositoryForTests(auditLog);
    setInstanceGrantRepositoryForTests(new MemoryInstanceGrantRepository());
    setFacilitatorCliAuthDepsForTests({
      now: () => new Date("2026-04-07T10:00:00.000Z"),
      randomUuid: () => "fixed-uuid",
      randomBytes: (size) => Buffer.alloc(size, 1),
    });
    getSessionMock.mockResolvedValue({ data: { user: { id: "neon-user-1" } } });
  });

  afterEach(() => {
    setFacilitatorCliAuthRepositoryForTests(null);
    setFacilitatorCliAuthDepsForTests(null);
    setAuditLogRepositoryForTests(null);
    setInstanceGrantRepositoryForTests(null);
    getSessionMock.mockReset();
  });

  it("completes device auth approval, polling, session status, and logout", async () => {
    const startResponse = await startDeviceAuth(new Request("http://localhost/api/auth/device/start", { method: "POST" }));
    expect(startResponse.status).toBe(200);
    const started = await startResponse.json();
    expect(started.userCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(started.verificationUri).toBe("http://localhost/admin/device");
    expect(started.verificationUriComplete).toBe(`http://localhost/admin/device?user_code=${encodeURIComponent(started.userCode)}`);

    const pendingResponse = await pollDeviceAuth(
      new Request("http://localhost/api/auth/device/poll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceCode: started.deviceCode }),
      }),
    );
    await expect(pendingResponse.json()).resolves.toMatchObject({ status: "authorization_pending" });

    const approveResponse = await approveDeviceAuth(
      new Request("http://localhost/api/auth/device/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userCode: started.userCode }),
      }),
    );
    await expect(approveResponse.json()).resolves.toMatchObject({ ok: true });

    const authorizedResponse = await pollDeviceAuth(
      new Request("http://localhost/api/auth/device/poll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceCode: started.deviceCode }),
      }),
    );
    const authorized = await authorizedResponse.json();
    expect(authorized.status).toBe("authorized");
    expect(authorized.session).toMatchObject({ neonUserId: "neon-user-1", authMode: "device" });
    expect(authorized.session).not.toHaveProperty("role");

    const sessionResponse = await getDeviceSession(
      new Request("http://localhost/api/auth/device/session", {
        headers: { authorization: `Bearer ${authorized.accessToken}` },
      }),
    );
    await expect(sessionResponse.json()).resolves.toMatchObject({
      ok: true,
      session: { neonUserId: "neon-user-1", authMode: "device" },
    });

    const logoutResponse = await logoutDeviceSession(
      new Request("http://localhost/api/auth/device/logout", {
        method: "POST",
        headers: { authorization: `Bearer ${authorized.accessToken}` },
      }),
    );
    await expect(logoutResponse.json()).resolves.toMatchObject({ ok: true });
  });

  it("surfaces denied device authorization", async () => {
    const started = await (await startDeviceAuth(new Request("http://localhost/api/auth/device/start", { method: "POST" }))).json();

    const denyResponse = await denyDeviceAuth(
      new Request("http://localhost/api/auth/device/deny", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userCode: started.userCode }),
      }),
    );
    await expect(denyResponse.json()).resolves.toMatchObject({ ok: true });

    const pollResponse = await pollDeviceAuth(
      new Request("http://localhost/api/auth/device/poll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceCode: started.deviceCode }),
      }),
    );
    await expect(pollResponse.json()).resolves.toMatchObject({ status: "access_denied" });
  });
});
