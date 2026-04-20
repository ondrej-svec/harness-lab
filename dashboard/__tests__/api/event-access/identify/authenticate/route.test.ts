/**
 * Phase 6 — already_bound surfacing in the authenticate endpoint.
 *
 * The full happy-path / wrong-credentials matrix lives in Layer 3
 * (Playwright against a real Neon Auth instance). This unit suite
 * focuses on the early already_bound rejection: a session bound to
 * one participant submitting credentials for a different one must
 * be refused before any signin attempt is made, and audited.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setEventAccessRepositoryForTests,
  type EventAccessRepository,
} from "@/lib/event-access-repository";
import {
  setParticipantRepositoryForTests,
  type ParticipantRepository,
} from "@/lib/participant-repository";
import {
  setAuditLogRepositoryForTests,
  type AuditLogRepository,
} from "@/lib/audit-log-repository";
import { hashSecret } from "@/lib/participant-event-access-repository";
import type {
  AuditLogRecord,
  ParticipantRecord,
  ParticipantSessionRecord,
} from "@/lib/runtime-contracts";

const authenticateMock = vi.fn();

vi.mock("@/lib/participant-auth", () => ({
  authenticateParticipant: authenticateMock,
}));

const SESSION_TOKEN = "auth-session-token";
const SESSION_TOKEN_HASH = hashSecret(SESSION_TOKEN);
const INSTANCE_ID = "instance-auth-tests";

function makeSession(overrides: Partial<ParticipantSessionRecord> = {}): ParticipantSessionRecord {
  const now = Date.now();
  return {
    instanceId: INSTANCE_ID,
    tokenHash: SESSION_TOKEN_HASH,
    createdAt: new Date(now - 60_000).toISOString(),
    lastValidatedAt: new Date(now - 1000).toISOString(),
    expiresAt: new Date(now + 60 * 60_000).toISOString(),
    absoluteExpiresAt: new Date(now + 12 * 60 * 60_000).toISOString(),
    participantId: null,
    ...overrides,
  };
}

class MemoryEventAccessRepository implements EventAccessRepository {
  constructor(private session: ParticipantSessionRecord | null) {}
  async listSessions() {
    return this.session ? [this.session] : [];
  }
  async findSession(_: string, tokenHash: string) {
    return this.session?.tokenHash === tokenHash ? this.session : null;
  }
  async findSessionByTokenHash(tokenHash: string) {
    return this.session?.tokenHash === tokenHash ? this.session : null;
  }
  async upsertSession(_: string, session: ParticipantSessionRecord) {
    this.session = session;
  }
  async deleteSession() {
    this.session = null;
  }
  async deleteExpiredSessions() {}
}

class MemoryParticipantRepository implements ParticipantRepository {
  participants: ParticipantRecord[] = [];
  async listParticipants() {
    return this.participants;
  }
  async findParticipant(instanceId: string, id: string) {
    return this.participants.find((p) => p.instanceId === instanceId && p.id === id) ?? null;
  }
  async findParticipantByDisplayName(instanceId: string, name: string) {
    return (
      this.participants.find(
        (p) => p.instanceId === instanceId && p.displayName.toLowerCase() === name.toLowerCase(),
      ) ?? null
    );
  }
  async listByDisplayNamePrefix() {
    return [];
  }
  async findByNeonUserId() {
    return null;
  }
  async linkNeonUser() {}
  async upsertParticipant() {}
  async archiveParticipant() {}
  async replaceParticipants() {}
}

class MemoryAuditLogRepository implements AuditLogRepository {
  records: AuditLogRecord[] = [];
  async append(record: AuditLogRecord) {
    this.records.push(record);
  }
  async deleteOlderThan() {}
}

function buildRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/event-access/identify/authenticate", {
    method: "POST",
    headers: {
      cookie: `harness_event_session=${SESSION_TOKEN}`,
      "content-type": "application/json",
      origin: "http://localhost",
      host: "localhost",
    },
    body: JSON.stringify(body),
  });
}

async function importRoute() {
  return import("@/app/api/event-access/identify/authenticate/route");
}

describe("POST /api/event-access/identify/authenticate (already_bound surfacing)", () => {
  let auditRepo: MemoryAuditLogRepository;
  let participantRepo: MemoryParticipantRepository;

  beforeEach(() => {
    authenticateMock.mockReset();
    auditRepo = new MemoryAuditLogRepository();
    participantRepo = new MemoryParticipantRepository();
    setParticipantRepositoryForTests(participantRepo);
    setAuditLogRepositoryForTests(auditRepo);
  });

  afterEach(() => {
    setEventAccessRepositoryForTests(null);
    setParticipantRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
  });

  it("returns 409 already_bound and SKIPS signin when session is bound to a different participant", async () => {
    setEventAccessRepositoryForTests(
      new MemoryEventAccessRepository(makeSession({ participantId: "p-bound" })),
    );

    const { POST } = await importRoute();
    const response = await POST(buildRequest({ participantId: "p-other", password: "pw" }));

    expect(response.status).toBe(409);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe("already_bound");

    // Critical: signin must not have been attempted.
    expect(authenticateMock).not.toHaveBeenCalled();

    const audit = auditRepo.records.find(
      (r) => r.action === "participant_password_auth" && r.metadata?.reason === "already_bound",
    );
    expect(audit).toBeDefined();
    expect(audit?.metadata?.boundParticipantId).toBe("p-bound");
    expect(audit?.metadata?.attemptedParticipantId).toBe("p-other");
  });

  it("returns 401 when there is no session", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(null));
    const { POST } = await importRoute();
    const response = await POST(buildRequest({ participantId: "p", password: "pw" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 missing_fields when body lacks participantId or password", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    const { POST } = await importRoute();
    const response = await POST(buildRequest({ password: "pw" }));
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe("missing_fields");
  });
});
