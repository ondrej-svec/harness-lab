import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/workshop/instances/[id]/participant-access/route";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import { setFacilitatorAuthServiceForTests, type FacilitatorAuthService } from "@/lib/facilitator-auth-service";
import {
  hashSecret,
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "@/lib/participant-event-access-repository";
import type { AuditLogRecord, ParticipantEventAccessRecord } from "@/lib/runtime-contracts";

class MemoryParticipantEventAccessRepository implements ParticipantEventAccessRepository {
  constructor(private access: ParticipantEventAccessRecord | null) {}

  async getActiveAccess() {
    return this.access ? structuredClone(this.access) : null;
  }

  async saveAccess(_instanceId: string, access: ParticipantEventAccessRecord) {
    this.access = structuredClone(access);
  }
}

class MemoryAuditLogRepository implements AuditLogRepository {
  async append(record: AuditLogRecord) {
    void record;
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    void instanceId;
    void olderThan;
  }
}

class AllowFacilitatorAuthService implements FacilitatorAuthService {
  async hasValidRequestCredentials() {
    return true;
  }

  async hasValidSession() {
    return false;
  }
}

describe("workshop instance participant access route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-09T10:00:00.000Z"));
    setParticipantEventAccessRepositoryForTests(
      new MemoryParticipantEventAccessRepository({
        id: "pea-sample-studio-a",
        instanceId: "sample-studio-a",
        version: 1,
        codeHash: hashSecret("lantern8-context4-handoff2"),
        expiresAt: "2026-04-20T12:00:00.000Z",
        revokedAt: null,
        sampleCode: "lantern8-context4-handoff2",
      }),
    );
    setAuditLogRepositoryForTests(new MemoryAuditLogRepository());
    setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());
  });

  afterEach(() => {
    setParticipantEventAccessRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
    vi.useRealTimers();
  });

  it("returns facilitator-visible participant access metadata", async () => {
    const response = await GET(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/participant-access"),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      participantAccess: {
        active: true,
        codeId: hashSecret("lantern8-context4-handoff2").slice(0, 12),
        currentCode: "lantern8-context4-handoff2",
        source: "sample",
      },
    });
  });

  it("issues a new participant code and only reveals it in the issuance response", async () => {
    const response = await POST(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/participant-access", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({ action: "rotate", code: "orbit7-bridge4-shift2" }),
      }),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      issuedCode: "orbit7-bridge4-shift2",
      participantAccess: {
        active: true,
        currentCode: null,
        source: "issued",
      },
    });

    const followUp = await GET(
      new Request("http://localhost/api/workshop/instances/sample-studio-a/participant-access"),
      { params: Promise.resolve({ id: "sample-studio-a" }) },
    );
    await expect(followUp.json()).resolves.toMatchObject({
      participantAccess: {
        active: true,
        currentCode: null,
        source: "issued",
      },
    });
  });
});
