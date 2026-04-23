import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  getConfiguredEventCode,
  getParticipantCoreBundle,
  getParticipantSessionCookieOptions,
  getParticipantSession,
  getParticipantTeamLookup,
  participantSessionCookieName,
  redeemEventCode,
  revokeParticipantSession,
} from "./event-access";
import { setAuditLogRepositoryForTests, type AuditLogRepository } from "./audit-log-repository";
import {
  setEventAccessRepositoryForTests,
  type EventAccessRepository,
} from "./event-access-repository";
import {
  hashEventCode,
  hashSecret,
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "./participant-event-access-repository";
import type { AuditLogRecord, ParticipantEventAccessRecord, ParticipantSessionRecord } from "./runtime-contracts";

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
    this.sessions = this.sessions.some((item) => item.tokenHash === session.tokenHash)
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
      (session) =>
        session.instanceId !== instanceId ||
        (Date.parse(session.expiresAt) > nowMs && Date.parse(session.absoluteExpiresAt) > nowMs),
    );
  }
}

class MemoryParticipantEventAccessRepository implements ParticipantEventAccessRepository {
  constructor(private access: ParticipantEventAccessRecord | null) {}

  async getActiveAccess(_instanceId: string) {
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
  records: AuditLogRecord[] = [];

  async append(record: AuditLogRecord) {
    this.records.push(structuredClone(record));
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    void instanceId;
    void olderThan;
  }
}

describe("event-access", () => {
  const originalDataDir = process.env.HARNESS_DATA_DIR;
  const originalStatePath = process.env.HARNESS_STATE_PATH;
  const originalInstancesPath = process.env.HARNESS_INSTANCES_PATH;
  let repository: MemoryEventAccessRepository;
  let accessRepository: MemoryParticipantEventAccessRepository;
  let tempDir: string | null;

  beforeEach(() => {
    vi.resetModules();
    tempDir = null;
    delete process.env.HARNESS_STATE_PATH;
    delete process.env.HARNESS_INSTANCES_PATH;
    repository = new MemoryEventAccessRepository();
    accessRepository = new MemoryParticipantEventAccessRepository({
      id: "pea-sample-studio-a",
      instanceId: "sample-studio-a",
      version: 1,
      codeHash: hashSecret("lantern8-context4-handoff2"),
      expiresAt: "2026-04-20T12:00:00.000Z",
      revokedAt: null,
      sampleCode: "lantern8-context4-handoff2",
    });
    setEventAccessRepositoryForTests(repository);
    setParticipantEventAccessRepositoryForTests(accessRepository);
    setAuditLogRepositoryForTests(new MemoryAuditLogRepository());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-06T12:00:00.000Z"));
  });

  afterEach(() => {
    if (originalDataDir === undefined) {
      delete process.env.HARNESS_DATA_DIR;
    } else {
      process.env.HARNESS_DATA_DIR = originalDataDir;
    }
    if (originalStatePath === undefined) {
      delete process.env.HARNESS_STATE_PATH;
    } else {
      process.env.HARNESS_STATE_PATH = originalStatePath;
    }
    if (originalInstancesPath === undefined) {
      delete process.env.HARNESS_INSTANCES_PATH;
    } else {
      process.env.HARNESS_INSTANCES_PATH = originalInstancesPath;
    }

    setEventAccessRepositoryForTests(null);
    setParticipantEventAccessRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    vi.useRealTimers();
    if (tempDir) {
      return rm(tempDir, { recursive: true, force: true });
    }
  });

  it("exposes a configured event access preview without leaking the stored code hash", async () => {
    await expect(getConfiguredEventCode()).resolves.toMatchObject({
      sampleCode: "lantern8-context4-handoff2",
      expiresAt: "2026-04-20T12:00:00.000Z",
      isSample: true,
    });
  });

  it("redeems the configured event code into a participant session", async () => {
    const result = await redeemEventCode("lantern8-context4-handoff2");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.token).toBeTruthy();
      expect(result.session.instanceId).toBe("sample-studio-a");
      expect(result.session.expiresAt).toBe("2026-04-07T00:00:00.000Z");
      expect(await getParticipantSession(result.session.token)).toMatchObject({
        instanceId: "sample-studio-a",
        expiresAt: "2026-04-07T00:00:00.000Z",
      });
    }
  });

  it("rejects invalid or expired event codes", async () => {
    expect(await redeemEventCode("wrong-code")).toEqual({ ok: false, reason: "invalid_code" });

    await accessRepository.saveAccess("sample-studio-a", {
      id: "pea-sample-studio-a",
      instanceId: "sample-studio-a",
      version: 2,
      codeHash: hashSecret("lantern8-context4-handoff2"),
      expiresAt: "2026-04-01T12:00:00.000Z",
      revokedAt: null,
      sampleCode: "lantern8-context4-handoff2",
    });
    expect(await redeemEventCode("lantern8-context4-handoff2")).toEqual({
      ok: false,
      reason: "expired_code",
    });
  });

  it("revokes participant sessions cleanly", async () => {
    const result = await redeemEventCode("lantern8-context4-handoff2");
    expect(result.ok).toBe(true);

    if (result.ok) {
      await revokeParticipantSession(result.session.token);
      expect(await getParticipantSession(result.session.token)).toBeNull();
    }
  });

  it("resolves sessions across instances via cross-instance token lookup", async () => {
    const result = await redeemEventCode("lantern8-context4-handoff2");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const session = await getParticipantSession(result.session.token);
    expect(session).not.toBeNull();
    expect(session?.instanceId).toBe("sample-studio-a");
  });

