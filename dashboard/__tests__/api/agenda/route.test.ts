import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH } from "@/app/api/agenda/route";
import {
  participantSessionCookieName,
  redeemEventCode,
} from "@/lib/event-access";
import {
  setEventAccessRepositoryForTests,
  type EventAccessRepository,
} from "@/lib/event-access-repository";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import { setFacilitatorAuthServiceForTests, type FacilitatorAuthService } from "@/lib/facilitator-auth-service";
import {
  hashSecret,
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "@/lib/participant-event-access-repository";
import type {
  AuditLogRecord,
  ParticipantEventAccessRecord,
  ParticipantSessionRecord,
} from "@/lib/runtime-contracts";
import { seedWorkshopState, type WorkshopState } from "@/lib/workshop-data";
import {
  WorkshopStateConflictError,
  setWorkshopStateRepositoryForTests,
  type WorkshopStateRepository,
} from "@/lib/workshop-state-repository";

class MemoryWorkshopStateRepository implements WorkshopStateRepository {
  constructor(private state: WorkshopState) {}

  async getState(instanceId: string) {
    void instanceId;
    return structuredClone(this.state);
  }

  async saveState(_instanceId: string, state: WorkshopState) {
    this.state = structuredClone(state);
  }
}

class ConflictWorkshopStateRepository extends MemoryWorkshopStateRepository {
  override async saveState(instanceId: string, state: WorkshopState) {
    void instanceId;
    void state;
    throw new WorkshopStateConflictError("sample-studio-a");
  }
}

class MemoryEventAccessRepository implements EventAccessRepository {
  constructor(private sessions: ParticipantSessionRecord[] = []) {}

  async listSessions(instanceId: string) {
    return structuredClone(this.sessions.filter((session) => session.instanceId === instanceId));
  }

  async findSession(instanceId: string, tokenHash: string) {
    return structuredClone(
      this.sessions.find((session) => session.instanceId === instanceId && session.tokenHash === tokenHash) ?? null,
    );
  }

  async findSessionByTokenHash(tokenHash: string) {
    return structuredClone(this.sessions.find((session) => session.tokenHash === tokenHash) ?? null);
  }

  async upsertSession(instanceId: string, session: ParticipantSessionRecord) {
    this.sessions = this.sessions.some((item) => item.tokenHash === session.tokenHash)
      ? this.sessions.map((item) =>
          item.instanceId === instanceId && item.tokenHash === session.tokenHash ? structuredClone(session) : item,
        )
      : [...this.sessions, structuredClone({ ...session, instanceId })];
  }

  async deleteSession(instanceId: string, tokenHash: string) {
    this.sessions = this.sessions.filter((item) => !(item.instanceId === instanceId && item.tokenHash === tokenHash));
  }

  async deleteExpiredSessions(instanceId: string, now: string) {
    const nowMs = Date.parse(now);
    this.sessions = this.sessions.filter(
      (session) =>
        session.instanceId !== instanceId ||
        (Date.parse(session.expiresAt) > nowMs && Date.parse(session.absoluteExpiresAt) > nowMs),
    );
  }
}

class MemoryParticipantEventAccessRepository implements ParticipantEventAccessRepository {
  constructor(private access: ParticipantEventAccessRecord | null) {}

  async getActiveAccess() {
    return this.access ? structuredClone(this.access) : null;
  }

  async saveAccess(_instanceId: string, access: ParticipantEventAccessRecord) {
    this.access = structuredClone(access);
  }

  async listAllActiveAccess() {
    return this.access ? [structuredClone(this.access)] : [];
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

describe("agenda route", () => {
  beforeEach(() => {
    setWorkshopStateRepositoryForTests(new MemoryWorkshopStateRepository(structuredClone(seedWorkshopState)));
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository());
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-06T12:00:00.000Z"));
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
    setEventAccessRepositoryForTests(null);
    setParticipantEventAccessRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
    vi.useRealTimers();
  });

  async function participantCookieHeader() {
    const redeemed = await redeemEventCode("lantern8-context4-handoff2");
    expect(redeemed.ok).toBe(true);
    if (!redeemed.ok) throw new Error("redeem failed");
    return `${participantSessionCookieName}=${encodeURIComponent(redeemed.session.token)}`;
  }

  it("returns 401 without a participant session", async () => {
    const response = await GET(new Request("http://localhost/api/agenda"));
    expect(response.status).toBe(401);
  });

  it("returns the current phase and agenda items for an authenticated participant", async () => {
    const cookie = await participantCookieHeader();
    const response = await GET(new Request("http://localhost/api/agenda", { headers: { cookie } }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      phase: { id: "build-1", title: "Build fáze 1" },
      items: expect.arrayContaining([expect.objectContaining({ id: "rotation" })]),
    });
  });

  it("updates the current phase through the shared runtime store", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/agenda", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({ currentId: "rotation", instanceId: "sample-studio-a" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      phase: "Rotace týmů",
      items: expect.arrayContaining([expect.objectContaining({ id: "rotation", status: "current" })]),
    });
  });

  it("rejects PATCH without instanceId", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/agenda", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({ currentId: "rotation" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns a retryable conflict response when agenda updates lose the optimistic lock", async () => {
    setWorkshopStateRepositoryForTests(new ConflictWorkshopStateRepository(structuredClone(seedWorkshopState)));

    const response = await PATCH(
      new Request("http://localhost/api/agenda", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({ currentId: "rotation", instanceId: "sample-studio-a" }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "workshop_state_conflict",
    });
  });
});
