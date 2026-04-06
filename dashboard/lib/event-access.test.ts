import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getConfiguredEventCode,
  getParticipantCoreBundle,
  getParticipantSession,
  getParticipantTeamLookup,
  participantSessionCookieName,
  redeemEventCode,
  revokeParticipantSession,
} from "./event-access";
import {
  setEventAccessRepositoryForTests,
  type EventAccessRepository,
  type ParticipantSessionRecord,
} from "./event-access-repository";

class MemoryEventAccessRepository implements EventAccessRepository {
  constructor(private sessions: ParticipantSessionRecord[] = []) {}

  async getSessions() {
    return structuredClone(this.sessions);
  }

  async saveSessions(sessions: ParticipantSessionRecord[]) {
    this.sessions = structuredClone(sessions);
  }
}

describe("event-access", () => {
  const originalEventCode = process.env.HARNESS_EVENT_CODE;
  const originalEventExpiry = process.env.HARNESS_EVENT_CODE_EXPIRES_AT;
  let repository: MemoryEventAccessRepository;

  beforeEach(() => {
    process.env.HARNESS_EVENT_CODE = "lantern8-context4-handoff2";
    process.env.HARNESS_EVENT_CODE_EXPIRES_AT = "2026-04-20T12:00:00.000Z";
    repository = new MemoryEventAccessRepository();
    setEventAccessRepositoryForTests(repository);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-06T12:00:00.000Z"));
  });

  afterEach(() => {
    if (originalEventCode === undefined) {
      delete process.env.HARNESS_EVENT_CODE;
    } else {
      process.env.HARNESS_EVENT_CODE = originalEventCode;
    }

    if (originalEventExpiry === undefined) {
      delete process.env.HARNESS_EVENT_CODE_EXPIRES_AT;
    } else {
      process.env.HARNESS_EVENT_CODE_EXPIRES_AT = originalEventExpiry;
    }

    setEventAccessRepositoryForTests(null);
    vi.useRealTimers();
  });

  it("exposes a configured event code without leaking whether it is production or sample to callers", () => {
    expect(getConfiguredEventCode()).toMatchObject({
      code: "lantern8-context4-handoff2",
      expiresAt: "2026-04-20T12:00:00.000Z",
    });
  });

  it("redeems the configured event code into a participant session", async () => {
    const result = await redeemEventCode("lantern8-context4-handoff2");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.token).toBeTruthy();
      expect(result.session.expiresAt).toBe("2026-04-07T00:00:00.000Z");
      expect(await getParticipantSession(result.session.token)).toMatchObject({
        token: result.session.token,
      });
    }
  });

  it("rejects invalid or expired event codes", async () => {
    expect(await redeemEventCode("wrong-code")).toEqual({ ok: false, reason: "invalid_code" });

    process.env.HARNESS_EVENT_CODE_EXPIRES_AT = "2026-04-01T12:00:00.000Z";
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

  it("builds the participant core bundle and protected team lookup shapes", async () => {
    const core = await getParticipantCoreBundle();
    const teams = await getParticipantTeamLookup();

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
});
