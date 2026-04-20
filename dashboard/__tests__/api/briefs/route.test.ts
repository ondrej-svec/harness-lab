import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/briefs/route";
import {
  participantSessionCookieName,
  redeemEventCode,
} from "@/lib/event-access";
import {
  setEventAccessRepositoryForTests,
  type EventAccessRepository,
} from "@/lib/event-access-repository";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
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
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "@/lib/workshop-state-repository";

class MemoryWorkshopStateRepository implements WorkshopStateRepository {
  constructor(private states: Record<string, WorkshopState>) {}

  async getState(instanceId: string) {
    return structuredClone(this.states[instanceId] ?? this.states["sample-studio-a"]);
  }

  async saveState(instanceId: string, state: WorkshopState) {
    this.states[instanceId] = structuredClone(state);
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

describe("briefs route", () => {
  beforeEach(() => {
    setWorkshopStateRepositoryForTests(
      new MemoryWorkshopStateRepository({
        "sample-studio-a": structuredClone(seedWorkshopState),
      }),
    );
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-06T12:00:00.000Z"));
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
    setEventAccessRepositoryForTests(null);
    setParticipantEventAccessRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    vi.useRealTimers();
  });

  it("returns 401 without a participant session cookie", async () => {
    const response = await GET(new Request("http://localhost/api/briefs"));

    expect(response.status).toBe(401);
  });

  it("returns workshop briefs scoped to the participant session instance", async () => {
    const redeemed = await redeemEventCode("lantern8-context4-handoff2");
    expect(redeemed.ok).toBe(true);
    if (!redeemed.ok) {
      return;
    }

    const response = await GET(
      new Request("http://localhost/api/briefs", {
        headers: {
          cookie: `${participantSessionCookieName}=${encodeURIComponent(redeemed.session.token)}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: seedWorkshopState.briefs,
    });
  });
});
