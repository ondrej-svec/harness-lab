import {
  createWorkshopStateFromTemplate,
  type MonitoringSnapshot,
  type SprintUpdate,
  type Team,
  type WorkshopState,
} from "./workshop-data";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { getWorkshopStateRepository } from "./workshop-state-repository";

export async function getWorkshopState(): Promise<WorkshopState> {
  return getWorkshopStateRepository().getState(getCurrentWorkshopInstanceId());
}

export async function updateWorkshopState(
  updater: (state: WorkshopState) => WorkshopState,
): Promise<WorkshopState> {
  const current = await getWorkshopState();
  const next = updater(current);
  await getWorkshopStateRepository().saveState(getCurrentWorkshopInstanceId(), next);
  return next;
}

export async function setCurrentAgendaItem(itemId: string) {
  return updateWorkshopState((state) => {
    const agenda = state.agenda.map((item) => {
      if (item.id === itemId) {
        return { ...item, status: "current" as const };
      }
      const targetIndex = state.agenda.findIndex((entry) => entry.id === itemId);
      const ownIndex = state.agenda.findIndex((entry) => entry.id === item.id);
      return {
        ...item,
        status: ownIndex < targetIndex ? ("done" as const) : ("upcoming" as const),
      };
    });
    const currentPhaseLabel = agenda.find((item) => item.status === "current")?.title ?? state.workshopMeta.currentPhaseLabel;
    return {
      ...state,
      agenda,
      workshopMeta: { ...state.workshopMeta, currentPhaseLabel },
    };
  });
}

export async function upsertTeam(input: Team) {
  return updateWorkshopState((state) => {
    const existingIndex = state.teams.findIndex((team) => team.id === input.id);
    const teams =
      existingIndex >= 0
        ? state.teams.map((team) => (team.id === input.id ? input : team))
        : [...state.teams, input];
    return { ...state, teams };
  });
}

export async function updateCheckpoint(teamId: string, checkpoint: string) {
  return updateWorkshopState((state) => ({
    ...state,
    teams: state.teams.map((team) => (team.id === teamId ? { ...team, checkpoint } : team)),
  }));
}

export async function completeChallenge(challengeId: string, teamId: string) {
  return updateWorkshopState((state) => ({
    ...state,
    challenges: state.challenges.map((challenge) =>
      challenge.id === challengeId && !challenge.completedBy.includes(teamId)
        ? { ...challenge, completedBy: [...challenge.completedBy, teamId] }
        : challenge,
    ),
  }));
}

export async function setRotationReveal(revealed: boolean) {
  return updateWorkshopState((state) => ({
    ...state,
    rotation: { ...state.rotation, revealed },
  }));
}

export async function addSprintUpdate(update: SprintUpdate) {
  return updateWorkshopState((state) => ({
    ...state,
    sprintUpdates: [update, ...state.sprintUpdates].slice(0, 12),
  }));
}

export async function replaceMonitoring(items: MonitoringSnapshot[]) {
  return updateWorkshopState((state) => ({
    ...state,
    monitoring: items,
  }));
}

export async function resetWorkshopState(templateId: string) {
  const next = createWorkshopStateFromTemplate(templateId);
  await getWorkshopStateRepository().saveState(getCurrentWorkshopInstanceId(), next);
  return next;
}
