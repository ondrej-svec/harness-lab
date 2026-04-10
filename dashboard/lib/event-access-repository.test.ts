import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { ParticipantSessionRecord } from "./runtime-contracts";

const session: ParticipantSessionRecord = {
  tokenHash: "token-1",
  instanceId: "instance-a",
  createdAt: "2026-04-07T09:00:00.000Z",
  expiresAt: "2026-04-07T12:00:00.000Z",
  lastValidatedAt: "2026-04-07T09:30:00.000Z",
  absoluteExpiresAt: "2026-04-07T18:00:00.000Z",
};

describe("event-access-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-event-access-"));
    process.env.HARNESS_DATA_DIR = tempDir;
    delete process.env.HARNESS_EVENT_ACCESS_PATH;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    delete process.env.HARNESS_EVENT_ACCESS_PATH;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./event-access-repository");
    mod.setEventAccessRepositoryForTests(null);
  });

  it("manages participant sessions in file mode", async () => {
    const { FileEventAccessRepository } = await import("./event-access-repository");
    const repository = new FileEventAccessRepository();

    await expect(repository.listSessions("instance-a")).resolves.toEqual([]);
    await repository.upsertSession("instance-a", session);
    await expect(repository.findSession("instance-a", "token-1")).resolves.toEqual(session);

    await repository.upsertSession("instance-a", { ...session, expiresAt: "2026-04-07T13:00:00.000Z" });
    await expect(repository.listSessions("instance-a")).resolves.toEqual([
      expect.objectContaining({ expiresAt: "2026-04-07T13:00:00.000Z" }),
    ]);

    await repository.deleteExpiredSessions("instance-a", "2026-04-07T19:00:00.000Z");
    await expect(repository.listSessions("instance-a")).resolves.toEqual([]);

    await repository.upsertSession("instance-a", session);
    await repository.deleteSession("instance-a", "token-1");
    await expect(repository.listSessions("instance-a")).resolves.toEqual([]);
  });

  it("finds sessions by token hash across instances in file mode", async () => {
    const { FileEventAccessRepository } = await import("./event-access-repository");
    const repository = new FileEventAccessRepository();

    const sessionA = { ...session, tokenHash: "token-a", instanceId: "instance-a" };
    const sessionB = { ...session, tokenHash: "token-b", instanceId: "instance-b" };

    await repository.upsertSession("instance-a", sessionA);
    await repository.upsertSession("instance-b", sessionB);

    const foundA = await repository.findSessionByTokenHash("token-a");
    expect(foundA).toEqual(sessionA);

    const foundB = await repository.findSessionByTokenHash("token-b");
    expect(foundB).toEqual(sessionB);

    await expect(repository.findSessionByTokenHash("nonexistent")).resolves.toBeNull();
  });

  it("maps neon session rows and issues the expected writes", async () => {
    const neonRow = {
      token_hash: "token-1",
      instance_id: "instance-a",
      created_at: session.createdAt,
      expires_at: session.expiresAt,
      last_validated_at: session.lastValidatedAt,
      absolute_expires_at: session.absoluteExpiresAt,
    };
    const query = vi
      .fn()
      .mockResolvedValueOnce([neonRow])
      .mockResolvedValueOnce([neonRow])
      .mockResolvedValueOnce([neonRow])
      .mockResolvedValue(undefined);

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonEventAccessRepository } = await import("./event-access-repository");
    const repository = new NeonEventAccessRepository();

    await expect(repository.listSessions("instance-a")).resolves.toEqual([session]);
    await expect(repository.findSession("instance-a", "token-1")).resolves.toEqual(session);
    await expect(repository.findSessionByTokenHash("token-1")).resolves.toEqual(session);
    await repository.upsertSession("instance-a", session);
    await repository.deleteSession("instance-a", "token-1");
    await repository.deleteExpiredSessions("instance-a", "2026-04-07T19:00:00.000Z");

    expect(query).toHaveBeenCalled();
  });
});
