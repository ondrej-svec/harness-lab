/**
 * Unit tests for POST /api/event-access/identify/set-password.
 *
 * Focus on the walk-in policy gate (Phase 5.6 Layer 1):
 *   - allow_walk_ins = false → 403 walk_in_refused, audit row appended
 *   - allow_walk_ins = true + valid displayName → proceeds to account
 *     creation, audit row for walk_in_created appended
 *   - allow_walk_ins = true + missing displayName → 400 invalid_display_name
 *   - participantId path with non-existent participant → 404 not_found
 *   - participantId path when participant already has neonUserId → 409 already_set
 *   - missing/invalid email → 400 invalid_email
 *   - short password → 400 weak_password
 *
 * createParticipantAccount is mocked at module level so the test
 * doesn't need real Neon Auth.
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
import {
  setWorkshopInstanceRepositoryForTests,
  type WorkshopInstanceRepository,
} from "@/lib/workshop-instance-repository";
import { hashSecret } from "@/lib/participant-event-access-repository";
import type {
  AuditLogRecord,
  ParticipantRecord,
  ParticipantSessionRecord,
  WorkshopInstanceRecord,
} from "@/lib/runtime-contracts";

vi.mock("@/lib/participant-auth", () => ({
  createParticipantAccount: vi.fn(async () => ({ ok: true, neonUserId: "neon-stub" })),
}));

const SESSION_TOKEN = "set-password-session-token";
const SESSION_TOKEN_HASH = hashSecret(SESSION_TOKEN);
const INSTANCE_ID = "instance-set-password-tests";

function makeSession(): ParticipantSessionRecord {
  const now = Date.now();
  return {
    instanceId: INSTANCE_ID,
    tokenHash: SESSION_TOKEN_HASH,
    createdAt: new Date(now - 60_000).toISOString(),
    lastValidatedAt: new Date(now - 1000).toISOString(),
    expiresAt: new Date(now + 60 * 60_000).toISOString(),
    absoluteExpiresAt: new Date(now + 12 * 60 * 60_000).toISOString(),
    participantId: null,
  };
}

function makeInstance(overrides: Partial<WorkshopInstanceRecord> = {}): WorkshopInstanceRecord {
  return {
    id: INSTANCE_ID,
    templateId: "test-template",
    workshopMeta: {
      title: "Test",
      facilitatorLabel: "test",
      city: "Prague",
      dateRange: "2026-04-20",
      runId: "run-1",
    },
    workshopState: {} as WorkshopInstanceRecord["workshopState"],
    status: "prepared",
    createdAt: "2026-04-20T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    allowWalkIns: true,
    ...overrides,
  };
}

function makeParticipant(overrides: Partial<ParticipantRecord> = {}): ParticipantRecord {
  return {
    id: "p-existing",
    instanceId: INSTANCE_ID,
    displayName: "Jana",
    email: null,
    emailOptIn: false,
    tag: null,
    neonUserId: null,
    createdAt: "2026-04-19T10:00:00.000Z",
    updatedAt: "2026-04-19T10:00:00.000Z",
    archivedAt: null,
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
  async listByDisplayNamePrefix(instanceId: string, prefix: string, limit: number) {
    const needle = prefix.toLowerCase();
    return this.participants
      .filter((p) => p.instanceId === instanceId && p.displayName.toLowerCase().includes(needle))
      .slice(0, limit);
  }
  async findByNeonUserId(instanceId: string, id: string) {
    return this.participants.find((p) => p.instanceId === instanceId && p.neonUserId === id) ?? null;
  }
  async linkNeonUser(instanceId: string, participantId: string, neonUserId: string) {
    this.participants = this.participants.map((p) =>
      p.instanceId === instanceId && p.id === participantId ? { ...p, neonUserId } : p,
    );
  }
  async upsertParticipant(_: string, participant: ParticipantRecord) {
    const idx = this.participants.findIndex((p) => p.id === participant.id);
    if (idx === -1) this.participants.push(participant);
    else this.participants[idx] = participant;
  }
  async archiveParticipant() {}
  async replaceParticipants(_: string, participants: ParticipantRecord[]) {
    this.participants = participants;
  }
}

class MemoryWorkshopInstanceRepository implements WorkshopInstanceRepository {
  constructor(private instance: WorkshopInstanceRecord | null) {}
  async listInstances() {
    return this.instance ? [this.instance] : [];
  }
  async getInstance(id: string) {
    return this.instance?.id === id ? this.instance : null;
  }
  async getDefaultInstanceId() {
    return this.instance?.id ?? "default";
  }
  async createInstance() {
    return null as unknown as WorkshopInstanceRecord;
  }
  async updateInstance(_: string, instance: WorkshopInstanceRecord) {
    this.instance = instance;
  }
  async upsertInstance(_: string, instance: WorkshopInstanceRecord) {
    this.instance = instance;
  }
  async setStatus() {}
  async removeInstance() {
    this.instance = null;
  }
}

class MemoryAuditLogRepository implements AuditLogRepository {
  records: AuditLogRecord[] = [];
  async append(record: AuditLogRecord) {
    this.records.push(record);
  }
  async deleteOlderThan() {}
}

function buildRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/event-access/identify/set-password", {
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
  return import("@/app/api/event-access/identify/set-password/route");
}

describe("POST /api/event-access/identify/set-password (walk-in policy gate)", () => {
  let auditRepo: MemoryAuditLogRepository;
  let participantRepo: MemoryParticipantRepository;

  beforeEach(() => {
    auditRepo = new MemoryAuditLogRepository();
    participantRepo = new MemoryParticipantRepository();
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    setParticipantRepositoryForTests(participantRepo);
    setAuditLogRepositoryForTests(auditRepo);
  });

  afterEach(() => {
    setEventAccessRepositoryForTests(null);
    setParticipantRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    setWorkshopInstanceRepositoryForTests(null);
  });

  it("rejects walk-in when allow_walk_ins = false and emits walk_in_refused audit", async () => {
    setWorkshopInstanceRepositoryForTests(
      new MemoryWorkshopInstanceRepository(makeInstance({ allowWalkIns: false })),
    );
    const { POST } = await importRoute();

    const response = await POST(
      buildRequest({ displayName: "Walk Inny", email: "walk@inny.test", password: "longenough" }),
    );

    expect(response.status).toBe(403);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe("walk_in_refused");
    expect(auditRepo.records.map((r) => r.action)).toContain("participant_identify_walk_in_refused");
  });

  it("accepts walk-in when allow_walk_ins = true + valid displayName, emits walk_in_created audit", async () => {
    setWorkshopInstanceRepositoryForTests(
      new MemoryWorkshopInstanceRepository(makeInstance({ allowWalkIns: true })),
    );
    const { POST } = await importRoute();

    const response = await POST(
      buildRequest({ displayName: "Walk Inny", email: "walk@inny.test", password: "longenough" }),
    );

    expect(response.status).toBe(200);
    const created = auditRepo.records.find((r) => r.action === "participant_identify_walk_in_created");
    expect(created).toBeDefined();
    expect(created?.result).toBe("success");
  });

  it("rejects walk-in when displayName is missing even with allow_walk_ins = true", async () => {
    setWorkshopInstanceRepositoryForTests(
      new MemoryWorkshopInstanceRepository(makeInstance({ allowWalkIns: true })),
    );
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ email: "noname@example.com", password: "longenough" }));

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe("invalid_display_name");
  });

  it("rejects participantId path when participant doesn't exist", async () => {
    setWorkshopInstanceRepositoryForTests(
      new MemoryWorkshopInstanceRepository(makeInstance({ allowWalkIns: true })),
    );
    const { POST } = await importRoute();

    const response = await POST(
      buildRequest({ participantId: "nope", email: "x@example.com", password: "longenough" }),
    );

    expect(response.status).toBe(404);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe("not_found");
  });

  it("rejects participantId path when participant already has neonUserId set", async () => {
    setWorkshopInstanceRepositoryForTests(
      new MemoryWorkshopInstanceRepository(makeInstance({ allowWalkIns: true })),
    );
    participantRepo.participants = [
      makeParticipant({ id: "p-locked", neonUserId: "already-here" }),
    ];
    const { POST } = await importRoute();

    const response = await POST(
      buildRequest({ participantId: "p-locked", email: "x@example.com", password: "longenough" }),
    );

    expect(response.status).toBe(409);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe("already_set");
  });

  it("rejects invalid email shape", async () => {
    setWorkshopInstanceRepositoryForTests(
      new MemoryWorkshopInstanceRepository(makeInstance({ allowWalkIns: true })),
    );
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ email: "no-at-sign", password: "longenough" }));
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe("invalid_email");
  });

  it("rejects passwords shorter than 8 chars", async () => {
    setWorkshopInstanceRepositoryForTests(
      new MemoryWorkshopInstanceRepository(makeInstance({ allowWalkIns: true })),
    );
    const { POST } = await importRoute();

    const response = await POST(buildRequest({ email: "ok@x.com", password: "short" }));
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe("weak_password");
  });

  it("returns 401 when no session cookie is present", async () => {
    setWorkshopInstanceRepositoryForTests(
      new MemoryWorkshopInstanceRepository(makeInstance({ allowWalkIns: true })),
    );
    const { POST } = await importRoute();

    const response = await POST(
      new Request("http://localhost/api/event-access/identify/set-password", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost", host: "localhost" },
        body: JSON.stringify({ email: "x@x.com", password: "longenough" }),
      }),
    );

    expect(response.status).toBe(401);
  });
});
