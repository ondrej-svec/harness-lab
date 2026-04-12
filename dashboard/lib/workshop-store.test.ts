import { setAuditLogRepositoryForTests, type AuditLogRepository } from "./audit-log-repository";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import blueprintAgenda from "./generated/agenda-cs.json";
import { setCheckpointRepositoryForTests, type CheckpointRepository } from "./checkpoint-repository";
import { setEventAccessRepositoryForTests, type EventAccessRepository } from "./event-access-repository";
import { setInstanceArchiveRepositoryForTests, type InstanceArchiveRepository } from "./instance-archive-repository";
import {
  setMonitoringSnapshotRepositoryForTests,
  type MonitoringSnapshotRepository,
} from "./monitoring-snapshot-repository";
import {
  setParticipantEventAccessRepositoryForTests,
  type ParticipantEventAccessRepository,
} from "./participant-event-access-repository";
import { setRedeemAttemptRepositoryForTests, type RedeemAttemptRepository } from "./redeem-attempt-repository";
import { setRotationSignalRepositoryForTests } from "./rotation-signal-repository";
import { setLearningsLogRepositoryForTests } from "./learnings-log-repository";
import { setTeamRepositoryForTests, type TeamRepository } from "./team-repository";
import { sampleWorkshopInstances, seedWorkshopState, type WorkshopState } from "./workshop-data";
import type {
  AuditLogRecord,
  InstanceArchiveRecord,
  LearningsLogEntry,
  LearningsLogRepository,
  ParticipantEventAccessRecord,
  ParticipantSessionRecord,
  RedeemAttemptRecord,
  RotationSignal,
  RotationSignalRepository,
  WorkshopInstanceRepository,
} from "./runtime-contracts";
import { setWorkshopInstanceRepositoryForTests } from "./workshop-instance-repository";
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "./workshop-state-repository";
import {
  addAgendaItem,
  addPresenterScene,
  addSprintUpdate,
  applyRuntimeRetentionPolicy,
  captureRotationSignal,
  createWorkshopInstance,
  createWorkshopArchive,
  completeChallenge,
  getWorkshopState,
  getWorkshopInstances,
  getLatestWorkshopArchive,
  listRotationSignals,
  moveAgendaItem,
  movePresenterScene,
  removeAgendaItem,
  removePresenterScene,
  removeWorkshopInstance,
  resetWorkshopState,
  setDefaultPresenterScene,
  setPresenterSceneEnabled,
  setCurrentAgendaItem,
  setRotationReveal,
  updateAgendaItem,
  updatePresenterScene,
  appendCheckIn,
  upsertTeam,
} from "./workshop-store";

class MemoryWorkshopStateRepository implements WorkshopStateRepository {
  constructor(private state: WorkshopState) {}

  async getState(instanceId: string) {
    void instanceId;
    return structuredClone(this.state);
  }

  async saveState(_instanceId: string, state: WorkshopState) {
    this.state = structuredClone(state);
  }
}

class MemoryCheckpointRepository implements CheckpointRepository {
  constructor(private items: WorkshopState["sprintUpdates"] = []) {}

  async listCheckpoints(instanceId: string) {
    void instanceId;
    return structuredClone(this.items);
  }

  async appendCheckpoint(_instanceId: string, checkpoint: WorkshopState["sprintUpdates"][number]) {
    this.items = [structuredClone(checkpoint), ...this.items].slice(0, 12);
  }

  async replaceCheckpoints(_instanceId: string, checkpoints: WorkshopState["sprintUpdates"]) {
    this.items = structuredClone(checkpoints);
  }
}

class MemoryTeamRepository implements TeamRepository {
  constructor(private items: WorkshopState["teams"] = []) {}

  async listTeams(instanceId: string) {
    void instanceId;
    return structuredClone(this.items);
  }

  async upsertTeam(instanceId: string, team: WorkshopState["teams"][number]) {
    void instanceId;
    this.items = this.items.some((item) => item.id === team.id)
      ? this.items.map((item) => (item.id === team.id ? structuredClone(team) : item))
      : [...this.items, structuredClone(team)];
  }

