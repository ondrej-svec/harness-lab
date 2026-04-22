import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setCheckpointRepositoryForTests, type CheckpointRepository } from "./checkpoint-repository";
import { setMonitoringSnapshotRepositoryForTests, type MonitoringSnapshotRepository } from "./monitoring-snapshot-repository";
import { setPollResponseRepositoryForTests, type PollResponseRepository } from "./poll-response-repository";
import { setTeamRepositoryForTests, type TeamRepository } from "./team-repository";
import type { CheckpointRecord, PollResponseRecord, TeamRecord } from "./runtime-contracts";
import { seedWorkshopState, type WorkshopState } from "./workshop-data";
import { setWorkshopStateRepositoryForTests, type WorkshopStateRepository } from "./workshop-state-repository";
import {
  getActivePollSummary,
  getWorkshopState,
  setCurrentAgendaItem,
  setLiveRoomScene,
  submitActivePollResponse,
} from "./workshop-store";

const instanceId = "sample-studio-a";

class CountingWorkshopStateRepository implements WorkshopStateRepository {
  getStateCalls = 0;

  constructor(private state: WorkshopState) {}

  async getState() {
    this.getStateCalls += 1;
    return structuredClone(this.state);
  }

  async saveState(_instanceId: string, state: WorkshopState) {
    this.state = structuredClone(state);
  }
}

class CountingPollResponseRepository implements PollResponseRepository {
  listCalls = 0;
  upsertCalls = 0;
  private readonly items: PollResponseRecord[] = [];

  async list(_instanceId: string, pollId?: string) {
    this.listCalls += 1;
    return structuredClone(this.items.filter((item) => !pollId || item.pollId === pollId));
  }

  async upsert(_instanceId: string, response: PollResponseRecord) {
    this.upsertCalls += 1;
    const index = this.items.findIndex(
      (item) => item.pollId === response.pollId && item.sessionKey === response.sessionKey,
    );
    if (index >= 0) {
      this.items[index] = structuredClone(response);
    } else {
      this.items.push(structuredClone(response));
    }
  }

  async deletePoll() {
    this.items.length = 0;
  }
}

class EmptyCheckpointRepository implements CheckpointRepository {
  async listCheckpoints() {
    return [] as CheckpointRecord[];
  }
  async appendCheckpoint() {}
  async replaceCheckpoints() {}
}

class EmptyTeamRepository implements TeamRepository {
  async listTeams() {
    return [] as TeamRecord[];
  }
  async saveTeam() {}
  async replaceTeams() {}
  async deleteTeam() {}
}

class EmptyMonitoringRepository implements MonitoringSnapshotRepository {
  async getSnapshots() {
    return [];
  }
  async replaceSnapshots() {}
  async deleteOlderThan() {}
}

