import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/event-access/identify/selected/route";
import {
  setEventAccessRepositoryForTests,
  type EventAccessRepository,
} from "@/lib/event-access-repository";
import {
  setParticipantRepositoryForTests,
  type ParticipantRepository,
} from "@/lib/participant-repository";
import { hashSecret } from "@/lib/participant-event-access-repository";
import type {
  ParticipantRecord,
  ParticipantSessionRecord,
} from "@/lib/runtime-contracts";

const SESSION_TOKEN = "test-session-token-selected";
const SESSION_TOKEN_HASH = hashSecret(SESSION_TOKEN);
const INSTANCE_ID = "instance-selected-tests";

function makeSession(overrides: Partial<ParticipantSessionRecord> = {}): ParticipantSessionRecord {
  const now = Date.now();
  return {
    instanceId: INSTANCE_ID,
    tokenHash: SESSION_TOKEN_HASH,
    createdAt: new Date(now - 60_000).toISOString(),
    lastValidatedAt: new Date(now - 1_000).toISOString(),
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
  constructor(private participants: ParticipantRecord[]) {}
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
      .filter(
        (p) =>
          p.instanceId === instanceId &&
          p.archivedAt === null &&
          p.displayName.toLowerCase().includes(needle),
      )
      .slice(0, limit);
  }
  async findByNeonUserId(instanceId: string, neonUserId: string) {
    return this.participants.find((p) => p.instanceId === instanceId && p.neonUserId === neonUserId) ?? null;
  }
  async linkNeonUser() {}
  async upsertParticipant(_: string, participant: ParticipantRecord) {
    this.participants = [...this.participants.filter((p) => p.id !== participant.id), participant];
  }
  async archiveParticipant() {}
  async replaceParticipants(_: string, participants: ParticipantRecord[]) {
    this.participants = participants;
  }
}

function buildRequest(participantId?: string): Request {
  const url =
    participantId === undefined
      ? "http://localhost/api/event-access/identify/selected"
      : `http://localhost/api/event-access/identify/selected?participantId=${encodeURIComponent(participantId)}`;
  return new Request(url, {
    headers: { cookie: `harness_event_session=${SESSION_TOKEN}` },
  });
}

function makeParticipant(overrides: Partial<ParticipantRecord> = {}): ParticipantRecord {
  const now = "2026-04-20T10:00:00.000Z";
  return {
    id: "p1",
    instanceId: INSTANCE_ID,
    displayName: "Jan Novák",
    email: "jan@acme.com",
    emailOptIn: false,
    tag: null,
    neonUserId: null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    ...overrides,
  };
}

describe("GET /api/event-access/identify/selected", () => {
  afterEach(() => {
    setEventAccessRepositoryForTests(null);
    setParticipantRepositoryForTests(null);
  });

  it("returns 401 when no session cookie is present", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(null));
    setParticipantRepositoryForTests(new MemoryParticipantRepository([]));

    const response = await GET(new Request("http://localhost/api/event-access/identify/selected?participantId=p1"));
    expect(response.status).toBe(401);
  });

  it("returns 400 when participantId is missing", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    setParticipantRepositoryForTests(new MemoryParticipantRepository([makeParticipant()]));

    const response = await GET(buildRequest());
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe("missing_participant_id");
  });

  it("returns the full stored email for a first-time roster pick", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    setParticipantRepositoryForTests(new MemoryParticipantRepository([makeParticipant()]));

    const response = await GET(buildRequest("p1"));
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      participant: { id: string; emailDisplay: string | null };
    };
    expect(payload.participant).toEqual({ id: "p1", emailDisplay: "jan@acme.com" });
  });

  it("does not return email for a participant who already has a password", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    setParticipantRepositoryForTests(
      new MemoryParticipantRepository([makeParticipant({ neonUserId: "neon-user-1" })]),
    );

    const response = await GET(buildRequest("p1"));
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      participant: { id: string; emailDisplay: string | null };
    };
    expect(payload.participant).toEqual({ id: "p1", emailDisplay: null });
  });

  it("returns 404 for participants outside the session instance", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    setParticipantRepositoryForTests(
      new MemoryParticipantRepository([makeParticipant({ instanceId: "different-instance" })]),
    );

    const response = await GET(buildRequest("p1"));
    expect(response.status).toBe(404);
  });
});
