import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { guardedRedeemEventCode } from "./redeem-guard";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "./audit-log-repository";
import { setEventAccessRepositoryForTests, type EventAccessRepository } from "./event-access-repository";
import {
  hashSecret,
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "./participant-event-access-repository";
import { setRedeemAttemptRepositoryForTests, type RedeemAttemptRepository } from "./redeem-attempt-repository";
import type {
  AuditLogRecord,
  ParticipantEventAccessRecord,
  ParticipantSessionRecord,
  RedeemAttemptRecord,
} from "./runtime-contracts";

class MemoryEventAccessRepository implements EventAccessRepository {
  sessions: ParticipantSessionRecord[] = [];

  async listSessions(instanceId: string) {
    return this.sessions.filter((session) => session.instanceId === instanceId);
  }

  async findSession(instanceId: string, tokenHash: string) {
    return this.sessions.find((s) => s.instanceId === instanceId && s.tokenHash === tokenHash) ?? null;
  }

  async findSessionByTokenHash(tokenHash: string) {
    return this.sessions.find((s) => s.tokenHash === tokenHash) ?? null;
  }

  async upsertSession(instanceId: string, session: ParticipantSessionRecord) {
    const next = { ...session, instanceId };
    const index = this.sessions.findIndex((s) => s.tokenHash === session.tokenHash);
    if (index >= 0) {
      this.sessions[index] = next;
    } else {
      this.sessions.push(next);
    }
  }

  async deleteSession(instanceId: string, tokenHash: string) {
    this.sessions = this.sessions.filter((s) => !(s.instanceId === instanceId && s.tokenHash === tokenHash));
  }

  async deleteExpiredSessions() {}
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

class MemoryRedeemAttemptRepository implements RedeemAttemptRepository {
  constructor(readonly attempts: RedeemAttemptRecord[] = []) {}

  async countRecentFailures(instanceId: string, fingerprint: string, since: string) {
    const sinceMs = Date.parse(since);
    return this.attempts.filter(
      (a) =>
        a.instanceId === instanceId &&
        a.fingerprint === fingerprint &&
        a.result === "failure" &&
        Date.parse(a.createdAt) >= sinceMs,
    ).length;
  }

  async appendAttempt(attempt: RedeemAttemptRecord) {
    this.attempts.push(structuredClone(attempt));
  }

  async deleteOlderThan() {}
}

class MemoryAuditLogRepository implements AuditLogRepository {
  async append(record: AuditLogRecord) {
    void record;
  }
  async deleteOlderThan() {}
}

function fingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function buildRequest(headers: Record<string, string>) {
  return new Request("http://localhost/api/event-access/redeem", {
    method: "POST",
    headers,
    body: JSON.stringify({ eventCode: "lantern8-context4-handoff2" }),
  });
}

describe("guardedRedeemEventCode", () => {
  const originalInstanceId = process.env.HARNESS_WORKSHOP_INSTANCE_ID;

  beforeEach(() => {
    process.env.HARNESS_WORKSHOP_INSTANCE_ID = "sample-studio-a";
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
    if (originalInstanceId === undefined) {
      delete process.env.HARNESS_WORKSHOP_INSTANCE_ID;
    } else {
      process.env.HARNESS_WORKSHOP_INSTANCE_ID = originalInstanceId;
    }
    setEventAccessRepositoryForTests(null);
    setParticipantEventAccessRepositoryForTests(null);
    setRedeemAttemptRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    vi.useRealTimers();
  });

  it("rejects untrusted origins before touching the rate limiter or DB", async () => {
    const attempts = new MemoryRedeemAttemptRepository();
    setRedeemAttemptRepositoryForTests(attempts);

    const result = await guardedRedeemEventCode(
      "lantern8-context4-handoff2",
      undefined,
      buildRequest({
        "content-type": "application/json",
        origin: "http://evil.test",
        "user-agent": "vitest",
      }),
    );

    expect(result).toEqual({ ok: false, reason: "untrusted_origin" });
    expect(attempts.attempts).toHaveLength(0);
  });

  it("returns rate_limited once the client fingerprint passes the failure threshold", async () => {
    setRedeemAttemptRepositoryForTests(
      new MemoryRedeemAttemptRepository(
        Array.from({ length: 5 }, (_, index) => ({
          instanceId: "sample-studio-a",
          fingerprint: fingerprint("vitest:unknown-language"),
          result: "failure" as const,
          createdAt: `2026-04-06T11:5${index}:00.000Z`,
        })),
      ),
    );

    const result = await guardedRedeemEventCode(
      "lantern8-context4-handoff2",
      undefined,
      buildRequest({
        "content-type": "application/json",
        origin: "http://localhost",
        "user-agent": "vitest",
      }),
    );

    expect(result).toEqual({ ok: false, reason: "rate_limited" });
  });

  it("passes through to redeemEventCode and records a successful attempt", async () => {
    const attempts = new MemoryRedeemAttemptRepository();
    setRedeemAttemptRepositoryForTests(attempts);

    const result = await guardedRedeemEventCode(
      "lantern8-context4-handoff2",
      undefined,
      buildRequest({
        "content-type": "application/json",
        origin: "http://localhost",
        "user-agent": "vitest",
      }),
    );

    expect(result.ok).toBe(true);
    expect(attempts.attempts).toHaveLength(1);
    expect(attempts.attempts[0]).toMatchObject({ result: "success" });
  });

  it("records a failure attempt when the code is invalid so the rate limiter sees it", async () => {
    const attempts = new MemoryRedeemAttemptRepository();
    setRedeemAttemptRepositoryForTests(attempts);

    const result = await guardedRedeemEventCode(
      "wrong-code",
      undefined,
      buildRequest({
        "content-type": "application/json",
        origin: "http://localhost",
        "user-agent": "vitest",
      }),
    );

    expect(result).toMatchObject({ ok: false, reason: "invalid_code" });
    expect(attempts.attempts).toHaveLength(1);
    expect(attempts.attempts[0]).toMatchObject({ result: "failure" });
  });
});
