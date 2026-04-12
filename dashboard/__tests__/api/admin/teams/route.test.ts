import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH, POST } from "@/app/api/admin/teams/route";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import { setFacilitatorAuthServiceForTests, type FacilitatorAuthService } from "@/lib/facilitator-auth-service";
import { setTeamRepositoryForTests, type TeamRepository } from "@/lib/team-repository";
import { seedWorkshopState, type WorkshopState } from "@/lib/workshop-data";
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "@/lib/workshop-state-repository";
import type { AuditLogRecord } from "@/lib/runtime-contracts";

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

class MemoryTeamRepository implements TeamRepository {
  constructor(private items: WorkshopState["teams"] = []) {}

  async listTeams(instanceId: string) {
    void instanceId;
    return structuredClone(this.items);
  }

  async upsertTeam(instanceId: string, team: WorkshopState["teams"][number]) {
    void instanceId;
    this.items = this.items.some((item) => item.id === team.id)
      ? this.items.map((item) => (item.id === team.id ? structuredClone(team) : item))
      : [...this.items, structuredClone(team)];
  }

  async replaceTeams(instanceId: string, teams: WorkshopState["teams"]) {
    void instanceId;
    this.items = structuredClone(teams);
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

describe("admin teams route", () => {
  let teamRepository: MemoryTeamRepository;

  beforeEach(() => {
    teamRepository = new MemoryTeamRepository([
      {
        id: "t1",
        name: "Tým 1",
        city: "Studio A",
        members: ["Anna"],
        repoUrl: "https://github.com/example/standup-bot",
        projectBriefId: "standup-bot",
        checkIns: [],
        anchor: null,
      },
    ]);

    setWorkshopStateRepositoryForTests(new MemoryWorkshopStateRepository(structuredClone(seedWorkshopState)));
    setTeamRepositoryForTests(teamRepository);
    setAuditLogRepositoryForTests(new MemoryAuditLogRepository());
    setFacilitatorAuthServiceForTests(new AllowFacilitatorAuthService());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-06T12:00:00.000Z"));
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
    setTeamRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    setFacilitatorAuthServiceForTests(null);
    vi.useRealTimers();
  });

  it("writes team registration through the dedicated team repository", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/teams", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          id: "t9",
          name: "Tým 9",
          city: "Studio E",
          members: ["Iva", "Milan"],
          repoUrl: "https://github.com/example/new-team",
          projectBriefId: "standup-bot",
          checkIns: [],
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(teamRepository.listTeams("sample-studio-a")).resolves.toMatchObject([
      { id: "t1" },
      { id: "t9", name: "Tým 9" },
    ]);
  });

  it("rejects incomplete team registrations", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/teams", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          id: "t9",
          name: "Tým 9",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "id, name, repoUrl and projectBriefId are required",
    });
  });

  it("appends a team check-in through the dedicated team repository", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/teams", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          teamId: "t1",
          phaseId: "opening",
          content: "Checkpoint po facilitaci",
          writtenBy: null,
        }),
      }),
    );

    expect(response.status).toBe(200);
    const teams = await teamRepository.listTeams("sample-studio-a");
    expect(teams).toMatchObject([
      {
        id: "t1",
        checkIns: [
          { phaseId: "opening", content: "Checkpoint po facilitaci", writtenBy: null },
        ],
      },
    ]);
  });

  it("rejects incomplete check-in appends", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/teams", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          teamId: "t1",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "teamId, phaseId and content are required",
    });
  });
});
