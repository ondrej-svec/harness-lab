import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { ParticipantEventAccessRecord } from "./runtime-contracts";

describe("participant-event-access-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;
  const originalEventCode = process.env.HARNESS_EVENT_CODE;
  const originalEventCodeExpiresAt = process.env.HARNESS_EVENT_CODE_EXPIRES_AT;
  const originalRevealKey = process.env.HARNESS_EVENT_CODE_REVEAL_KEY;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-participant-access-"));
    process.env.HARNESS_DATA_DIR = tempDir;
    delete process.env.HARNESS_EVENT_CODE;
    delete process.env.HARNESS_EVENT_CODE_EXPIRES_AT;
    delete process.env.HARNESS_EVENT_CODE_REVEAL_KEY;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    process.env.HARNESS_EVENT_CODE = originalEventCode;
    process.env.HARNESS_EVENT_CODE_EXPIRES_AT = originalEventCodeExpiresAt;
    if (originalRevealKey === undefined) {
      delete process.env.HARNESS_EVENT_CODE_REVEAL_KEY;
    } else {
      process.env.HARNESS_EVENT_CODE_REVEAL_KEY = originalRevealKey;
    }
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./participant-event-access-repository");
    mod.setParticipantEventAccessRepositoryForTests(null);
  });

  it("hashes secrets consistently and seeds file-mode access with HMAC", async () => {
    const mod = await import("./participant-event-access-repository");
    expect(mod.hashSecret("abc")).toBe(mod.hashSecret("abc"));
    expect(mod.hashEventCode("abc")).toBe(mod.hashEventCode("abc"));
    expect(mod.hashEventCode("abc")).not.toBe(mod.hashSecret("abc"));

    const repository = new mod.FileParticipantEventAccessRepository();
    const access = await repository.getActiveAccess("instance-a");
    expect(access).toMatchObject({
      id: "pea-instance-a",
      instanceId: "instance-a",
      version: 1,
      revokedAt: null,
    });
    expect(access?.sampleCode).toBe("lantern8-context4-handoff2");
    expect(access?.codeHash).toBe(mod.hashEventCode("lantern8-context4-handoff2"));
  });

  it("saves access records in file mode and hides revoked ones", async () => {
    const mod = await import("./participant-event-access-repository");
    const repository = new mod.FileParticipantEventAccessRepository();
    const access: ParticipantEventAccessRecord = {
      id: "pea-2",
      instanceId: "instance-a",
      version: 2,
      codeHash: "hash-2",
      expiresAt: "2026-04-20T12:00:00.000Z",
      revokedAt: null,
      sampleCode: null,
    };

    await repository.saveAccess("instance-a", access);
    await expect(repository.getActiveAccess("instance-a")).resolves.toEqual(access);

    await repository.saveAccess("instance-a", { ...access, revokedAt: "2026-04-07T12:00:00.000Z" });
    await expect(repository.getActiveAccess("instance-a")).resolves.toBeNull();
  });

  it("round-trips codeCiphertext through the file-mode JSON repository", async () => {
    const mod = await import("./participant-event-access-repository");
    const repository = new mod.FileParticipantEventAccessRepository();
    const access: ParticipantEventAccessRecord = {
      id: "pea-3",
      instanceId: "instance-b",
      version: 1,
      codeHash: "hash-3",
      codeCiphertext: "v1:nonce.cipher.tag",
      expiresAt: "2026-05-01T12:00:00.000Z",
      revokedAt: null,
      sampleCode: null,
    };

    await repository.saveAccess("instance-b", access);
    await expect(repository.getActiveAccess("instance-b")).resolves.toMatchObject({
      codeCiphertext: "v1:nonce.cipher.tag",
    });
  });

  it("maps neon access rows and exposes preview data", async () => {
    const row = {
      id: "pea-1",
      instance_id: "instance-a",
      version: 1,
      code_hash: "hash-1",
      code_ciphertext: null,
      expires_at: "2026-04-20T12:00:00.000Z",
      revoked_at: null,
    };
    const query = vi.fn(async (sqlText: string) => {
      if (sqlText.includes("SELECT id FROM participant_event_access")) {
        return [];
      }
      if (sqlText.includes("FROM participant_event_access") && sqlText.includes("code_hash")) {
        return [row];
      }
      return undefined;
    });

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const mod = await import("./participant-event-access-repository");
    const repository = new mod.NeonParticipantEventAccessRepository();

    await expect(repository.getActiveAccess("instance-a")).resolves.toMatchObject({
      id: "pea-1",
      instanceId: "instance-a",
      sampleCode: null,
    });
    await repository.saveAccess("instance-a", {
      id: "pea-2",
      instanceId: "instance-a",
      version: 2,
      codeHash: "hash-2",
      expiresAt: "2026-04-21T12:00:00.000Z",
      revokedAt: null,
      sampleCode: null,
    });

    const preview = await mod.getEventAccessPreview("instance-a");
    expect(preview).toMatchObject({
      expiresAt: "2026-04-20T12:00:00.000Z",
      isSample: false,
      codeId: "hash-1".slice(0, 12),
    });
    expect(query).toHaveBeenCalled();
  });

  it("does not seed a sample event code in neon mode when no bootstrap code is configured", async () => {
    const query = vi.fn(async (sqlText: string) => {
      if (sqlText.includes("SELECT id FROM participant_event_access")) {
        return [];
      }
      if (sqlText.includes("FROM participant_event_access") && sqlText.includes("code_hash")) {
        return [];
      }
      return undefined;
    });

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const mod = await import("./participant-event-access-repository");
    const repository = new mod.NeonParticipantEventAccessRepository();

    await expect(repository.getActiveAccess("instance-a")).resolves.toBeNull();
    expect(query).toHaveBeenCalledTimes(2);
    expect(
      query.mock.calls.some(([sqlText]) => String(sqlText).includes("INSERT INTO participant_event_access")),
    ).toBe(false);
  });

  it("seeds access with a unique row id and uses ON CONFLICT DO NOTHING so a prior revoked seed row cannot crash admin", async () => {
    process.env.HARNESS_EVENT_CODE = "lantern8-context4-handoff2";
    process.env.HARNESS_EVENT_CODE_SECRET = "test-event-code-secret-at-least-32-chars-long";
    // 32 base64url bytes (43 chars) — valid reveal key for the seed path.
    process.env.HARNESS_EVENT_CODE_REVEAL_KEY = "a".repeat(43);
    const insertCalls: { sqlText: string; params: unknown[] }[] = [];
    const query = vi.fn(async (sqlText: string, params?: unknown[]) => {
      if (sqlText.includes("SELECT id FROM participant_event_access")) {
        return [];
      }
      if (sqlText.includes("INSERT INTO participant_event_access")) {
        insertCalls.push({ sqlText, params: params ?? [] });
        return undefined;
      }
      if (sqlText.includes("FROM participant_event_access") && sqlText.includes("code_hash")) {
        return [];
      }
      return undefined;
    });

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const mod = await import("./participant-event-access-repository");
    const repository = new mod.NeonParticipantEventAccessRepository();

    await repository.getActiveAccess("instance-a");

    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].sqlText).toContain("ON CONFLICT (id) DO NOTHING");
    const [id, instanceId] = insertCalls[0].params as [string, string];
    expect(id).toMatch(/^pea-instance-a-[0-9a-f-]{36}$/);
    expect(instanceId).toBe("instance-a");

    delete process.env.HARNESS_EVENT_CODE;
    delete process.env.HARNESS_EVENT_CODE_SECRET;
  });
});