  async replaceTeams(instanceId: string, teams: WorkshopState["teams"]) {
    void instanceId;
    this.items = structuredClone(teams);
  }
}

class MemoryMonitoringSnapshotRepository implements MonitoringSnapshotRepository {
  constructor(private items: WorkshopState["monitoring"] = []) {}

  async getSnapshots(instanceId: string) {
    void instanceId;
    return structuredClone(this.items);
  }

  async replaceSnapshots(_instanceId: string, snapshots: WorkshopState["monitoring"]) {
    this.items = structuredClone(snapshots);
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    void instanceId;
    void olderThan;
  }
}

class MemoryEventAccessRepository implements EventAccessRepository {
  constructor(private sessions: ParticipantSessionRecord[] = []) {}

  async listSessions(instanceId: string) {
    return structuredClone(this.sessions.filter((session) => session.instanceId === instanceId));
  }

  async findSession(instanceId: string, tokenHash: string) {
    return structuredClone(
      this.sessions.find((session) => session.instanceId === instanceId && session.tokenHash === tokenHash) ?? null,
    );
  }

  async findSessionByTokenHash(tokenHash: string) {
    return structuredClone(this.sessions.find((session) => session.tokenHash === tokenHash) ?? null);
  }

  async upsertSession(instanceId: string, session: ParticipantSessionRecord) {
    this.sessions = this.sessions.some((item) => item.instanceId === instanceId && item.tokenHash === session.tokenHash)
      ? this.sessions.map((item) =>
          item.instanceId === instanceId && item.tokenHash === session.tokenHash ? structuredClone(session) : item,
        )
      : [...this.sessions, structuredClone({ ...session, instanceId })];
  }

  async deleteSession(instanceId: string, tokenHash: string) {
    this.sessions = this.sessions.filter((item) => !(item.instanceId === instanceId && item.tokenHash === tokenHash));
  }

  async deleteExpiredSessions(instanceId: string, now: string) {
    const nowMs = Date.parse(now);
    this.sessions = this.sessions.filter(
      (item) =>
        item.instanceId !== instanceId ||
        (Date.parse(item.expiresAt) > nowMs && Date.parse(item.absoluteExpiresAt) > nowMs),
    );
  }
}

class MemoryParticipantEventAccessRepository implements ParticipantEventAccessRepository {
  constructor(private access: ParticipantEventAccessRecord | null) {}

  async getActiveAccess(instanceId: string) {
    if (!this.access || this.access.instanceId !== instanceId) {
      return null;
    }

    return structuredClone(this.access);
  }

  async saveAccess(instanceId: string, access: ParticipantEventAccessRecord) {
    this.access = structuredClone({ ...access, instanceId });
  }

  async listAllActiveAccess() {
    return this.access ? [structuredClone(this.access)] : [];
  }
}

class MemoryArchiveRepository implements InstanceArchiveRepository {
  constructor(private items: InstanceArchiveRecord[] = []) {}

  async createArchive(record: InstanceArchiveRecord) {
    this.items = [structuredClone(record), ...this.items];
  }

  async getLatestArchive(instanceId: string) {
    return structuredClone(this.items.find((item) => item.instanceId === instanceId) ?? null);
  }

  async deleteExpiredArchives(now: string) {
    const nowMs = Date.parse(now);
    this.items = this.items.filter((item) => !item.retentionUntil || Date.parse(item.retentionUntil) >= nowMs);
  }
}

class MemoryRedeemAttemptRepository implements RedeemAttemptRepository {
  constructor(private items: RedeemAttemptRecord[] = []) {}

  async countRecentFailures(instanceId: string, fingerprint: string, since: string) {
    const sinceMs = Date.parse(since);
    return this.items.filter(
      (item) =>
        item.instanceId === instanceId &&
        item.fingerprint === fingerprint &&
        item.result === "failure" &&
        Date.parse(item.createdAt) >= sinceMs,
    ).length;
  }

  async appendAttempt(attempt: RedeemAttemptRecord) {
    this.items.push(structuredClone(attempt));
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    const olderThanMs = Date.parse(olderThan);
    this.items = this.items.filter(
      (item) => item.instanceId !== instanceId || Date.parse(item.createdAt) >= olderThanMs,
    );
  }
}

