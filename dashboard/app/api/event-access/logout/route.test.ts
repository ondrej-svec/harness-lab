import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import { participantSessionCookieName, redeemEventCode } from "@/lib/event-access";
import { getEventAccessRepository, setEventAccessRepositoryForTests, type EventAccessRepository } from "@/lib/event-access-repository";
import {
  hashSecret,
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "@/lib/participant-event-access-repository";
import type { AuditLogRecord, ParticipantEventAccessRecord, ParticipantSessionRecord } from "@/lib/runtime-contracts";

class MemoryEventAccessRepository implements EventAccessRepository {
  constructor(private sessions: ParticipantSessionRecord[] = []) {}

  async getSessions(instanceId: string) {
    void instanceId;
    return structuredClone(this.sessions);
  }

  async saveSessions(_instanceId: string, sessions: ParticipantSessionRecord[]) {
    this.sessions = structuredClone(sessions);
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
}

class MemoryAuditLogRepository implements AuditLogRepository {
  async append(record: AuditLogRecord) {
    void record;
  }
}

describe("POST /api/event-access/logout", () => {
  beforeEach(() => {
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
    setEventAccessRepositoryForTests(null);
    setParticipantEventAccessRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    vi.useRealTimers();
  });

  it("revokes the session and expires the cookie", async () => {
    const result = await redeemEventCode("lantern8-context4-handoff2");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const response = await POST(
      new Request("http://localhost/api/event-access/logout", {
        method: "POST",
        headers: {
          cookie: `${participantSessionCookieName}=${encodeURIComponent(result.session.token)}`,
        },
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/");
    expect(response.headers.get("set-cookie")).toContain(`${participantSessionCookieName}=`);
    await expect(getEventAccessRepository().getSessions(result.session.instanceId)).resolves.toEqual([]);
  });
});