describe("submitActivePollResponse — hot-path query count", () => {
  let stateRepo: CountingWorkshopStateRepository;
  let pollRepo: CountingPollResponseRepository;

  beforeEach(async () => {
    const stateWithPoll: WorkshopState = structuredClone(seedWorkshopState);
    stateWithPoll.agenda = stateWithPoll.agenda.map((item) =>
      item.id !== "talk"
        ? item
        : {
            ...item,
            participantMoments: item.participantMoments.map((moment) =>
              moment.id !== "talk-note-one-gap"
                ? moment
                : {
                    ...moment,
                    poll: {
                      id: "repo-signal-check",
                      prompt: "Which repo signal needs work first?",
                      options: [
                        { id: "map", label: "Map" },
                        { id: "boundaries", label: "Boundaries" },
                        { id: "verification", label: "Verification" },
                      ],
                    },
                  },
            ),
          },
    );
    stateRepo = new CountingWorkshopStateRepository(stateWithPoll);
    pollRepo = new CountingPollResponseRepository();
    setWorkshopStateRepositoryForTests(stateRepo);
    setPollResponseRepositoryForTests(pollRepo);
    setCheckpointRepositoryForTests(new EmptyCheckpointRepository());
    setTeamRepositoryForTests(new EmptyTeamRepository());
    setMonitoringSnapshotRepositoryForTests(new EmptyMonitoringRepository());

    await setCurrentAgendaItem("talk", instanceId);
    await setLiveRoomScene("talk", "talk-how-to-build", instanceId);
  });

  afterEach(() => {
    setWorkshopStateRepositoryForTests(null);
    setPollResponseRepositoryForTests(null);
    setCheckpointRepositoryForTests(null);
    setTeamRepositoryForTests(null);
    setMonitoringSnapshotRepositoryForTests(null);
  });

  it("skips state + list refetch when the caller passes them in", async () => {
    const state = await getWorkshopState(instanceId);
    const responses = await pollRepo.list(instanceId, "repo-signal-check");

    const baselineStateCalls = stateRepo.getStateCalls;
    const baselineListCalls = pollRepo.listCalls;

    const summary = await submitActivePollResponse(
      {
        sessionKey: "participant-1",
        participantId: "participant-1",
        teamId: "t1",
        optionId: "boundaries",
      },
      instanceId,
      { state, currentResponses: responses },
    );

    expect(summary?.totalResponses).toBe(1);
    expect(stateRepo.getStateCalls - baselineStateCalls).toBe(0);
    expect(pollRepo.listCalls - baselineListCalls).toBe(0);
    expect(pollRepo.upsertCalls).toBe(1);
  });

  it("falls back to fetching state + list when no pre-fetched data is passed", async () => {
    const baselineStateCalls = stateRepo.getStateCalls;
    const baselineListCalls = pollRepo.listCalls;

    await submitActivePollResponse(
      {
        sessionKey: "participant-1",
        participantId: "participant-1",
        teamId: "t1",
        optionId: "verification",
      },
      instanceId,
    );

    expect(stateRepo.getStateCalls - baselineStateCalls).toBe(1);
    expect(pollRepo.listCalls - baselineListCalls).toBe(1);
    expect(pollRepo.upsertCalls).toBe(1);
  });

  it("recomputes summary in memory after upsert (no post-mutation list call)", async () => {
    const state = await getWorkshopState(instanceId);
    const responses = await pollRepo.list(instanceId, "repo-signal-check");

    const preListCalls = pollRepo.listCalls;
    const summary = await submitActivePollResponse(
      {
        sessionKey: "participant-1",
        participantId: "participant-1",
        teamId: "t1",
        optionId: "boundaries",
      },
      instanceId,
      { state, currentResponses: responses },
    );

    expect(pollRepo.listCalls - preListCalls).toBe(0);
    expect(summary?.options.find((option) => option.id === "boundaries")?.count).toBe(1);
  });

  it("replaces an existing vote from the same sessionKey when recomputing summary", async () => {
    const state = await getWorkshopState(instanceId);
    let responses = await pollRepo.list(instanceId, "repo-signal-check");

    await submitActivePollResponse(
      {
        sessionKey: "participant-1",
        participantId: "participant-1",
        teamId: "t1",
        optionId: "boundaries",
      },
      instanceId,
      { state, currentResponses: responses },
    );
    responses = await pollRepo.list(instanceId, "repo-signal-check");

    const summary = await submitActivePollResponse(
      {
        sessionKey: "participant-1",
        participantId: "participant-1",
        teamId: "t1",
        optionId: "map",
      },
      instanceId,
      { state, currentResponses: responses },
    );

    expect(summary?.totalResponses).toBe(1);
    expect(summary?.options.find((option) => option.id === "map")?.count).toBe(1);
    expect(summary?.options.find((option) => option.id === "boundaries")?.count).toBe(0);
  });

  it("matches getActivePollSummary after recompute", async () => {
    const state = await getWorkshopState(instanceId);
    const responses = await pollRepo.list(instanceId, "repo-signal-check");

    const inMemorySummary = await submitActivePollResponse(
      {
        sessionKey: "participant-1",
        participantId: "participant-1",
        teamId: "t1",
        optionId: "boundaries",
      },
      instanceId,
      { state, currentResponses: responses },
    );

    const roundTripped = await getActivePollSummary(instanceId);
    expect(inMemorySummary).toEqual(roundTripped);
  });
});