class MemoryAuditLogRepository implements AuditLogRepository {
  records: AuditLogRecord[] = [];

  async append(record: AuditLogRecord) {
    this.records.push(structuredClone(record));
  }

  async deleteOlderThan(instanceId: string, olderThan: string) {
    const olderThanMs = Date.parse(olderThan);
    this.records = this.records.filter(
      (record) => record.instanceId !== instanceId || Date.parse(record.createdAt) >= olderThanMs,
    );
  }
}

class MemoryRotationSignalRepository implements RotationSignalRepository {
  private readonly store = new Map<string, RotationSignal[]>();

  async list(instanceId: string) {
    return structuredClone(this.store.get(instanceId) ?? []);
  }

  async append(instanceId: string, signal: RotationSignal) {
    const existing = this.store.get(instanceId) ?? [];
    this.store.set(instanceId, [...existing, structuredClone(signal)]);
  }
}

class MemoryLearningsLogRepository implements LearningsLogRepository {
  entries: LearningsLogEntry[] = [];

  async append(entry: LearningsLogEntry) {
    this.entries.push(structuredClone(entry));
  }
}

class MemoryWorkshopInstanceRepository implements WorkshopInstanceRepository {
  constructor(private items = structuredClone(sampleWorkshopInstances)) {}

  async getDefaultInstanceId() {
    return this.items.find((item) => !item.removedAt && item.status !== "removed")?.id ?? this.items[0]?.id ?? "sample-studio-a";
  }

  async getInstance(instanceId: string) {
    return structuredClone(this.items.find((item) => item.id === instanceId) ?? null);
  }

  async listInstances(options?: { includeRemoved?: boolean }) {
    const items = options?.includeRemoved ? this.items : this.items.filter((item) => !item.removedAt && item.status !== "removed");
    return structuredClone(items);
  }

  async createInstance(instance: typeof sampleWorkshopInstances[number]) {
    this.items.push(structuredClone(instance));
    return instance;
  }

  async updateInstance(instanceId: string, instance: typeof sampleWorkshopInstances[number]) {
    this.items = this.items.map((item) => (item.id === instanceId ? structuredClone(instance) : item));
    return instance;
  }

  async removeInstance(instanceId: string, removedAt: string) {
    this.items = this.items.map((item) =>
      item.id === instanceId ? { ...item, status: "removed", removedAt } : item,
    );
  }
}

