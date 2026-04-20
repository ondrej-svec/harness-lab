/**
 * Unit tests for GET /api/event-access/identify/suggest.
 *
 * Asserts the contract Phase 5.6 Layer 1 promises:
 *   - min 2 chars (returns [] for shorter prefixes)
 *   - cap at 5 results (enforced via repo.listByDisplayNamePrefix)
 *   - rate-limited per session token hash (20/min)
 *   - instance-scoped (the repo is queried with the session's instanceId)
 *   - no auth → 401
 *   - response shape includes id, displayName, hasPassword, hasEmail, emailDisplay, disambiguator
 *   - never returns raw email or tag (except as disambiguator value)
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/event-access/identify/suggest/route";
import {
  setEventAccessRepositoryForTests,
  type EventAccessRepository,
} from "@/lib/event-access-repository";
import {
  setParticipantRepositoryForTests,
  type ParticipantRepository,
} from "@/lib/participant-repository";
import { hashSecret } from "@/lib/participant-event-access-repository";
import { resetSuggestRateLimitForTests } from "@/lib/suggest-rate-limit";
import type {
  ParticipantRecord,
  ParticipantSessionRecord,
} from "@/lib/runtime-contracts";

const SESSION_TOKEN = "test-session-token-suggest";
const SESSION_TOKEN_HASH = hashSecret(SESSION_TOKEN);
const INSTANCE_ID = "instance-suggest-tests";

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
        (p) => p.instanceId === instanceId && p.archivedAt === null && p.displayName.toLowerCase().includes(needle),
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

function buildRequest(query: string): Request {
  return new Request(`http://localhost/api/event-access/identify/suggest?q=${encodeURIComponent(query)}`, {
    headers: { cookie: `harness_event_session=${SESSION_TOKEN}` },
  });
}

function makeParticipant(overrides: Partial<ParticipantRecord> = {}): ParticipantRecord {
  const now = "2026-04-19T10:00:00.000Z";
  return {
    id: `p-${Math.random().toString(36).slice(2, 8)}`,
    instanceId: INSTANCE_ID,
    displayName: "Jan Novák",
    email: null,
    emailOptIn: false,
    tag: null,
    neonUserId: null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    ...overrides,
  };
}

describe("GET /api/event-access/identify/suggest", () => {
  beforeEach(() => {
    resetSuggestRateLimitForTests();
  });

  afterEach(() => {
    setEventAccessRepositoryForTests(null);
    setParticipantRepositoryForTests(null);
  });

  it("returns 401 when no session cookie is present", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(null));
    setParticipantRepositoryForTests(new MemoryParticipantRepository([]));

    const response = await GET(new Request("http://localhost/api/event-access/identify/suggest?q=ja"));
    expect(response.status).toBe(401);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toBe("no_session");
  });

  it("returns 401 when the cookie's token doesn't match a session", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(null));
    setParticipantRepositoryForTests(new MemoryParticipantRepository([]));

    const response = await GET(buildRequest("ja"));
    expect(response.status).toBe(401);
  });

  it("returns empty matches for prefix < 2 chars without hitting the repo", async () => {
    let repoCalls = 0;
    const repo = new (class extends MemoryParticipantRepository {
      async listByDisplayNamePrefix(...args: Parameters<MemoryParticipantRepository["listByDisplayNamePrefix"]>) {
        repoCalls += 1;
        return super.listByDisplayNamePrefix(...args);
      }
    })([makeParticipant({ displayName: "Jana" })]);
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    setParticipantRepositoryForTests(repo);

    const response = await GET(buildRequest("j"));
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { matches: unknown[] };
    expect(payload.matches).toEqual([]);
    expect(repoCalls).toBe(0);
  });

  it("returns id + displayName + hasPassword + hasEmail + emailDisplay + disambiguator (null when unique)", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    setParticipantRepositoryForTests(
      new MemoryParticipantRepository([
        makeParticipant({
          id: "p1",
          displayName: "Jana Nováková",
          neonUserId: "neon-1",
          email: "jana.novakova@acme.com",
        }),
        makeParticipant({ id: "p2", displayName: "Tomas", neonUserId: null }),
      ]),
    );

    const response = await GET(buildRequest("ja"));
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      matches: Array<{
        id: string;
        displayName: string;
        hasPassword: boolean;
        hasEmail: boolean;
        emailDisplay: string | null;
        disambiguator: unknown;
      }>;
    };
    expect(payload.matches).toEqual([
      {
        id: "p1",
        displayName: "Jana Nováková",
        hasPassword: true,
        hasEmail: true,
        emailDisplay: "j***@acme.com",
        disambiguator: null,
      },
    ]);
  });

  it("scopes to the session's instanceId — never returns participants from other instances", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    setParticipantRepositoryForTests(
      new MemoryParticipantRepository([
        makeParticipant({ id: "ours", instanceId: INSTANCE_ID, displayName: "Jan" }),
        makeParticipant({ id: "theirs", instanceId: "different-instance", displayName: "Jan" }),
      ]),
    );

    const response = await GET(buildRequest("ja"));
    const payload = (await response.json()) as { matches: Array<{ id: string }> };
    expect(payload.matches.map((m) => m.id)).toEqual(["ours"]);
  });

  it("caps the result set at 5 matches", async () => {
    const seven = Array.from({ length: 7 }).map((_, idx) =>
      makeParticipant({ id: `p${idx}`, displayName: `Jan ${idx}` }),
    );
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    setParticipantRepositoryForTests(new MemoryParticipantRepository(seven));

    const response = await GET(buildRequest("ja"));
    const payload = (await response.json()) as { matches: Array<unknown> };
    expect(payload.matches).toHaveLength(5);
  });

  it("computes a tag-first disambiguator when two roster entries share a name", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    setParticipantRepositoryForTests(
      new MemoryParticipantRepository([
        makeParticipant({ id: "j-bravo", displayName: "Jan", tag: "bravo" }),
        makeParticipant({ id: "j-charlie", displayName: "Jan", tag: "charlie" }),
      ]),
    );

    const response = await GET(buildRequest("jan"));
    const payload = (await response.json()) as {
      matches: Array<{ id: string; disambiguator: { kind: string; value: string } | null }>;
    };
    const byId = new Map(payload.matches.map((m) => [m.id, m.disambiguator] as const));
    expect(byId.get("j-bravo")).toEqual({ kind: "tag", value: "bravo" });
    expect(byId.get("j-charlie")).toEqual({ kind: "tag", value: "charlie" });
  });

  it("falls back to masked-email disambiguator when no tag distinguishes a collision", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    setParticipantRepositoryForTests(
      new MemoryParticipantRepository([
        makeParticipant({ id: "j-acme", displayName: "Jan", email: "jan@acme.com" }),
        makeParticipant({ id: "j-other", displayName: "Jan", email: "jan@example.org" }),
      ]),
    );

    const response = await GET(buildRequest("jan"));
    const payload = (await response.json()) as {
      matches: Array<{ id: string; displayName: string; disambiguator: { kind: string; value: string } | null }>;
    };
    for (const match of payload.matches) {
      expect(match.disambiguator?.kind).toBe("masked_email");
      expect(match.displayName).toBe("Jan");
      // Local part must be masked. The domain stays so users can
      // tell two collisions apart by workplace; the email address as
      // shipped must never be the deliverable one.
      expect(match.disambiguator?.value).toMatch(/^.\*\*\*@/);
    }
    // Raw local part never leaks anywhere in the payload
    const body = JSON.stringify(payload);
    expect(body).not.toContain("jan@acme.com");
    expect(body).not.toContain("jan@example.org");
  });

  it("rate-limits a single session at 20 calls per minute, then returns 429", async () => {
    setEventAccessRepositoryForTests(new MemoryEventAccessRepository(makeSession()));
    setParticipantRepositoryForTests(new MemoryParticipantRepository([]));

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await GET(buildRequest("ja"));
      expect(response.status).toBe(200);
    }

    const limited = await GET(buildRequest("ja"));
    expect(limited.status).toBe(429);
    const payload = (await limited.json()) as { error: string };
    expect(payload.error).toBe("rate_limited");
  });
});
