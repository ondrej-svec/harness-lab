import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createWorkshopStateFromTemplate,
  seedWorkshopState,
  type MonitoringSnapshot,
  type SprintUpdate,
  type Team,
  type WorkshopState,
} from "@/lib/workshop-data";

const dataDir = path.join(process.cwd(), "data");
const statePath = path.join(dataDir, "workshop-state.json");

async function ensureStateFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(statePath, "utf8");
  } catch {
    await writeFile(statePath, JSON.stringify(seedWorkshopState, null, 2));
  }
}

export async function getWorkshopState(): Promise<WorkshopState> {
  await ensureStateFile();
  const raw = await readFile(statePath, "utf8");
  return JSON.parse(raw) as WorkshopState;
}

export async function updateWorkshopState(
  updater: (state: WorkshopState) => WorkshopState,
): Promise<WorkshopState> {
  const current = await getWorkshopState();
  const next = updater(current);
  await writeFile(statePath, JSON.stringify(next, null, 2));
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
  await mkdir(dataDir, { recursive: true });
  await writeFile(statePath, JSON.stringify(next, null, 2));
  return next;
}
