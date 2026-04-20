import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/teams/route";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import {
  participantSessionCookieName,
  redeemEventCode,
} from "@/lib/event-access";
import { setEventAccessRepositoryForTests, type EventAccessRepository } from "@/lib/event-access-repository";
import {
  hashSecret,
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "@/lib/participant-event-access-repository";
import { setTeamRepositoryForTests, type TeamRepository } from "@/lib/team-repository";
import { seedWorkshopState, type WorkshopState } from "@/lib/workshop-data";
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "@/lib/workshop-state-repository";
import type { AuditLogRecord, ParticipantEventAccessRecord, ParticipantSessionRecord } from "@/lib/runtime-contracts";

class MemoryWorkshopStateRepository implements WorkshopStateRepository {
  constructor(private states: Record<string, WorkshopState>) {}

  async getState(instanceId: string) {
    return structuredClone(this.states[instanceId] ?? this.states["sample-studio-a"]);
  }

  async saveState(instanceId: string, state: WorkshopState) {
    this.states[instanceId] = structuredClone(state);
  }
}

class MemoryTeamRepository implements TeamRepository {
  constructor(private itemsByInstance: Record<string, WorkshopState["teams"]> = {}) {}

  async listTeams(instanceId: string) {
    return structuredClone(this.itemsByInstance[instanceId] ?? []);
  }

  async upsertTeam(instanceId: string, team: WorkshopState["teams"][number]) {
    const current = this.itemsByInstance[instanceId] ?? [];
    this.itemsByInstance[instanceId] = [...current, structuredClone(team)];
  }

  async replaceTeams(instanceId: string, teams: WorkshopState["teams"]) {
    this.itemsByInstance[instanceId] = structuredClone(teams);
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
    this.sessions = this.sessions.some((item) => item.instanceId === instanceId && item.tokenHash === session.tokenHash)
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
      (item) =>
        item.instanceId !== instanceId ||
        (Date.parse(item.expiresAt) > nowMs && Date.parse(item.absoluteExpiresAt) > nowMs),
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

describe("teams route", () => {
  beforeEach(() => {
    setWorkshopStateRepositoryForTests(
      new MemoryWorkshopStateRepository({
        "sample-studio-a": structuredClone(seedWorkshopState),
        "sample-lab-c": {
          ...structuredClone(seedWorkshopState),
          workshopId: "sample-lab-c",
          teams: [
            {
              id: "t-wrong-instance",
              name: "Wrong instance team",
              city: "Lab C",
              members: ["Other"],
              repoUrl: "https://github.com/example/wrong-instance-team",
              projectBriefId: "standup-bot",
              checkIns: [],
              anchor: null,
            },
          ],
        },
      }),
    );
    setTeamRepositoryForTests(
      new MemoryTeamRepository({
        "sample-studio-a": [
          {
            id: "t-runtime",
            name: "Tým runtime",
            city: "Studio Runtime",
            members: ["Iva", "Milan"],
            repoUrl: "https://github.com/example/runtime-team",
            projectBriefId: "standup-bot",
            checkIns: [],
            anchor: null,
          },
        ],
        "sample-lab-c": [
          {
            id: "t-wrong-instance",
            name: "Wrong instance team",
            city: "Lab C",
            members: ["Other"],
            repoUrl: "https://github.com/example/wrong-instance-team",
            projectBriefId: "standup-bot",
            checkIns: [],
            anchor: null,
          },
        ],
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
    setTeamRepositoryForTests(null);
    setEventAccessRepositoryForTests(null);
    setParticipantEventAccessRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    vi.useRealTimers();
  });

  it("returns normalized team data for participant-authenticated reads", async () => {
    const redeemed = await redeemEventCode("lantern8-context4-handoff2");
    expect(redeemed.ok).toBe(true);
    if (!redeemed.ok) {
      return;
    }

    const response = await GET(
      new Request("http://localhost/api/teams", {
        headers: {
          cookie: `${participantSessionCookieName}=${encodeURIComponent(redeemed.session.token)}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      items: [{ id: "t-runtime", name: "Tým runtime" }],
    });
  });

  it("scopes the team read to the participant session instance instead of the default instance", async () => {
    const redeemed = await redeemEventCode("lantern8-context4-handoff2");
    expect(redeemed.ok).toBe(true);
    if (!redeemed.ok) {
      return;
    }

    const response = await GET(
      new Request("http://localhost/api/teams", {
        headers: {
          cookie: `${participantSessionCookieName}=${encodeURIComponent(redeemed.session.token)}`,
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: "t-runtime",
          name: "Tým runtime",
        }),
      ],
    });
  });

  it("rejects reads without a participant session", async () => {
    const response = await GET(new Request("http://localhost/api/teams"));

    expect(response.status).toBe(401);
  });
});
