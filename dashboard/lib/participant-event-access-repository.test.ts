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

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-participant-access-"));
    process.env.HARNESS_DATA_DIR = tempDir;
    delete process.env.HARNESS_EVENT_CODE;
    delete process.env.HARNESS_EVENT_CODE_EXPIRES_AT;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    process.env.HARNESS_EVENT_CODE = originalEventCode;
    process.env.HARNESS_EVENT_CODE_EXPIRES_AT = originalEventCodeExpiresAt;
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

  it("maps neon access rows and exposes preview data", async () => {
    const row = {
      id: "pea-1",
      instance_id: "instance-a",
      version: 1,
      code_hash: "hash-1",
      expires_at: "2026-04-20T12:00:00.000Z",
      revoked_at: null,
    };
    const query = vi.fn(async (sqlText: string) => {
      if (sqlText.includes("SELECT id FROM participant_event_access")) {
        return [];
      }
      if (sqlText.includes("SELECT id, instance_id, version, code_hash, expires_at, revoked_at")) {
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
      if (sqlText.includes("SELECT id, instance_id, version, code_hash, expires_at, revoked_at")) {
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
});
