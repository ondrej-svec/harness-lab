import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/checkpoints/route";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import { setCheckpointRepositoryForTests, type CheckpointRepository } from "@/lib/checkpoint-repository";
import {
  participantSessionCookieName,
  redeemEventCode,
} from "@/lib/event-access";
import {
  setEventAccessRepositoryForTests,
  type EventAccessRepository,
} from "@/lib/event-access-repository";
import {
  setFacilitatorAuthServiceForTests,
} from "@/lib/facilitator-auth-service";
import {
  hashSecret,
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "@/lib/participant-event-access-repository";
import type {
  AuditLogRecord,
  CheckpointRecord,
  FacilitatorAuthService,
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

class MemoryCheckpointRepository implements CheckpointRepository {
  constructor(private itemsByInstance: Record<string, CheckpointRecord[]> = {}) {}

  async listCheckpoints(instanceId: string) {
    return structuredClone(this.itemsByInstance[instanceId] ?? []);
  }

  async appendCheckpoint(instanceId: string, checkpoint: CheckpointRecord) {
    const current = this.itemsByInstance[instanceId] ?? [];
    this.itemsByInstance[instanceId] = [structuredClone(checkpoint), ...current].slice(0, 12);
  }

  async replaceCheckpoints(instanceId: string, checkpoints: CheckpointRecord[]) {
    this.itemsByInstance[instanceId] = structuredClone(checkpoints);
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

describe("checkpoints route", () => {
  let checkpointRepository: MemoryCheckpointRepository;
  let eventAccessRepository: MemoryEventAccessRepository;

  beforeEach(() => {
    checkpointRepository = new MemoryCheckpointRepository({
      "sample-studio-a": [
        {
          id: "u-checkpoint",
          teamId: "t1",
          text: "Checkpoint z dedikovaného repository.",
          at: "11:24",
        },
      ],
      "sample-lab-c": [
        {
          id: "u-wrong-instance",
          teamId: "t9",
          text: "Checkpoint from the wrong default instance.",
          at: "09:00",
        },
      ],
    });
    eventAccessRepository = new MemoryEventAccessRepository();

    setWorkshopStateRepositoryForTests(
      new MemoryWorkshopStateRepository({
        "sample-studio-a": structuredClone(seedWorkshopState),
        "sample-lab-c": {
          ...structuredClone(seedWorkshopState),
          workshopId: "sample-lab-c",
          sprintUpdates: [
            {
              id: "u-wrong-instance",
              teamId: "t9",
              text: "Checkpoint from the wrong default instance.",
              at: "09:00",
            },
          ],
        },
      }),
    );
    setCheckpointRepositoryForTests(checkpointRepository);
    setEventAccessRepositoryForTests(eventAccessRepository);
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
    setCheckpointRepositoryForTests(null);
    setEventAccessRepositoryForTests(null);
    setParticipantEventAccessRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
    vi.useRealTimers();
  });

  it("returns normalized checkpoint feed data for participant-authenticated reads", async () => {
    const redeemed = await redeemEventCode("lantern8-context4-handoff2");
    expect(redeemed.ok).toBe(true);
    if (!redeemed.ok) {
      return;
    }

    const response = await GET(
      new Request("http://localhost/api/checkpoints", {
        headers: {
          cookie: `${participantSessionCookieName}=${encodeURIComponent(redeemed.session.token)}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      items: [{ id: "u-checkpoint" }],
    });
  });

  it("scopes the checkpoint read to the participant session instance instead of the default instance", async () => {
    const redeemed = await redeemEventCode("lantern8-context4-handoff2");
    expect(redeemed.ok).toBe(true);
    if (!redeemed.ok) {
      return;
    }

    const response = await GET(
      new Request("http://localhost/api/checkpoints", {
        headers: {
          cookie: `${participantSessionCookieName}=${encodeURIComponent(redeemed.session.token)}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: "u-checkpoint",
        }),
      ],
      storageMode: expect.any(String),
    });
  });

  it("writes new checkpoint entries through the normalized repository path", async () => {
    const response = await POST(
      new Request("http://localhost/api/checkpoints", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          instanceId: "sample-lab-c",
          id: "u-new",
          teamId: "t3",
          text: "Nový checkpoint",
          at: "12:18",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(checkpointRepository.listCheckpoints("sample-lab-c")).resolves.toSatisfy((items) => items[0]?.id === "u-new");
  });

  it("rejects incomplete checkpoint writes", async () => {
    const response = await POST(
      new Request("http://localhost/api/checkpoints", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          instanceId: "sample-lab-c",
          id: "u-new",
          teamId: "t3",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "id, teamId, text and at are required",
    });
  });
});