  it("builds the participant core bundle and protected team lookup shapes", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-event-access-"));
    process.env.HARNESS_DATA_DIR = tempDir;
    const core = await getParticipantCoreBundle("sample-studio-a");
    const teams = await getParticipantTeamLookup("sample-studio-a");

    expect(core.event.title).toBe("Harness Lab");
    expect(core.announcements.length).toBeGreaterThan(0);
    expect(core.keyLinks.length).toBeGreaterThan(0);
    expect(teams.items[0]).toMatchObject({
      id: "t1",
      repoUrl: "https://github.com/example/standup-bot",
    });
  });

  it("exports the participant session cookie name for route handlers", () => {
    expect(participantSessionCookieName).toBe("harness_event_session");
  });

  it("marks participant session cookies as secure in production", () => {
    // `process.env.NODE_ENV` is typed read-only by @types/node; vi.stubEnv
    // handles the re-assignment and unstubs on test exit.
    vi.stubEnv("NODE_ENV", "production");

    expect(getParticipantSessionCookieOptions(new Date("2026-04-07T00:00:00.000Z"))).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    vi.unstubAllEnvs();
  });

  it("keeps participant session cookies non-secure in local development", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(getParticipantSessionCookieOptions(new Date("2026-04-07T00:00:00.000Z"))).toMatchObject({
      secure: false,
    });

    vi.unstubAllEnvs();
  });

  it("rejects and removes expired sessions during validation", async () => {
    const result = await redeemEventCode("lantern8-context4-handoff2");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    vi.setSystemTime(new Date("2026-04-08T00:00:00.000Z"));

    await expect(getParticipantSession(result.session.token)).resolves.toBeNull();
    await expect(repository.listSessions("sample-studio-a")).resolves.toEqual([]);
  });

  it("rejects sessions expired only by absoluteExpiresAt", async () => {
    const result = await redeemEventCode("lantern8-context4-handoff2");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    // Advance past absoluteExpiresAt (16h) but keep a generous expiresAt
    // by refreshing the session's sliding expiry right before advancing time.
    const sessions = await repository.listSessions("sample-studio-a");
    const stored = sessions[0]!;
    await repository.upsertSession("sample-studio-a", {
      ...stored,
      expiresAt: "2026-04-07T06:00:00.000Z",
      absoluteExpiresAt: "2026-04-07T04:00:00.000Z",
    });

    // expiresAt is still valid, but absoluteExpiresAt is expired
    vi.setSystemTime(new Date("2026-04-07T05:00:00.000Z"));

    await expect(getParticipantSession(result.session.token)).resolves.toBeNull();
    await expect(repository.listSessions("sample-studio-a")).resolves.toEqual([]);
  });

  it("revokes a session using the instance id stored on the session row", async () => {
    const result = await redeemEventCode("lantern8-context4-handoff2");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    await revokeParticipantSession(result.session.token);

    // Session should be removed from its original instance.
    await expect(repository.listSessions("sample-studio-a")).resolves.toEqual([]);
    await expect(getParticipantSession(result.session.token)).resolves.toBeNull();
  });

  it("revokes gracefully when the token is not in the repository", async () => {
    // Unknown token: no row exists, so no-op (no audit write, no throw).
    await expect(revokeParticipantSession("nonexistent-token")).resolves.toBeUndefined();
  });

  it("cleans up expired sessions from their own instance on lookup", async () => {
    const result = await redeemEventCode("lantern8-context4-handoff2");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    // Advance time past expiry
    vi.setSystemTime(new Date("2026-04-08T00:00:00.000Z"));

    // Expired session lookup should find and delete from the session's instance.
    await expect(getParticipantSession(result.session.token)).resolves.toBeNull();
    await expect(repository.listSessions("sample-studio-a")).resolves.toEqual([]);
  });

  describe("HMAC event-code migration", () => {
    it("redeems a code whose stored hash was written with the new HMAC", async () => {
      await accessRepository.saveAccess("sample-studio-a", {
        id: "pea-sample-studio-a",
        instanceId: "sample-studio-a",
        version: 2,
        codeHash: hashEventCode("lantern8-context4-handoff2"),
        expiresAt: "2026-04-20T12:00:00.000Z",
        revokedAt: null,
        sampleCode: "lantern8-context4-handoff2",
      });

      const result = await redeemEventCode("lantern8-context4-handoff2");
      expect(result.ok).toBe(true);
    });

    it("redeems a legacy SHA-256 row and upgrades the stored hash to HMAC in place", async () => {
      await accessRepository.saveAccess("sample-studio-a", {
        id: "pea-sample-studio-a",
        instanceId: "sample-studio-a",
        version: 2,
        codeHash: hashSecret("lantern8-context4-handoff2"),
        expiresAt: "2026-04-20T12:00:00.000Z",
        revokedAt: null,
        sampleCode: "lantern8-context4-handoff2",
      });

      const result = await redeemEventCode("lantern8-context4-handoff2");
      expect(result.ok).toBe(true);

      const upgraded = await accessRepository.getActiveAccess("sample-studio-a");
      expect(upgraded?.codeHash).toBe(hashEventCode("lantern8-context4-handoff2"));
      expect(upgraded?.codeHash).not.toBe(hashSecret("lantern8-context4-handoff2"));
    });

    it("rejects a code whose hash does not match under either hash family", async () => {
      const result = await redeemEventCode("not-the-code");
      expect(result).toEqual({ ok: false, reason: "invalid_code" });
    });
  });
});