describe("workshop-store", () => {
  let repository: MemoryWorkshopStateRepository;
  let checkpointRepository: MemoryCheckpointRepository;
  let teamRepository: MemoryTeamRepository;
  let monitoringRepository: MemoryMonitoringSnapshotRepository;
  let eventAccessRepository: MemoryEventAccessRepository;
  let participantEventAccessRepository: MemoryParticipantEventAccessRepository;
  let archiveRepository: MemoryArchiveRepository;
  let redeemAttemptRepository: MemoryRedeemAttemptRepository;
  let auditLogRepository: MemoryAuditLogRepository;
  let instanceRepository: MemoryWorkshopInstanceRepository;
  let rotationSignalRepository: MemoryRotationSignalRepository;
  let learningsLogRepository: MemoryLearningsLogRepository;

  beforeEach(() => {
    repository = new MemoryWorkshopStateRepository(structuredClone(seedWorkshopState));
    checkpointRepository = new MemoryCheckpointRepository();
    teamRepository = new MemoryTeamRepository();
    monitoringRepository = new MemoryMonitoringSnapshotRepository();
    eventAccessRepository = new MemoryEventAccessRepository([
      {
        tokenHash: "live-token",
        instanceId: "sample-studio-a",
        createdAt: "2026-04-06T09:00:00.000Z",
        lastValidatedAt: "2026-04-06T09:30:00.000Z",
        expiresAt: "2026-04-06T18:00:00.000Z",
        absoluteExpiresAt: "2026-04-06T22:00:00.000Z",
      },
    ]);
    participantEventAccessRepository = new MemoryParticipantEventAccessRepository({
      id: "pea-sample-studio-a",
      instanceId: "sample-studio-a",
      version: 3,
      codeHash: "stored-hash",
      expiresAt: "2026-04-20T12:00:00.000Z",
      revokedAt: null,
      sampleCode: "lantern8-context4-handoff2",
    });
    archiveRepository = new MemoryArchiveRepository();
    instanceRepository = new MemoryWorkshopInstanceRepository();
    redeemAttemptRepository = new MemoryRedeemAttemptRepository([
      {
        instanceId: "sample-studio-a",
        fingerprint: "fp-1",
        result: "failure",
        createdAt: "2026-03-20T12:00:00.000Z",
      },
    ]);
    auditLogRepository = new MemoryAuditLogRepository();
    rotationSignalRepository = new MemoryRotationSignalRepository();
    learningsLogRepository = new MemoryLearningsLogRepository();
    setWorkshopStateRepositoryForTests(repository);
    setCheckpointRepositoryForTests(checkpointRepository);
    setTeamRepositoryForTests(teamRepository);
    setMonitoringSnapshotRepositoryForTests(monitoringRepository);
    setEventAccessRepositoryForTests(eventAccessRepository);
    setParticipantEventAccessRepositoryForTests(participantEventAccessRepository);
    setInstanceArchiveRepositoryForTests(archiveRepository);
    setRedeemAttemptRepositoryForTests(redeemAttemptRepository);
    setAuditLogRepositoryForTests(auditLogRepository);
    setWorkshopInstanceRepositoryForTests(instanceRepository);
    setRotationSignalRepositoryForTests(rotationSignalRepository);
    setLearningsLogRepositoryForTests(learningsLogRepository);
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
    setCheckpointRepositoryForTests(null);
    setTeamRepositoryForTests(null);
    setMonitoringSnapshotRepositoryForTests(null);
    setEventAccessRepositoryForTests(null);
    setParticipantEventAccessRepositoryForTests(null);
    setInstanceArchiveRepositoryForTests(null);
    setRedeemAttemptRepositoryForTests(null);
    setAuditLogRepositoryForTests(null);
    setWorkshopInstanceRepositoryForTests(null);
    setRotationSignalRepositoryForTests(null);
    setLearningsLogRepositoryForTests(null);
  });

  it("moves the agenda and updates the phase label", async () => {
    const state = await setCurrentAgendaItem("rotation");

    expect(state.workshopMeta.currentPhaseLabel).toBe("Rotace týmů");
    expect(state.agenda.find((item) => item.id === "rotation")?.status).toBe("current");
    expect(state.agenda.find((item) => item.id === "opening")?.status).toBe("done");
  });

  it("supports local agenda editing, insertion, reordering, and removal", async () => {
    let state = await updateAgendaItem("talk", {
      title: "Context demo",
      time: "09:45",
      description: "Lokální úprava pro tuto instanci.",
    });
    expect(state.agenda.find((item) => item.id === "talk")).toMatchObject({
      title: "Context demo",
      time: "09:45",
    });

    state = await addAgendaItem({
      title: "Coffee break",
      time: "11:20",
      description: "Lokální blok navíc.",
      afterItemId: "build-1",
    });
    const customItem = state.agenda.find((item) => item.title === "Coffee break");
    expect(customItem).toMatchObject({
      kind: "custom",
      sourceBlueprintPhaseId: null,
    });

    state = await moveAgendaItem(customItem!.id, "up");
    expect(state.agenda.find((item) => item.id === customItem!.id)?.order).toBeLessThan(
      state.agenda.find((item) => item.id === "rotation")!.order,
    );

    state = await removeAgendaItem(customItem!.id);
    expect(state.agenda.find((item) => item.id === customItem!.id)).toBeUndefined();
    expect(state.agenda.filter((item) => item.status === "current")).toHaveLength(1);
  });

  it("supports presenter-scene creation, editing, ordering, default selection, and removal", async () => {
    let state = await addPresenterScene("talk", {
      label: "Custom prompt",
      sceneType: "custom",
      title: "Custom room cue",
      body: "Lokální room-facing prompt pro tuto instanci.",
    });

    const customScene = state.agenda
      .find((item) => item.id === "talk")
      ?.presenterScenes.find((scene) => scene.label === "Custom prompt");
    expect(customScene).toMatchObject({
      kind: "custom",
      sourceBlueprintSceneId: null,
    });
    const initialOrder = customScene?.order ?? 0;

    state = await updatePresenterScene("talk", customScene!.id, {
      label: "Adjusted prompt",
      sceneType: "checkpoint",
      title: "Adjusted room cue",
      body: "Evidence-first prompt.",
      ctaLabel: "Napište další safe move",
      ctaHref: null,
    });
    expect(
      state.agenda.find((item) => item.id === "talk")?.presenterScenes.find((scene) => scene.id === customScene!.id),
    ).toMatchObject({
      label: "Adjusted prompt",
      sceneType: "checkpoint",
    });

    state = await movePresenterScene("talk", customScene!.id, "up");
    expect(
      state.agenda.find((item) => item.id === "talk")?.presenterScenes.find((scene) => scene.id === customScene!.id)?.order,
    ).toBe(initialOrder - 1);

    state = await setDefaultPresenterScene("talk", customScene!.id);
    expect(state.agenda.find((item) => item.id === "talk")?.defaultPresenterSceneId).toBe(customScene!.id);

    state = await setPresenterSceneEnabled("talk", customScene!.id, false);
    expect(
      state.agenda.find((item) => item.id === "talk")?.presenterScenes.find((scene) => scene.id === customScene!.id)?.enabled,
    ).toBe(false);
    expect(state.agenda.find((item) => item.id === "talk")?.defaultPresenterSceneId).not.toBe(customScene!.id);

    state = await removePresenterScene("talk", customScene!.id);
    expect(
      state.agenda.find((item) => item.id === "talk")?.presenterScenes.find((scene) => scene.id === customScene!.id),
    ).toBeUndefined();
  });

  it("rejects stale presenter-scene mutation targets", async () => {
    await expect(
      addPresenterScene("missing", {
        label: "Custom prompt",
        sceneType: "custom",
        title: "Custom room cue",
        body: "Lokální room-facing prompt pro tuto instanci.",
      }),
    ).rejects.toMatchObject({ code: "agenda_item_not_found" });

    await expect(setDefaultPresenterScene("talk", "missing-scene")).rejects.toMatchObject({
      code: "presenter_scene_not_found",
    });
  });

  it("normalizes legacy agenda state without presenter scenes on read", async () => {
    repository = new MemoryWorkshopStateRepository({
      ...structuredClone(seedWorkshopState),
      agenda: seedWorkshopState.agenda.map((item) => {
        // Simulate legacy state by stripping fields added in later schema revisions.
        const legacyItem = { ...item } as Partial<typeof item>;
        delete legacyItem.defaultPresenterSceneId;
        delete legacyItem.presenterScenes;
        delete legacyItem.order;
        delete legacyItem.sourceBlueprintPhaseId;
        delete legacyItem.kind;
        return legacyItem as typeof item;
      }),
    } as WorkshopState);
    setWorkshopStateRepositoryForTests(repository);

    const state = await getWorkshopState();
    const talkItem = state.agenda.find((item) => item.id === "talk");

    expect(talkItem?.presenterScenes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "talk-micro-exercise", sceneType: "demo" }),
        expect.objectContaining({ id: "talk-framing", sceneType: "briefing" }),
        expect.objectContaining({ id: "talk-participant-view", sceneType: "participant-view" }),
      ]),
    );
    expect(talkItem?.defaultPresenterSceneId).toBe("talk-micro-exercise");
    expect(state.agenda.every((item) => typeof item.order === "number")).toBe(true);
  });

  it("projects English blueprint content for legacy English workshop state on read", async () => {
    repository = new MemoryWorkshopStateRepository({
      ...structuredClone(seedWorkshopState),
      workshopMeta: {
        ...structuredClone(seedWorkshopState.workshopMeta),
        contentLang: "en",
        subtitle: "Workshop operating system pro práci s AI agenty",
        adminHint: "Repo používá ukázková data.",
      },
    });
    setWorkshopStateRepositoryForTests(repository);

    const state = await getWorkshopState();

    // Workshop meta and agenda are localized on read
    expect(state.workshopMeta.subtitle).toBe("Workshop operating system for working with AI agents");
    expect(state.agenda[0]?.title).toBe("Opening and orientation");
    // Briefs and challenges are preserved as stored (set at reset time, not re-derived on read)
    expect(state.briefs[0]?.problem).toContain("Vývojáři ztrácejí čas");
    expect(state.challenges[0]?.title).toBe("Vytvořte AGENTS.md jako mapu");
    // Ticker and setup paths are still localized from seed on read
    expect(state.setupPaths[0]?.summary).toContain("fastest path");
    expect(state.ticker[0]?.label).toBe("Team 3 just added its first custom skill.");
  });

  it("updates facilitator-controlled team and check-in state", async () => {
    await appendCheckIn("t1", { phaseId: "opening", content: "Checkpoint po facilitaci", writtenBy: null });
    let state = await getWorkshopState();
    const t1Latest = state.teams.find((team) => team.id === "t1")?.checkIns.at(-1);
    expect(t1Latest?.content).toBe("Checkpoint po facilitaci");

    await upsertTeam({
      id: "t9",
      name: "Tým 9",
      city: "Studio E",
      members: ["Iva", "Milan"],
      repoUrl: "https://github.com/example/new-team",
      projectBriefId: "standup-bot",
      checkIns: [],
    });

    state = await getWorkshopState();
    expect(state.teams.find((team) => team.id === "t9")?.name).toBe("Tým 9");
    const teams = await teamRepository.listTeams("sample-studio-a");
    const t1 = teams.find((team) => team.id === "t1");
    expect(t1?.checkIns.at(-1)?.content).toBe("Checkpoint po facilitaci");
    expect(teams.some((team) => team.id === "t9" && team.name === "Tým 9")).toBe(true);
  });

  it("appendCheckIn preserves existing entries and adds timestamp", async () => {
    await appendCheckIn("t1", { phaseId: "opening", content: "První", writtenBy: "Anna" });
    await appendCheckIn("t1", { phaseId: "intermezzo-1", content: "Druhý", writtenBy: null });
    const teams = await teamRepository.listTeams("sample-studio-a");
    const team = teams.find((t) => t.id === "t1");
    expect(team?.checkIns).toHaveLength(2);
    expect(team?.checkIns[0]).toMatchObject({ phaseId: "opening", content: "První", writtenBy: "Anna" });
    expect(team?.checkIns[1]).toMatchObject({ phaseId: "intermezzo-1", content: "Druhý", writtenBy: null });
    expect(team?.checkIns[0].writtenAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(team?.checkIns[1].writtenAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("appendCheckIn throws when teamId is unknown", async () => {
    await expect(
      appendCheckIn("t-missing", { phaseId: "opening", content: "x", writtenBy: null }),
    ).rejects.toThrow(/Team not found/);
  });

  it("seedWorkshopState teams start with empty checkIns", async () => {
    const state = await getWorkshopState();
    for (const team of state.teams) {
      expect(team.checkIns).toEqual([]);
    }
  });

  it("captures a rotation signal to both instance-local and learnings log", async () => {
    const signal = await captureRotationSignal({
      freeText: "Receiving team found AGENTS.md in 40 seconds.",
      tags: ["agents_md_helped", " plan_out_of_date "],
      teamId: "t2",
      artifactPaths: ["AGENTS.md", "docs/plan.md"],
    });

    expect(signal.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(signal.instanceId).toBe("sample-studio-a");
    expect(signal.capturedBy).toBe("facilitator");
    expect(signal.tags).toEqual(["agents_md_helped", "plan_out_of_date"]);
    expect(signal.freeText).toBe("Receiving team found AGENTS.md in 40 seconds.");
    expect(signal.teamId).toBe("t2");
    expect(signal.artifactPaths).toEqual(["AGENTS.md", "docs/plan.md"]);

    await expect(listRotationSignals()).resolves.toEqual([expect.objectContaining({ id: signal.id })]);

    expect(learningsLogRepository.entries).toHaveLength(1);
    const [entry] = learningsLogRepository.entries;
    expect(entry?.instanceId).toBe("sample-studio-a");
    expect(entry?.signal.id).toBe(signal.id);
    expect(entry?.loggedAt).toBe(signal.capturedAt);
    expect(entry?.cohort).toMatch(/^\d{4}-Q[1-4]$/);
  });

  it("rejects rotation signals with empty freeText and does not log them", async () => {
    await expect(captureRotationSignal({ freeText: "   " })).rejects.toThrow(/freeText is required/);
    expect(learningsLogRepository.entries).toHaveLength(0);
  });

  it("records challenge completion, sprint updates, and rotation reveal", async () => {
    await completeChallenge("review-skill", "t2");
    await addSprintUpdate({
      id: "u-new",
      teamId: "t2",
      text: "Přidali jsme test jako tracer bullet.",
      at: "11:23",
    });
    const state = await setRotationReveal(true);

    expect(state.rotation.revealed).toBe(true);
    expect(state.challenges.find((item) => item.id === "review-skill")?.completedBy).toContain("t2");
    expect(state.sprintUpdates[0]?.id).toBe("u-new");
    await expect(checkpointRepository.listCheckpoints("sample-studio-a")).resolves.toMatchObject([{ id: "u-new" }]);
  });

  it("resets state from a sample template", async () => {
    const state = await resetWorkshopState("blueprint-default");

    expect(state.workshopId).toBe("sample-studio-a");
    expect(state.workshopMeta.city).toBe("Studio A");
    expect(state.workshopMeta.contentLang).toBe("cs");
    expect(state.rotation.scenario).toBe("20-participants");
    expect(state.agenda.map((item) => item.id)).toEqual(blueprintAgenda.phases.map((phase) => phase.id));
    expect(state.agenda[0]?.title).toBe(blueprintAgenda.phases[0]?.label);
    expect(state.teams).toEqual([]);
    expect(state.monitoring).toEqual([]);
    expect(state.sprintUpdates).toEqual([]);
    expect(state.teams).toEqual([]);
    await expect(teamRepository.listTeams("sample-studio-a")).resolves.toEqual([]);
    await expect(checkpointRepository.listCheckpoints("sample-studio-a")).resolves.toEqual([]);
    await expect(monitoringRepository.getSnapshots("sample-studio-a")).resolves.toEqual([]);
    await expect(eventAccessRepository.listSessions("sample-studio-a")).resolves.toEqual([]);
    await expect(getLatestWorkshopArchive()).resolves.toMatchObject({
      payload: {
        reason: "reset",
        participantEventAccessVersion: 3,
        participantSessions: [{ tokenHash: "live-token" }],
      },
    });
  });

  it("creates and soft-removes workshop instances", async () => {
    const created = await createWorkshopInstance({
      id: "client-hackathon-2026-05",
      templateId: "blueprint-default",
      contentLang: "en",
      city: "Client HQ",
      dateRange: "12. května 2026",
    });

    expect(created).toMatchObject({
      id: "client-hackathon-2026-05",
      templateId: "blueprint-default",
      workshopMeta: { city: "Client HQ", contentLang: "en" },
    });
    await expect(getWorkshopInstances()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "client-hackathon-2026-05" })]),
    );
    await expect(getWorkshopState("client-hackathon-2026-05")).resolves.toMatchObject({
      workshopId: "client-hackathon-2026-05",
      workshopMeta: { city: "Client HQ", contentLang: "en" },
    });

    await removeWorkshopInstance("client-hackathon-2026-05");
    await expect(getWorkshopInstances()).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "client-hackathon-2026-05" })]),
    );
    await expect(instanceRepository.listInstances({ includeRemoved: true })).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "client-hackathon-2026-05", status: "removed" })]),
    );
  });

  it("does not overwrite an existing instance when create is called with a duplicate id", async () => {
    await teamRepository.replaceTeams("sample-studio-a", [
      {
        id: "t-existing",
        name: "Existing team",
        city: "Studio A",
        members: ["Anna"],
        repoUrl: "https://github.com/example/existing-team",
        projectBriefId: "standup-bot",
        checkIns: [],
      },
    ]);

    const created = await createWorkshopInstance({
      id: "sample-studio-a",
      templateId: "blueprint-default",
      city: "Should not overwrite",
    });

    expect(created).toMatchObject({
      id: "sample-studio-a",
      templateId: sampleWorkshopInstances[0]?.templateId,
      workshopMeta: sampleWorkshopInstances[0]?.workshopMeta,
    });
    await expect(teamRepository.listTeams("sample-studio-a")).resolves.toMatchObject([{ id: "t-existing" }]);
  });

  it("projects normalized checkpoint and monitoring data into the workshop-shaped read model", async () => {
    await teamRepository.replaceTeams("sample-studio-a", [
      {
        id: "t4",
        name: "Tým 4 runtime",
        city: "Lab D",
        members: ["Daniel", "Hana"],
        repoUrl: "https://github.com/example/runtime-team",
        projectBriefId: "metrics-dashboard",
        checkIns: [],
      },
    ]);
    await checkpointRepository.replaceCheckpoints("sample-studio-a", [
      {
        id: "u-projected",
        teamId: "t4",
        text: "Checkpoint je z dedikovaného repository.",
        at: "13:40",
      },
    ]);
    await monitoringRepository.replaceSnapshots("sample-studio-a", [
      {
        teamId: "t4",
        agentsFile: true,
        skillsCount: 3,
        commitsLast30Min: 8,
        testsVisible: 2,
      },
    ]);

    const state = await getWorkshopState();
    expect(state.teams).toMatchObject([{ id: "t4", name: "Tým 4 runtime" }]);
    expect(state.sprintUpdates).toMatchObject([{ id: "u-projected" }]);
    expect(state.monitoring).toMatchObject([{ teamId: "t4", skillsCount: 3 }]);
  });

  it("creates a manual archive with the normalized runtime payload", async () => {
    await checkpointRepository.replaceCheckpoints("sample-studio-a", [
      {
        id: "u-archive",
        teamId: "t1",
        text: "Archivovaný checkpoint",
        at: "14:10",
      },
    ]);
    await monitoringRepository.replaceSnapshots("sample-studio-a", [
      {
        teamId: "t1",
        agentsFile: true,
        skillsCount: 4,
        commitsLast30Min: 3,
        testsVisible: 2,
      },
    ]);

    const archive = await createWorkshopArchive({ notes: "Po workshopu" });

    expect(archive.payload.reason).toBe("manual");
    expect(archive.payload.checkpoints).toMatchObject([{ id: "u-archive" }]);
    expect(archive.payload.monitoringSnapshots).toMatchObject([{ teamId: "t1" }]);
    expect(archive.payload.participantSessions).toMatchObject([{ tokenHash: "live-token" }]);
    expect(auditLogRepository.records.at(-1)).toMatchObject({
      action: "instance_archive_created",
      result: "success",
    });
  });

  it("applies retention cleanup to stale runtime records", async () => {
    archiveRepository = new MemoryArchiveRepository([
      {
        id: "archive-expired",
        instanceId: "sample-studio-a",
        archiveStatus: "ready",
        storageUri: null,
        createdAt: "2026-03-01T12:00:00.000Z",
        retentionUntil: "2026-03-15T12:00:00.000Z",
        notes: null,
        payload: {
          archivedAt: "2026-03-01T12:00:00.000Z",
          reason: "manual",
          workshopState: structuredClone(seedWorkshopState),
          checkpoints: [],
          monitoringSnapshots: [],
          participantEventAccessVersion: null,
          participantSessions: [],
        },
      },
    ]);
    setInstanceArchiveRepositoryForTests(archiveRepository);

    await applyRuntimeRetentionPolicy();

    await expect(archiveRepository.getLatestArchive("sample-studio-a")).resolves.toBeNull();
    expect(redeemAttemptRepository["items"]).toEqual([]);
  });
});
