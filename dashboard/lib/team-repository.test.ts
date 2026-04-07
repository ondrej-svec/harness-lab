import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { TeamRecord } from "./runtime-contracts";

const team: TeamRecord = {
  id: "t1",
  name: "Team One",
  city: "Studio A",
  members: ["Anna"],
  repoUrl: "https://example.com/repo",
  projectBriefId: "brief-1",
  checkpoint: "Ready",
};

describe("team-repository", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-team-"));
    process.env.HARNESS_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./team-repository");
    mod.setTeamRepositoryForTests(null);
  });

  it("lists, upserts, and replaces teams in file mode", async () => {
    const { FileTeamRepository } = await import("./team-repository");
    const repository = new FileTeamRepository();

    await expect(repository.listTeams("instance-a")).resolves.toEqual([]);
    await repository.upsertTeam("instance-a", team);
    await expect(repository.listTeams("instance-a")).resolves.toEqual([team]);

    await repository.upsertTeam("instance-a", { ...team, checkpoint: "Updated" });
    await expect(repository.listTeams("instance-a")).resolves.toEqual([{ ...team, checkpoint: "Updated" }]);

    await repository.replaceTeams("instance-a", [{ ...team, id: "t2", name: "Team Two" }]);
    await expect(repository.listTeams("instance-a")).resolves.toEqual([
      expect.objectContaining({ id: "t2", name: "Team Two" }),
    ]);
  });

  it("writes neon team queries and repository selection", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([{ payload: team }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    vi.doMock("./runtime-storage", () => ({
      getRuntimeStorageMode: () => "neon",
    }));
    vi.doMock("./neon-db", () => ({
      getNeonSql: () => ({ query }),
    }));

    const mod = await import("./team-repository");
    const repository = mod.getTeamRepository();

    await expect(repository.listTeams("instance-a")).resolves.toEqual([team]);
    await repository.upsertTeam("instance-a", team);
    await repository.replaceTeams("instance-a", [team]);

    expect(query).toHaveBeenCalled();
  });
});
