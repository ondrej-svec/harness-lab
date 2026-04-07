import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { POST } from "@/app/api/event-access/redeem/route";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "@/lib/audit-log-repository";
import { setRedeemAttemptRepositoryForTests, type RedeemAttemptRepository } from "@/lib/redeem-attempt-repository";
import {
  hashSecret,
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "@/lib/participant-event-access-repository";
import type {
  AuditLogRecord,
  ParticipantEventAccessRecord,
  RedeemAttemptRecord,
} from "@/lib/runtime-contracts";

class MemoryParticipantEventAccessRepository implements ParticipantEventAccessRepository {
  constructor(private access: ParticipantEventAccessRecord | null) {}

  async getActiveAccess() {
    return this.access ? structuredClone(this.access) : null;
  }

  async saveAccess(_instanceId: string, access: ParticipantEventAccessRecord) {
    this.access = structuredClone(access);
  }
}

class MemoryRedeemAttemptRepository implements RedeemAttemptRepository {
  constructor(readonly attempts: RedeemAttemptRecord[] = []) {}

  async countRecentFailures(instanceId: string, fingerprint: string, since: string) {
    const sinceMs = Date.parse(since);
    return this.attempts.filter(
      (attempt) =>
        attempt.instanceId === instanceId &&
        attempt.fingerprint === fingerprint &&
        attempt.result === "failure" &&
        Date.parse(attempt.createdAt) >= sinceMs,
    ).length;
  }

  async appendAttempt(attempt: RedeemAttemptRecord) {
    this.attempts.push(structuredClone(attempt));
  }
}

function fingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

class MemoryAuditLogRepository implements AuditLogRepository {
  async append(record: AuditLogRecord) {
    void record;
  }
}

describe("POST /api/event-access/redeem", () => {
  beforeEach(() => {
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
    setParticipantEventAccessRepositoryForTests(null);
    setRedeemAttemptRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    vi.useRealTimers();
  });

  it("redeems the event code and records a successful attempt", async () => {
    const repository = new MemoryRedeemAttemptRepository();
    setRedeemAttemptRepositoryForTests(repository);

    const response = await POST(
      new Request("http://localhost/api/event-access/redeem", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          "user-agent": "vitest",
        },
        body: JSON.stringify({ eventCode: "lantern8-context4-handoff2" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(repository.attempts).toHaveLength(1);
    expect(repository.attempts[0]).toMatchObject({ result: "success" });
  });

  it("returns 429 when the redeem fingerprint exceeded the recent failure limit", async () => {
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

    const response = await POST(
      new Request("http://localhost/api/event-access/redeem", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          "user-agent": "vitest",
        },
        body: JSON.stringify({ eventCode: "lantern8-context4-handoff2" }),
      }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: "rate_limited" });
  });

  it("redirects form submissions when the event code is invalid", async () => {
    const repository = new MemoryRedeemAttemptRepository();
    setRedeemAttemptRepositoryForTests(repository);

    const formData = new FormData();
    formData.set("eventCode", "wrong-code");

    const response = await POST(
      new Request("http://localhost/api/event-access/redeem", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          "user-agent": "vitest",
        },
        body: formData,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/?eventAccess=invalid_code");
    expect(repository.attempts[0]).toMatchObject({ result: "failure" });
  });
});
