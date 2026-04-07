import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { RedeemAttemptRecord } from "./runtime-contracts";

const attempts: RedeemAttemptRecord[] = [
  { instanceId: "instance-a", fingerprint: "fp-1", result: "failure", createdAt: "2026-04-07T10:00:00.000Z" },
  { instanceId: "instance-a", fingerprint: "fp-1", result: "success", createdAt: "2026-04-07T11:00:00.000Z" },
  { instanceId: "instance-a", fingerprint: "fp-1", result: "failure", createdAt: "2026-04-07T12:00:00.000Z" },
];

describe("redeem-attempt-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-redeem-attempts-"));
    process.env.HARNESS_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./redeem-attempt-repository");
    mod.setRedeemAttemptRepositoryForTests(null);
  });

  it("counts and prunes attempts in file mode", async () => {
    const { FileRedeemAttemptRepository } = await import("./redeem-attempt-repository");
    const repository = new FileRedeemAttemptRepository();

    for (const attempt of attempts) {
      await repository.appendAttempt(attempt);
    }

    await expect(repository.countRecentFailures("instance-a", "fp-1", "2026-04-07T09:30:00.000Z")).resolves.toBe(2);
    await repository.deleteOlderThan("instance-a", "2026-04-07T11:30:00.000Z");
    await expect(repository.countRecentFailures("instance-a", "fp-1", "2026-04-07T09:30:00.000Z")).resolves.toBe(1);
  });

  it("writes neon redeem-attempt queries", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([{ count: 2 }])
      .mockResolvedValue(undefined)
      .mockResolvedValue(undefined);

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonRedeemAttemptRepository, getRedeemAttemptRepository } = await import("./redeem-attempt-repository");
    const repository = new NeonRedeemAttemptRepository();

    await expect(repository.countRecentFailures("instance-a", "fp-1", "2026-04-07T09:30:00.000Z")).resolves.toBe(2);
    await repository.appendAttempt(attempts[0]);
    await repository.deleteOlderThan("instance-a", "2026-04-07T11:30:00.000Z");
    expect(getRedeemAttemptRepository()).toBeInstanceOf(NeonRedeemAttemptRepository);
    expect(query).toHaveBeenCalled();
  });
});
