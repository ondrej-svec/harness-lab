import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import type { TeamCompositionHistoryEvent } from "./runtime-contracts";

function makeEvent(
  overrides: Partial<TeamCompositionHistoryEvent> = {},
): TeamCompositionHistoryEvent {
  return {
    id: "evt-1",
    instanceId: "instance-a",
    eventType: "assigned",
    participantId: "p1",
    fromTeamId: null,
    toTeamId: "t1",
    capturedAt: "2026-04-19T10:00:00.000Z",
    actorKind: "facilitator",
    note: null,
    rotationId: null,
    ...overrides,
  };
}

describe("team-composition-history-repository — file mode", () => {
  let tempDir: string;
  const originalDataDir = process.env.HARNESS_DATA_DIR;

  beforeEach(async () => {
    vi.resetModules();
    tempDir = await mkdtemp(path.join(tmpdir(), "harness-team-history-"));
    process.env.HARNESS_DATA_DIR = tempDir;
  });

  afterEach(async () => {
    process.env.HARNESS_DATA_DIR = originalDataDir;
    await rm(tempDir, { recursive: true, force: true });
    const mod = await import("./team-composition-history-repository");
    mod.setTeamCompositionHistoryRepositoryForTests(null);
  });

  it("returns an empty list when no history exists yet", async () => {
    const { FileTeamCompositionHistoryRepository } = await import(
      "./team-composition-history-repository"
    );
    const repo = new FileTeamCompositionHistoryRepository();

    await expect(repo.list("instance-a")).resolves.toEqual([]);
  });

  it("persists events in instance scope and returns them in chronological order", async () => {
    const { FileTeamCompositionHistoryRepository } = await import(
      "./team-composition-history-repository"
    );
    const repo = new FileTeamCompositionHistoryRepository();

    await repo.append(
      "instance-a",
      makeEvent({
        id: "evt-later",
        capturedAt: "2026-04-19T11:00:00.000Z",
        eventType: "moved",
        fromTeamId: "t1",
        toTeamId: "t2",
      }),
    );
    await repo.append(
      "instance-a",
      makeEvent({
        id: "evt-earlier",
        capturedAt: "2026-04-19T09:00:00.000Z",
        eventType: "rotation_marker",
        participantId: null,
        fromTeamId: null,
        toTeamId: null,
        rotationId: "rotation-1",
      }),
    );

    await expect(repo.list("instance-a")).resolves.toEqual([
      expect.objectContaining({ id: "evt-earlier" }),
      expect.objectContaining({ id: "evt-later" }),
    ]);

    const raw = await readFile(
      path.join(tempDir, "instance-a", "team-composition-history.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as { version: number; events: TeamCompositionHistoryEvent[] };
    expect(parsed.version).toBe(1);
    expect(parsed.events).toHaveLength(2);
  });

  it("serializes overlapping appends so file-mode history does not lose events", async () => {
    vi.resetModules();
    const actualFs = await vi.importActual<typeof import("node:fs/promises")>(
      "node:fs/promises"
    );
    const historyPath = path.join(tempDir, "instance-a", "team-composition-history.json");
    await actualFs.mkdir(path.dirname(historyPath), { recursive: true });
    await actualFs.writeFile(historyPath, '{\n  "version": 1,\n  "events": []\n}\n');

    let releaseFirstRename: () => void = () => {};
    const firstRenameStarted = new Promise<void>((resolve) => {
      releaseFirstRename = resolve;
    });
    let tempWriteCount = 0;
    let resolveSecondTempWrite!: () => void;
    const secondTempWriteSeen = new Promise<void>((resolve) => {
      resolveSecondTempWrite = resolve;
    });
    let renameCalls = 0;

    vi.doMock("node:fs/promises", () => ({
      ...actualFs,
      writeFile: vi.fn(async (target, data, options) => {
        if (
          typeof target === "string" &&
          target.startsWith(`${historyPath}.`) &&
          target.endsWith(".tmp")
        ) {
          tempWriteCount += 1;
          if (tempWriteCount === 2) {
            resolveSecondTempWrite();
          }
        }

        return actualFs.writeFile(target, data, options);
      }),
      rename: vi.fn(async (from, to) => {
        if (typeof to === "string" && to === historyPath) {
          renameCalls += 1;
          if (renameCalls === 1) {
            await firstRenameStarted;
          }
        }

        return actualFs.rename(from, to);
      }),
    }));

    const { FileTeamCompositionHistoryRepository } = await import(
      "./team-composition-history-repository"
    );
    const repo = new FileTeamCompositionHistoryRepository();

    const firstAppend = repo.append("instance-a", makeEvent({ id: "evt-1" }));
    await vi.waitFor(() => {
      expect(renameCalls).toBe(1);
    });

    const secondAppend = repo.append(
      "instance-a",
      makeEvent({
        id: "evt-2",
        participantId: "p2",
        toTeamId: "t2",
        capturedAt: "2026-04-19T10:01:00.000Z",
      }),
    );

    await expect(
      Promise.race([
        secondTempWriteSeen.then(() => "overlapped"),
        new Promise<"serialized">((resolve) => {
          setTimeout(() => resolve("serialized"), 50);
        }),
      ]),
    ).resolves.toBe("serialized");

    releaseFirstRename();
    await Promise.all([firstAppend, secondAppend]);

    await expect(repo.list("instance-a")).resolves.toEqual([
      expect.objectContaining({ id: "evt-1" }),
      expect.objectContaining({ id: "evt-2" }),
    ]);

    const raw = await readFile(historyPath, "utf8");
    const parsed = JSON.parse(raw) as { version: number; events: TeamCompositionHistoryEvent[] };
    expect(parsed.events.map((event) => event.id)).toEqual(["evt-1", "evt-2"]);
  });
});

describe("team-composition-history-repository — neon mode", () => {
  it("issues the expected queries for list and append", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: "evt-1",
          instance_id: "instance-a",
          event_type: "assigned",
          participant_id: "p1",
          from_team_id: null,
          to_team_id: "t1",
          captured_at: "2026-04-19T10:00:00.000Z",
          actor_kind: "facilitator",
          note: null,
          rotation_id: null,
        },
      ])
      .mockResolvedValueOnce(undefined);

    vi.resetModules();
    vi.doMock("./runtime-storage", () => ({ getRuntimeStorageMode: () => "neon" }));
    vi.doMock("./neon-db", () => ({ getNeonSql: () => ({ query }) }));

    const mod = await import("./team-composition-history-repository");
    const repo = mod.getTeamCompositionHistoryRepository();

    await expect(repo.list("instance-a")).resolves.toEqual([
      expect.objectContaining({ id: "evt-1", eventType: "assigned" }),
    ]);

    await repo.append("instance-a", makeEvent());

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0][0]).toMatch(/FROM team_composition_history/);
    expect(query.mock.calls[1][0]).toMatch(/INSERT INTO team_composition_history/);

    mod.setTeamCompositionHistoryRepositoryForTests(null);
  });
});
