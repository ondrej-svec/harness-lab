import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { AuditLogRecord } from "./runtime-contracts";

const record: AuditLogRecord = {
  id: "audit-1",
  instanceId: "instance-a",
  actorKind: "facilitator",
  action: "checkpoint_saved",
  result: "success",
  createdAt: "2026-04-07T12:00:00.000Z",
  metadata: { teamId: "t1" },
};

describe("audit-log-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;
  const originalAuditPath = process.env.HARNESS_AUDIT_LOG_PATH;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-audit-log-"));
    process.env.HARNESS_DATA_DIR = tempDir;
    delete process.env.HARNESS_AUDIT_LOG_PATH;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    process.env.HARNESS_AUDIT_LOG_PATH = originalAuditPath;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./audit-log-repository");
    mod.setAuditLogRepositoryForTests(null);
  });

  it("appends and prunes audit records in file mode", async () => {
    const { FileAuditLogRepository } = await import("./audit-log-repository");
    const repository = new FileAuditLogRepository();

    await repository.append(record);
    await repository.append({
      ...record,
      id: "audit-2",
      createdAt: "2026-04-06T12:00:00.000Z",
    });
    await repository.deleteOlderThan("instance-a", "2026-04-07T00:00:00.000Z");

    const logPath = path.join(tempDir, "audit-log.json");
    const stored = JSON.parse(await readFile(logPath, "utf8")) as { items: AuditLogRecord[] };
    expect(stored.items).toEqual([record]);
  });

  it("writes neon audit queries", async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonAuditLogRepository, getAuditLogRepository } = await import("./audit-log-repository");
    const repository = new NeonAuditLogRepository();

    await repository.append(record);
    await repository.deleteOlderThan("instance-a", "2026-04-07T00:00:00.000Z");
    expect(getAuditLogRepository()).toBeInstanceOf(NeonAuditLogRepository);
    expect(query).toHaveBeenCalled();
  });
});
