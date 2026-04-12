import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/participant/teams/[teamId]/check-in/route";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import { participantSessionCookieName, redeemEventCode } from "@/lib/event-access";
import { setEventAccessRepositoryForTests, type EventAccessRepository } from "@/lib/event-access-repository";
import {
  hashSecret,
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "@/lib/participant-event-access-repository";
import { setTeamRepositoryForTests, type TeamRepository } from "@/lib/team-repository";
import { seedWorkshopState, type WorkshopState } from "@/lib/workshop-data";
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "@/lib/workshop-state-repository";
import type { ParticipantEventAccessRecord, ParticipantSessionRecord } from "@/lib/runtime-contracts";

class MemoryWorkshopStateRepository implements WorkshopStateRepository {
  constructor(private state: WorkshopState) {}
  async getState() {
    return structuredClone(this.state);
  }
  async saveState(_instanceId: string, state: WorkshopState) {
    this.state = structuredClone(state);
  }
}

class MemoryTeamRepository implements TeamRepository {
  constructor(private items: WorkshopState["teams"] = []) {}
  async listTeams() {
    return structuredClone(this.items);
  }
  async upsertTeam(_instanceId: string, team: WorkshopState["teams"][number]) {
    this.items = this.items.some((item) => item.id === team.id)
      ? this.items.map((item) => (item.id === team.id ? structuredClone(team) : item))
      : [...this.items, structuredClone(team)];
  }
  async replaceTeams(_instanceId: string, teams: WorkshopState["teams"]) {
    this.items = structuredClone(teams);
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
    this.sessions = this.sessions.some(
      (item) => item.instanceId === instanceId && item.tokenHash === session.tokenHash,
    )
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
  async append() {}
  async deleteOlderThan() {}
}

describe("participant team check-in route", () => {
  let teamRepository: MemoryTeamRepository;

  beforeEach(() => {
    setWorkshopStateRepositoryForTests(new MemoryWorkshopStateRepository(structuredClone(seedWorkshopState)));
    teamRepository = new MemoryTeamRepository([
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
    ]);
    setTeamRepositoryForTests(teamRepository);
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

  async function buildAuthedRequest(teamId: string, body: unknown) {
    const redeemed = await redeemEventCode("lantern8-context4-handoff2");
    expect(redeemed.ok).toBe(true);
    if (!redeemed.ok) {
      throw new Error("redeem failed");
    }
    return {
      request: new Request(`http://localhost/api/participant/teams/${teamId}/check-in`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie: `${participantSessionCookieName}=${encodeURIComponent(redeemed.session.token)}`,
        },
        body: JSON.stringify(body),
      }),
    };
  }

  it("appends a check-in and returns the updated team", async () => {
    const { request } = await buildAuthedRequest("t-runtime", {
      phaseId: "intermezzo-1",
      content: "First intermezzo check-in.",
      writtenBy: "Iva",
    });
    const response = await PATCH(request, { params: Promise.resolve({ teamId: "t-runtime" }) });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { team: WorkshopState["teams"][number] };
    expect(payload.team.checkIns).toHaveLength(1);
    expect(payload.team.checkIns[0]).toMatchObject({
      phaseId: "intermezzo-1",
      content: "First intermezzo check-in.",
      writtenBy: "Iva",
    });
  });

  it("rejects unauthenticated requests with 401", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/participant/teams/t-runtime/check-in", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "hello" }),
      }),
      { params: Promise.resolve({ teamId: "t-runtime" }) },
    );
    expect(response.status).toBe(401);
  });

  it("rejects empty content with 400", async () => {
    const { request } = await buildAuthedRequest("t-runtime", { content: "   " });
    const response = await PATCH(request, { params: Promise.resolve({ teamId: "t-runtime" }) });
    expect(response.status).toBe(400);
  });

  it("returns 404 when the team does not exist in the instance", async () => {
    const { request } = await buildAuthedRequest("t-missing", { content: "hello", phaseId: "opening" });
    const response = await PATCH(request, { params: Promise.resolve({ teamId: "t-missing" }) });
    expect(response.status).toBe(404);
  });

  it("preserves existing check-ins across multiple appends", async () => {
    const first = await buildAuthedRequest("t-runtime", { phaseId: "opening", content: "first" });
    const r1 = await PATCH(first.request, { params: Promise.resolve({ teamId: "t-runtime" }) });
    expect(r1.status).toBe(200);

    const second = await buildAuthedRequest("t-runtime", { phaseId: "intermezzo-1", content: "second" });
    const r2 = await PATCH(second.request, { params: Promise.resolve({ teamId: "t-runtime" }) });
    expect(r2.status).toBe(200);
    const payload = (await r2.json()) as { team: WorkshopState["teams"][number] };
    expect(payload.team.checkIns).toHaveLength(2);
    expect(payload.team.checkIns.map((entry) => entry.content)).toEqual(["first", "second"]);
  });
});
