import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { RotationSignal } from "./runtime-contracts";

function makeSignal(overrides: Partial<RotationSignal> = {}): RotationSignal {
  return {
    id: "sig-1",
    instanceId: "instance-a",
    capturedAt: "2026-04-09T10:00:00.000Z",
    capturedBy: "facilitator",
    tags: ["agents_md_helped"],
    freeText: "Receiving team found AGENTS.md in 40 seconds.",
    ...overrides,
  };
}

describe("rotation-signal-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-rotation-signals-"));
    process.env.HARNESS_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./rotation-signal-repository");
    mod.setRotationSignalRepositoryForTests(null);
  });

  it("returns an empty list for an instance with no captured signals", async () => {
    const { FileRotationSignalRepository } = await import("./rotation-signal-repository");
    const repository = new FileRotationSignalRepository();

    await expect(repository.list("instance-a")).resolves.toEqual([]);
  });

  it("persists signals to an instance-scoped file and reads them back in order", async () => {
    const { FileRotationSignalRepository } = await import("./rotation-signal-repository");
    const repository = new FileRotationSignalRepository();

    const first = makeSignal({ id: "sig-1", capturedAt: "2026-04-09T10:00:00.000Z" });
    const second = makeSignal({ id: "sig-2", capturedAt: "2026-04-09T10:05:00.000Z" });
    const third = makeSignal({ id: "sig-3", capturedAt: "2026-04-09T10:02:00.000Z" });

    await repository.append("instance-a", first);
    await repository.append("instance-a", second);
    await repository.append("instance-a", third);

    const stored = await repository.list("instance-a");
    expect(stored.map((signal) => signal.id)).toEqual(["sig-1", "sig-3", "sig-2"]);
  });

  it("scopes signals per instance and does not cross-contaminate", async () => {
    const { FileRotationSignalRepository } = await import("./rotation-signal-repository");
    const repository = new FileRotationSignalRepository();

    await repository.append("instance-a", makeSignal({ id: "sig-a", instanceId: "instance-a" }));
    await repository.append("instance-b", makeSignal({ id: "sig-b", instanceId: "instance-b" }));

    await expect(repository.list("instance-a")).resolves.toEqual([
      expect.objectContaining({ id: "sig-a" }),
    ]);
    await expect(repository.list("instance-b")).resolves.toEqual([
      expect.objectContaining({ id: "sig-b" }),
    ]);
  });

  it("writes the instance-scoped file under the data directory", async () => {
    const { FileRotationSignalRepository } = await import("./rotation-signal-repository");
    const repository = new FileRotationSignalRepository();

    await repository.append("instance-a", makeSignal({ id: "sig-x" }));

    const expectedPath = path.join(tempDir, "instance-a", "rotation-signals.json");
    const raw = await readFile(expectedPath, "utf8");
    const parsed = JSON.parse(raw) as { version: number; signals: RotationSignal[] };
    expect(parsed.version).toBe(1);
    expect(parsed.signals).toHaveLength(1);
    expect(parsed.signals[0]?.id).toBe("sig-x");
  });

  it("selects the Neon implementation when storage mode is neon", async () => {
    const query = vi.fn().mockResolvedValue(undefined);

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonRotationSignalRepository, getRotationSignalRepository } = await import(
      "./rotation-signal-repository"
    );

    expect(getRotationSignalRepository()).toBeInstanceOf(NeonRotationSignalRepository);

    const repository = new NeonRotationSignalRepository();
    await repository.append("instance-a", makeSignal());
    expect(query).toHaveBeenCalled();
    const firstCall = query.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain("INSERT INTO rotation_signals");
  });
});
