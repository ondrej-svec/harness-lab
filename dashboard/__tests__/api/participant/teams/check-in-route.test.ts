import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/participant/teams/[teamId]/check-in/route";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import { participantSessionCookieName, redeemEventCode } from "@/lib/event-access";
import { setEventAccessRepositoryForTests, type EventAccessRepository } from "@/lib/event-access-repository";
import { setParticipantRepositoryForTests, type ParticipantRepository } from "@/lib/participant-repository";
import {
  hashSecret,
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "@/lib/participant-event-access-repository";
import { setTeamMemberRepositoryForTests, type TeamMemberRepository } from "@/lib/team-member-repository";
import { setTeamRepositoryForTests, type TeamRepository } from "@/lib/team-repository";
import { seedWorkshopState, type WorkshopState } from "@/lib/workshop-data";
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "@/lib/workshop-state-repository";
import type {
  AssignResult,
  ParticipantEventAccessRecord,
  ParticipantRecord,
  ParticipantSessionRecord,
  TeamMemberRecord,
  UnassignResult,
} from "@/lib/runtime-contracts";

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

class MemoryParticipantRepository implements ParticipantRepository {
  constructor(private items: ParticipantRecord[] = []) {}

  async listParticipants(instanceId: string) {
    return structuredClone(this.items.filter((item) => item.instanceId === instanceId && item.archivedAt === null));
  }

  async findParticipant(instanceId: string, participantId: string) {
    return structuredClone(
      this.items.find((item) => item.instanceId === instanceId && item.id === participantId) ?? null,
    );
  }

  async findParticipantByDisplayName(instanceId: string, displayName: string) {
    return structuredClone(
      this.items.find(
        (item) =>
          item.instanceId === instanceId &&
          item.archivedAt === null &&
          item.displayName.toLocaleLowerCase() === displayName.trim().toLocaleLowerCase(),
      ) ?? null,
    );
  }

  async listByDisplayNamePrefix(instanceId: string, prefix: string, limit: number) {
    const normalized = prefix.trim().toLocaleLowerCase();
    if (normalized.length === 0) return [];
    return structuredClone(
      this.items
        .filter(
          (item) =>
            item.instanceId === instanceId &&
            item.archivedAt === null &&
            item.displayName.toLocaleLowerCase().includes(normalized),
        )
        .slice(0, Math.max(0, limit)),
    );
  }

  async findByNeonUserId(instanceId: string, neonUserId: string) {
    return structuredClone(
      this.items.find(
        (item) =>
          item.instanceId === instanceId &&
          item.archivedAt === null &&
          item.neonUserId === neonUserId,
      ) ?? null,
    );
  }

  async linkNeonUser(instanceId: string, participantId: string, neonUserId: string, updatedAt: string) {
    this.items = this.items.map((item) =>
      item.instanceId === instanceId && item.id === participantId
        ? { ...item, neonUserId, updatedAt }
        : item,
    );
  }

  async upsertParticipant(instanceId: string, participant: ParticipantRecord) {
    this.items = this.items.some((item) => item.instanceId === instanceId && item.id === participant.id)
      ? this.items.map((item) =>
          item.instanceId === instanceId && item.id === participant.id ? structuredClone(participant) : item,
        )
      : [...this.items, structuredClone({ ...participant, instanceId })];
  }

  async archiveParticipant(instanceId: string, participantId: string, archivedAt: string) {
    this.items = this.items.map((item) =>
      item.instanceId === instanceId && item.id === participantId
        ? { ...item, archivedAt, updatedAt: archivedAt }
        : item,
    );
  }

  async replaceParticipants(instanceId: string, participants: ParticipantRecord[]) {
    this.items = [
      ...this.items.filter((item) => item.instanceId !== instanceId),
      ...structuredClone(participants.map((participant) => ({ ...participant, instanceId }))),
    ];
  }
}

class MemoryTeamMemberRepository implements TeamMemberRepository {
  constructor(private items: TeamMemberRecord[] = []) {}

  async listMembers(instanceId: string) {
    return structuredClone(this.items.filter((item) => item.instanceId === instanceId));
  }

  async listMembersByTeam(instanceId: string, teamId: string) {
    return structuredClone(
      this.items.filter((item) => item.instanceId === instanceId && item.teamId === teamId),
    );
  }

  async findMemberByParticipant(instanceId: string, participantId: string) {
    return structuredClone(
      this.items.find((item) => item.instanceId === instanceId && item.participantId === participantId) ?? null,
    );
  }

  async assignMember(instanceId: string, assignment: TeamMemberRecord): Promise<AssignResult> {
    const existing = this.items.find(
      (item) => item.instanceId === instanceId && item.participantId === assignment.participantId,
    );
    this.items = this.items.filter(
      (item) => !(item.instanceId === instanceId && item.participantId === assignment.participantId),
    );
    this.items.push(structuredClone({ ...assignment, instanceId }));
    return {
      teamId: assignment.teamId,
      movedFrom: existing?.teamId ?? null,
      changed: !existing || existing.teamId !== assignment.teamId,
    };
  }

  async unassignMember(instanceId: string, participantId: string): Promise<UnassignResult> {
    const existing = this.items.find(
      (item) => item.instanceId === instanceId && item.participantId === participantId,
    ) ?? null;
    this.items = this.items.filter(
      (item) => !(item.instanceId === instanceId && item.participantId === participantId),
    );
    return existing ? { teamId: existing.teamId } : null;
  }

  async replaceMembers(instanceId: string, members: TeamMemberRecord[]) {
    this.items = [
      ...this.items.filter((item) => item.instanceId !== instanceId),
      ...structuredClone(members.map((member) => ({ ...member, instanceId }))),
    ];
  }
}

describe("participant team check-in route", () => {
  let teamRepository: MemoryTeamRepository;
  let participantRepository: MemoryParticipantRepository;
  let teamMemberRepository: MemoryTeamMemberRepository;

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
    participantRepository = new MemoryParticipantRepository();
    teamMemberRepository = new MemoryTeamMemberRepository();
    setParticipantRepositoryForTests(participantRepository);
    setTeamMemberRepositoryForTests(teamMemberRepository);
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
    setParticipantRepositoryForTests(null);
    setTeamMemberRepositoryForTests(null);
    setEventAccessRepositoryForTests(null);
    setParticipantEventAccessRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    vi.useRealTimers();
  });

  async function buildAuthedRequest(teamId: string, body: unknown, options?: { membershipTeamId?: string | null }) {
    const redeemed = await redeemEventCode("lantern8-context4-handoff2", "Iva");
    expect(redeemed.ok).toBe(true);
    if (!redeemed.ok) {
      throw new Error("redeem failed");
    }
    if (options?.membershipTeamId && redeemed.session.participantId) {
      await teamMemberRepository.assignMember("sample-studio-a", {
        id: `tm-${redeemed.session.participantId}`,
        instanceId: "sample-studio-a",
        teamId: options.membershipTeamId,
        participantId: redeemed.session.participantId,
        assignedAt: "2026-04-06T12:00:00.000Z",
      });
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
      changed: "We rewrote the room entrypoint.",
      verified: "The team replayed the setup path from scratch.",
      nextStep: "Write the first repo map before lunch.",
    }, { membershipTeamId: "t-runtime" });
    const response = await PATCH(request, { params: Promise.resolve({ teamId: "t-runtime" }) });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { team: WorkshopState["teams"][number] };
    expect(payload.team.checkIns).toHaveLength(1);
    expect(payload.team.checkIns[0]).toMatchObject({
      phaseId: "intermezzo-1",
      changed: "We rewrote the room entrypoint.",
      verified: "The team replayed the setup path from scratch.",
      nextStep: "Write the first repo map before lunch.",
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
    const { request } = await buildAuthedRequest("t-runtime", { changed: "   " }, { membershipTeamId: "t-runtime" });
    const response = await PATCH(request, { params: Promise.resolve({ teamId: "t-runtime" }) });
    expect(response.status).toBe(400);
  });

  it("returns 404 when the team does not exist in the instance", async () => {
    const { request } = await buildAuthedRequest("t-missing", {
      phaseId: "opening",
      changed: "hello",
      verified: "world",
      nextStep: "next",
    }, { membershipTeamId: "t-missing" });
    const response = await PATCH(request, { params: Promise.resolve({ teamId: "t-missing" }) });
    expect(response.status).toBe(404);
  });

  it("preserves existing check-ins across multiple appends", async () => {
    const first = await buildAuthedRequest("t-runtime", {
      phaseId: "opening",
      changed: "first change",
      verified: "first proof",
      nextStep: "first next",
    }, { membershipTeamId: "t-runtime" });
    const r1 = await PATCH(first.request, { params: Promise.resolve({ teamId: "t-runtime" }) });
    expect(r1.status).toBe(200);

    const second = await buildAuthedRequest("t-runtime", {
      phaseId: "intermezzo-1",
      changed: "second change",
      verified: "second proof",
      nextStep: "second next",
    }, { membershipTeamId: "t-runtime" });
    const r2 = await PATCH(second.request, { params: Promise.resolve({ teamId: "t-runtime" }) });
    expect(r2.status).toBe(200);
    const payload = (await r2.json()) as { team: WorkshopState["teams"][number] };
    expect(payload.team.checkIns).toHaveLength(2);
    expect(payload.team.checkIns.map((entry) => entry.changed)).toEqual(["first change", "second change"]);
  });

  it("rejects cross-team writes with 403", async () => {
    const { request } = await buildAuthedRequest("t-runtime", {
      phaseId: "opening",
      changed: "cross-team",
      verified: "proof",
      nextStep: "next",
    }, { membershipTeamId: "t-other" });

    const response = await PATCH(request, { params: Promise.resolve({ teamId: "t-runtime" }) });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "team_forbidden" });
  });

  it("rejects writes when the participant is not assigned to any team", async () => {
    const { request } = await buildAuthedRequest("t-runtime", {
      phaseId: "opening",
      changed: "no team",
      verified: "proof",
      nextStep: "next",
    });

    const response = await PATCH(request, { params: Promise.resolve({ teamId: "t-runtime" }) });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "team_membership_required" });
  });
});
