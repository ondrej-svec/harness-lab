import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

describe("instance-grant-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-instance-grants-"));
    process.env.HARNESS_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./instance-grant-repository");
    mod.setInstanceGrantRepositoryForTests(null);
  });

  it("manages sample grants in file mode", async () => {
    const { FileInstanceGrantRepository } = await import("./instance-grant-repository");
    const repository = new FileInstanceGrantRepository();

    await expect(repository.countActiveGrants("instance-a")).resolves.toBe(1);
    await expect(repository.getActiveGrantByNeonUserId("instance-a", "file-mode-sample")).resolves.toMatchObject({
      role: "owner",
    });
    await expect(repository.listActiveGrants("instance-a")).resolves.toEqual([
      expect.objectContaining({ userName: null, userEmail: null }),
    ]);

    const created = await repository.createGrant("instance-a", "user-1", "operator");
    expect(created).toMatchObject({ neonUserId: "user-1", role: "operator" });
    await expect(repository.countActiveGrants("instance-a")).resolves.toBe(2);

    await repository.revokeGrant(created.id);
    await expect(repository.countActiveGrants("instance-a")).resolves.toBe(2);
  });

  it("maps neon grant rows and issues create/revoke queries", async () => {
    const activeGrantRow = {
      id: "grant-1",
      instance_id: "instance-a",
      neon_user_id: "user-1",
      role: "owner",
      granted_at: "2026-04-07T12:00:00.000Z",
      revoked_at: null,
    };
    const listGrantRow = {
      ...activeGrantRow,
      user_name: "Owner",
      user_email: "owner@example.com",
    };
    const query = vi.fn(async (sqlText: string) => {
      if (sqlText.includes("INSERT INTO workshop_instances")) {
        return undefined;
      }
      if (sqlText.includes("SELECT id, instance_id, neon_user_id, role, granted_at, revoked_at") && sqlText.includes("LIMIT 1")) {
        return [activeGrantRow];
      }
      if (sqlText.includes("SELECT count(*)::int AS cnt")) {
        return [{ cnt: 1 }];
      }
      if (sqlText.includes("LEFT JOIN neon_auth.\"user\"")) {
        return [listGrantRow];
      }
      return undefined;
    });

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const { NeonInstanceGrantRepository } = await import("./instance-grant-repository");
    const repository = new NeonInstanceGrantRepository();

    await expect(repository.getActiveGrantByNeonUserId("instance-a", "user-1")).resolves.toMatchObject({
      role: "owner",
    });
    await expect(repository.createGrant("instance-a", "user-1", "owner")).resolves.toMatchObject({
      instanceId: "instance-a",
      neonUserId: "user-1",
      role: "owner",
    });
    await expect(repository.countActiveGrants("instance-a")).resolves.toBe(1);
    await expect(repository.listActiveGrants("instance-a")).resolves.toEqual([
      expect.objectContaining({ userName: "Owner", userEmail: "owner@example.com" }),
    ]);
    await repository.revokeGrant("grant-1");

    expect(query).toHaveBeenCalled();
  });
});
