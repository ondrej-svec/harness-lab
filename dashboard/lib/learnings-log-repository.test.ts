import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { LearningsLogEntry, RotationSignal } from "./runtime-contracts";

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

function makeEntry(overrides: Partial<LearningsLogEntry> = {}): LearningsLogEntry {
  return {
    cohort: "2026-Q2",
    instanceId: "instance-a",
    loggedAt: "2026-04-09T10:00:00.000Z",
    signal: makeSignal(),
    ...overrides,
  };
}

describe("learnings-log-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;
  const originalLogPath = process.env.HARNESS_LEARNINGS_LOG_PATH;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-learnings-log-"));
    process.env.HARNESS_DATA_DIR = tempDir;
    delete process.env.HARNESS_LEARNINGS_LOG_PATH;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    if (originalLogPath) {
      process.env.HARNESS_LEARNINGS_LOG_PATH = originalLogPath;
    } else {
      delete process.env.HARNESS_LEARNINGS_LOG_PATH;
    }
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./learnings-log-repository");
    mod.setLearningsLogRepositoryForTests(null);
  });

  it("writes a newline-terminated JSON line for each entry", async () => {
    const { FileLearningsLogRepository } = await import("./learnings-log-repository");
    const repository = new FileLearningsLogRepository();

    await repository.append(makeEntry({ cohort: "2026-Q2", signal: makeSignal({ id: "sig-1" }) }));
    await repository.append(makeEntry({ cohort: "2026-Q2", signal: makeSignal({ id: "sig-2" }) }));

    const logPath = path.join(tempDir, "learnings-log.jsonl");
    const raw = await readFile(logPath, "utf8");
    const lines = raw.split("\n").filter((line) => line.length > 0);
    expect(lines).toHaveLength(2);

    const first = JSON.parse(lines[0]!);
    const second = JSON.parse(lines[1]!);
    expect(first.signal.id).toBe("sig-1");
    expect(second.signal.id).toBe("sig-2");
  });

  it("lives outside any instance directory so it survives instance teardown", async () => {
    const { FileLearningsLogRepository } = await import("./learnings-log-repository");
    const repository = new FileLearningsLogRepository();

    await repository.append(makeEntry({ instanceId: "instance-a" }));

    const instancePath = path.join(tempDir, "instance-a");
    const logPath = path.join(tempDir, "learnings-log.jsonl");

    // Simulate instance teardown.
    await rm(instancePath, { recursive: true, force: true });

    const raw = await readFile(logPath, "utf8");
    expect(raw.length).toBeGreaterThan(0);
  });

  it("respects HARNESS_LEARNINGS_LOG_PATH override", async () => {
    const overridePath = path.join(tempDir, "nested", "dir", "custom-learnings.jsonl");
    process.env.HARNESS_LEARNINGS_LOG_PATH = overridePath;

    const { FileLearningsLogRepository } = await import("./learnings-log-repository");
    const repository = new FileLearningsLogRepository();
    await repository.append(makeEntry({ signal: makeSignal({ id: "sig-override" }) }));

    const raw = await readFile(overridePath, "utf8");
    expect(raw).toContain("sig-override");
  });

  it("selects the Neon implementation when storage mode is neon", async () => {
    const query = vi.fn().mockResolvedValue(undefined);

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonLearningsLogRepository, getLearningsLogRepository } = await import(
      "./learnings-log-repository"
    );

    expect(getLearningsLogRepository()).toBeInstanceOf(NeonLearningsLogRepository);

    const repository = new NeonLearningsLogRepository();
    await repository.append(makeEntry());
    expect(query).toHaveBeenCalled();
    expect(query.mock.calls[0]?.[0]).toContain("INSERT INTO learnings_log");
  });
});
