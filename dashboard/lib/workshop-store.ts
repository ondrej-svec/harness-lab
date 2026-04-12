import { randomUUID } from "node:crypto";
import { getAuditLogRepository } from "./audit-log-repository";
import {
  createAgendaFromBlueprint,
  createPreparedInstanceTicker,
  createWorkshopInstanceRecord,
  createWorkshopInventory,
  createWorkshopStateFromInstance,
  createWorkshopStateFromTemplate,
  getBlueprintWorkshopMetaCopy,
  type AgendaItem,
  type BlueprintAgenda,
  type FacilitatorRunner,
  type MonitoringSnapshot,
  type PresenterBlock,
  type PresenterChromePreset,
  type PresenterScene,
  type PresenterSceneIntent,
  type PresenterSceneSurface,
  type SprintUpdate,
  type Team,
  type TeamCheckIn,
  type WorkshopContentLanguage,
  type WorkshopInstanceRecord,
  type WorkshopState,
  seedWorkshopState,
  workshopTemplates,
} from "./workshop-data";
import { getCheckpointRepository } from "./checkpoint-repository";
import { getEventAccessRepository } from "./event-access-repository";
import { getCurrentWorkshopInstanceId } from "./instance-context";
import { getInstanceArchiveRepository } from "./instance-archive-repository";
import { getWorkshopInstanceRepository } from "./workshop-instance-repository";
import { getLearningsLogRepository } from "./learnings-log-repository";
import { getMonitoringSnapshotRepository } from "./monitoring-snapshot-repository";
import { getParticipantEventAccessRepository } from "./participant-event-access-repository";
import { getRedeemAttemptRepository } from "./redeem-attempt-repository";
import { getRotationSignalRepository } from "./rotation-signal-repository";
import type { RotationSignal } from "./runtime-contracts";
import { emitRuntimeAlert } from "./runtime-alert";
import { getTeamRepository } from "./team-repository";
import { getWorkshopStateRepository } from "./workshop-state-repository";
import { normalizePresenterScenes } from "./presenter-scenes";
export { isWorkshopStateConflictError } from "./workshop-state-repository";

export class WorkshopStateTargetError extends Error {
  constructor(
    readonly code: "agenda_item_not_found" | "presenter_scene_not_found",
    message: string,
  ) {
    super(message);
    this.name = "WorkshopStateTargetError";
  }
}

export function isWorkshopStateTargetError(error: unknown): error is WorkshopStateTargetError {
  return error instanceof WorkshopStateTargetError;
}

async function getBaseWorkshopState(instanceId = getCurrentWorkshopInstanceId()) {
  return getWorkshopStateRepository().getState(instanceId);
}

const monitoringRetentionDays = 14;
const auditRetentionDays = 30;
const redeemAttemptRetentionDays = 7;
const archiveRetentionDays = 30;

function normalizeStringArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback;
}

function normalizeBlocks(value: unknown, fallback: PresenterBlock[] = []) {
  return Array.isArray(value) ? (value as PresenterBlock[]) : fallback;
}

function resolveStoredContentLanguage(value: unknown): WorkshopContentLanguage {
  return value === "en" ? "en" : "cs";
}

function deriveSceneIntent(sceneType: PresenterScene["sceneType"]): PresenterSceneIntent {
  switch (sceneType) {
    case "briefing":
      return "framing";
    case "demo":
      return "demo";
    case "participant-view":
      return "walkthrough";
    case "checkpoint":
      return "checkpoint";
    case "reflection":
      return "reflection";
    case "transition":
      return "transition";
    default:
      return "custom";
  }
}

function deriveSceneChromePreset(sceneType: PresenterScene["sceneType"]): PresenterChromePreset {
  switch (sceneType) {
    case "participant-view":
      return "participant";
    case "checkpoint":
      return "checkpoint";
    case "transition":
      return "agenda";
    default:
      return "minimal";
  }
}

function deriveSceneSurface(sceneType: PresenterScene["sceneType"]): PresenterSceneSurface {
  return sceneType === "participant-view" ? "participant" : "room";
}

function buildFallbackPresenterBlocks(scene: {
  sceneType: PresenterScene["sceneType"];
  title: string;
  body: string;
}): PresenterBlock[] {
  if (scene.sceneType === "participant-view") {
    return [
      {
        id: "participant-preview",
        type: "participant-preview",
        body: scene.body,
      },
    ];
  }

  const blocks: PresenterBlock[] = [
    {
      id: "hero",
      type: "hero",
      title: scene.title,
      body: scene.body || undefined,
    },
  ];

  if (scene.body.trim().length > 0) {
    blocks.push({
      id: "body",
      type: "rich-text",
      content: scene.body,
    });
  }

  return blocks;
}

function resolveSceneTitle(label: string, title: string | undefined, blocks?: PresenterBlock[]) {
  if (typeof title === "string" && title.trim().length > 0) {
    return title.trim();
  }

  const heroBlock = blocks?.find((block) => block.type === "hero");
  return heroBlock?.title?.trim() || label.trim();
}

function resolveSceneBody(body: string | undefined, blocks?: PresenterBlock[]) {
  if (typeof body === "string" && body.trim().length > 0) {
    return body.trim();
  }

  const heroBlock = blocks?.find((block) => block.type === "hero");
  if (heroBlock?.body?.trim()) {
    return heroBlock.body.trim();
  }

  const richTextBlock = blocks?.find((block) => block.type === "rich-text");
  if (richTextBlock?.content?.trim()) {
    return richTextBlock.content.trim();
  }

  const bulletList = blocks?.find((block) => block.type === "bullet-list");
  if (bulletList && bulletList.items.length > 0) {
    return bulletList.items.join(" ");
  }

  return "";
}

function subtractDays(date: Date, days: number) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function normalizeAgenda(agenda: AgendaItem[], currentItemId?: string) {
  const sortedAgenda = [...agenda]
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map((item, index) => ({ ...item, order: index + 1 }));
  const fallbackCurrentId = currentItemId ?? sortedAgenda.find((item) => item.status === "current")?.id ?? sortedAgenda[0]?.id;
  const currentIndex = Math.max(sortedAgenda.findIndex((item) => item.id === fallbackCurrentId), 0);

  return sortedAgenda.map((item, index) => ({
    ...item,
    status: index < currentIndex ? ("done" as const) : index === currentIndex ? ("current" as const) : ("upcoming" as const),
  }));
}

function buildRuntimeAgendaRunner(args: {
  goal: string;
  facilitatorPrompts: string[];
  watchFors: string[];
  checkpointQuestions: string[];
  previous?: FacilitatorRunner;
}) {
  const { goal, facilitatorPrompts, watchFors, checkpointQuestions, previous } = args;

  return {
    goal,
    say: previous?.say ?? facilitatorPrompts.slice(0, 3),
    show: previous?.show ?? [],
    do: previous?.do ?? [],
    watch: previous?.watch ?? watchFors.slice(0, 3),
    fallback: previous?.fallback ?? checkpointQuestions.slice(0, 1),
  } satisfies FacilitatorRunner;
}

function resolveCurrentPhaseLabel(agenda: AgendaItem[], currentPhaseLabel: string) {
  return agenda.find((item) => item.status === "current")?.title ?? currentPhaseLabel;
}

function mergeLocalizedAgenda(existingAgenda: AgendaItem[], localizedAgenda: AgendaItem[]) {
  const localizedByPhaseId = new Map(
    localizedAgenda.map((item) => [item.sourceBlueprintPhaseId ?? item.id, item] as const),
  );

  return existingAgenda.map((item) => {
    if (item.kind !== "blueprint") {
      return item;
    }

    const localizedItem = localizedByPhaseId.get(item.sourceBlueprintPhaseId ?? item.id);
    if (!localizedItem) {
      return item;
    }

    const localizedScenesById = new Map(
      localizedItem.presenterScenes.map((scene) => [scene.sourceBlueprintSceneId ?? scene.id, scene] as const),
    );

    const mergedScenes = item.presenterScenes.map((scene) => {
      if (scene.kind !== "blueprint") {
        return scene;
      }

      const localizedScene = localizedScenesById.get(scene.sourceBlueprintSceneId ?? scene.id);
      if (!localizedScene) {
        return scene;
      }

      return {
        ...localizedScene,
        order: scene.order,
        enabled: scene.enabled,
        kind: "blueprint" as const,
        sourceBlueprintSceneId: scene.sourceBlueprintSceneId ?? localizedScene.sourceBlueprintSceneId,
      };
    });

    const existingBlueprintSceneIds = new Set(
      mergedScenes
        .filter((scene) => scene.kind === "blueprint")
        .map((scene) => scene.sourceBlueprintSceneId ?? scene.id),
    );

    const appendedScenes = localizedItem.presenterScenes
      .filter((scene) => !existingBlueprintSceneIds.has(scene.sourceBlueprintSceneId ?? scene.id))
      .map((scene, index) => ({
        ...scene,
        order: mergedScenes.length + index + 1,
      }));

    const normalizedSceneState = normalizePresenterScenes(
      [...mergedScenes, ...appendedScenes],
      item.defaultPresenterSceneId ?? localizedItem.defaultPresenterSceneId,
    );

    return {
      ...item,
      title: localizedItem.title,
      description: localizedItem.description,
      goal: localizedItem.goal,
      roomSummary: localizedItem.roomSummary,
      facilitatorPrompts: [...localizedItem.facilitatorPrompts],
      watchFors: [...localizedItem.watchFors],
      checkpointQuestions: [...localizedItem.checkpointQuestions],
      facilitatorRunner: {
        ...localizedItem.facilitatorRunner,
        say: [...localizedItem.facilitatorRunner.say],
        show: [...localizedItem.facilitatorRunner.show],
        do: [...localizedItem.facilitatorRunner.do],
        watch: [...localizedItem.facilitatorRunner.watch],
        fallback: [...localizedItem.facilitatorRunner.fallback],
      },
      sourceRefs: [...localizedItem.sourceRefs],
      presenterScenes: normalizedSceneState.scenes,
      defaultPresenterSceneId: normalizedSceneState.defaultPresenterSceneId,
    };
  });
}


function projectLocalizedTicker(
  ticker: WorkshopState["ticker"],
  contentLang: WorkshopContentLanguage,
  localizedTicker: WorkshopState["ticker"],
) {
  if (contentLang === "cs") {
    return ticker;
  }

  if (ticker.length === 1 && ticker[0]?.id === "tick-reset") {
    return createPreparedInstanceTicker("", contentLang);
  }

  const defaultTickerIds = new Set(localizedTicker.map((item) => item.id));
  if (ticker.length > 0 && ticker.every((item) => defaultTickerIds.has(item.id))) {
    return localizedTicker.map((item) => ({ ...item }));
  }

  return ticker;
}

function projectLocalizedWorkshopState(state: WorkshopState) {
  const contentLang = resolveStoredContentLanguage(state.workshopMeta.contentLang);
  if (contentLang === "cs") {
    return state;
  }

  const metaCopy = getBlueprintWorkshopMetaCopy(contentLang);
  const currentAgendaItemId = state.agenda.find((item) => item.status === "current")?.id ?? state.agenda[0]?.id;
  const localizedAgenda = mergeLocalizedAgenda(state.agenda, createAgendaFromBlueprint(contentLang, currentAgendaItemId));
  const localizedInventory = createWorkshopInventory(contentLang);

  return {
    ...state,
    agenda: localizedAgenda,
    briefs: state.briefs,
    challenges: state.challenges,
    ticker: projectLocalizedTicker(state.ticker, contentLang, localizedInventory.ticker),
    setupPaths: localizedInventory.setupPaths,
    workshopMeta: {
      ...state.workshopMeta,
      title: metaCopy.title,
      subtitle: metaCopy.subtitle,
      adminHint: metaCopy.adminHint,
      currentPhaseLabel: resolveCurrentPhaseLabel(localizedAgenda, state.workshopMeta.currentPhaseLabel),
    },
  };
}

function normalizeStoredPresenterScene(
  scene: Partial<PresenterScene>,
  fallbackScene: PresenterScene | undefined,
  agendaItemId: string,
  sceneIndex: number,
): PresenterScene {
  const label = scene.label ?? fallbackScene?.label ?? `Scene ${sceneIndex + 1}`;
  const sceneType = scene.sceneType ?? fallbackScene?.sceneType ?? "custom";
  const blocks = normalizeBlocks(scene.blocks, fallbackScene?.blocks ?? []);
  const title = resolveSceneTitle(label, scene.title ?? fallbackScene?.title, blocks);
  const body = resolveSceneBody(scene.body ?? fallbackScene?.body, blocks);

  return {
    id: scene.id ?? fallbackScene?.id ?? `${agendaItemId}-scene-${sceneIndex + 1}`,
    label,
    sceneType,
    surface: scene.surface ?? fallbackScene?.surface ?? deriveSceneSurface(sceneType),
    intent: scene.intent ?? fallbackScene?.intent ?? deriveSceneIntent(sceneType),
    chromePreset: scene.chromePreset ?? fallbackScene?.chromePreset ?? deriveSceneChromePreset(sceneType),
    title,
    body,
    ctaLabel: scene.ctaLabel ?? fallbackScene?.ctaLabel ?? null,
    ctaHref: scene.ctaHref ?? fallbackScene?.ctaHref ?? null,
    facilitatorNotes: normalizeStringArray(scene.facilitatorNotes, fallbackScene?.facilitatorNotes ?? []),
    sourceRefs: Array.isArray(scene.sourceRefs) ? scene.sourceRefs : fallbackScene?.sourceRefs ?? [],
    blocks: blocks.length > 0 ? blocks : buildFallbackPresenterBlocks({ sceneType, title, body }),
    order: scene.order ?? fallbackScene?.order ?? sceneIndex + 1,
    enabled: scene.enabled ?? fallbackScene?.enabled ?? true,
    sourceBlueprintSceneId: scene.sourceBlueprintSceneId ?? fallbackScene?.sourceBlueprintSceneId ?? fallbackScene?.id ?? null,
    kind: scene.kind ?? fallbackScene?.kind ?? (fallbackScene ? "blueprint" : "custom"),
  };
}

function normalizeStoredAgendaItem(item: Partial<AgendaItem>, index: number): AgendaItem {
  const fallbackItem = seedWorkshopState.agenda.find((agendaItem) => agendaItem.id === item.id);
  const rawScenes =
    Array.isArray(item.presenterScenes) && item.presenterScenes.length > 0
      ? item.presenterScenes
      : fallbackItem?.presenterScenes ?? [];
  const normalizedScenes = rawScenes.map((scene, sceneIndex) =>
    normalizeStoredPresenterScene(
      scene,
      fallbackItem?.presenterScenes.find((fallbackScene) => fallbackScene.id === scene.id) ?? fallbackItem?.presenterScenes[sceneIndex],
      item.id ?? fallbackItem?.id ?? `agenda-${index + 1}`,
      sceneIndex,
    ),
  );
  const normalizedSceneState = normalizePresenterScenes(
    normalizedScenes,
    item.defaultPresenterSceneId ?? fallbackItem?.defaultPresenterSceneId ?? null,
  );

  return {
    id: item.id ?? fallbackItem?.id ?? `agenda-${index + 1}`,
    title: item.title ?? fallbackItem?.title ?? `Agenda item ${index + 1}`,
    time: item.time ?? fallbackItem?.time ?? "",
    description: item.description ?? fallbackItem?.description ?? "",
    intent: item.intent ?? fallbackItem?.intent ?? "custom",
    goal: item.goal ?? item.description ?? fallbackItem?.goal ?? fallbackItem?.description ?? "",
    roomSummary: item.roomSummary ?? item.description ?? fallbackItem?.roomSummary ?? fallbackItem?.description ?? "",
    facilitatorPrompts: normalizeStringArray(item.facilitatorPrompts, fallbackItem?.facilitatorPrompts ?? []),
    watchFors: normalizeStringArray(item.watchFors, fallbackItem?.watchFors ?? []),
    checkpointQuestions: normalizeStringArray(item.checkpointQuestions, fallbackItem?.checkpointQuestions ?? []),
    facilitatorRunner: {
      goal:
        typeof item.facilitatorRunner?.goal === "string" && item.facilitatorRunner.goal.trim().length > 0
          ? item.facilitatorRunner.goal
          : fallbackItem?.facilitatorRunner.goal ?? item.goal ?? item.description ?? fallbackItem?.goal ?? fallbackItem?.description ?? "",
      say: normalizeStringArray(item.facilitatorRunner?.say, fallbackItem?.facilitatorRunner.say ?? []),
      show: normalizeStringArray(item.facilitatorRunner?.show, fallbackItem?.facilitatorRunner.show ?? []),
      do: normalizeStringArray(item.facilitatorRunner?.do, fallbackItem?.facilitatorRunner.do ?? []),
      watch: normalizeStringArray(item.facilitatorRunner?.watch, fallbackItem?.facilitatorRunner.watch ?? []),
      fallback: normalizeStringArray(item.facilitatorRunner?.fallback, fallbackItem?.facilitatorRunner.fallback ?? []),
    },
    sourceRefs: Array.isArray(item.sourceRefs) ? item.sourceRefs : fallbackItem?.sourceRefs ?? [],
    order: item.order ?? fallbackItem?.order ?? index + 1,
    sourceBlueprintPhaseId:
      item.sourceBlueprintPhaseId ?? fallbackItem?.sourceBlueprintPhaseId ?? (fallbackItem ? fallbackItem.id : null),
    kind: item.kind ?? fallbackItem?.kind ?? (fallbackItem ? "blueprint" : "custom"),
    status: item.status ?? fallbackItem?.status ?? "upcoming",
    presenterScenes: normalizedSceneState.scenes,
    defaultPresenterSceneId: normalizedSceneState.defaultPresenterSceneId,
  };
}

function normalizeStoredWorkshopState(state: WorkshopState): WorkshopState {
  const agenda = Array.isArray(state.agenda) && state.agenda.length > 0
    ? state.agenda.map((item, index) => normalizeStoredAgendaItem(item, index))
    : seedWorkshopState.agenda.map((item, index) => normalizeStoredAgendaItem(item, index));
  const currentAgendaItemId =
    state.agenda?.find((item) => item.status === "current")?.id ??
    agenda.find((item) => item.status === "current")?.id ??
    agenda[0]?.id;
  const normalizedAgenda = normalizeAgenda(agenda, currentAgendaItemId);

  const normalizedState = {
    ...state,
    version: state.version ?? 1,
    agenda: normalizedAgenda,
    workshopMeta: {
      ...state.workshopMeta,
      contentLang: resolveStoredContentLanguage(state.workshopMeta?.contentLang),
      currentPhaseLabel: resolveCurrentPhaseLabel(normalizedAgenda, state.workshopMeta.currentPhaseLabel),
    },
  };

  return projectLocalizedWorkshopState(normalizedState);
}

function updateAgendaScenes(
  state: WorkshopState,
  agendaItemId: string,
  updater: (item: AgendaItem) => AgendaItem,
) {
  if (!state.agenda.some((item) => item.id === agendaItemId)) {
    throw new WorkshopStateTargetError("agenda_item_not_found", `agenda item '${agendaItemId}' not found`);
  }

  return {
    ...state,
    agenda: state.agenda.map((item) => (item.id === agendaItemId ? updater(item) : item)),
  };
}

function requirePresenterScene(item: AgendaItem, sceneId: string) {
  const scene = item.presenterScenes.find((candidate) => candidate.id === sceneId);
  if (!scene) {
    throw new WorkshopStateTargetError("presenter_scene_not_found", `presenter scene '${sceneId}' not found`);
  }

  return scene;
}

export async function getWorkshopState(instanceId = getCurrentWorkshopInstanceId()): Promise<WorkshopState> {
  const [state, teams, monitoring, sprintUpdates] = await Promise.all([
    getBaseWorkshopState(instanceId),
    getTeamRepository().listTeams(instanceId),
    getMonitoringSnapshotRepository().getSnapshots(instanceId),
    getCheckpointRepository().listCheckpoints(instanceId),
  ]);

  const normalizedState = normalizeStoredWorkshopState(state);

  return {
    ...normalizedState,
    teams: teams.length > 0 ? teams : normalizedState.teams,
    monitoring: monitoring.length > 0 ? monitoring : normalizedState.monitoring,
    sprintUpdates: sprintUpdates.length > 0 ? sprintUpdates : normalizedState.sprintUpdates,
  };
}

export async function updateWorkshopState(
  updater: (state: WorkshopState) => WorkshopState,
  instanceId = getCurrentWorkshopInstanceId(),
): Promise<WorkshopState> {
  const current = normalizeStoredWorkshopState(await getBaseWorkshopState(instanceId));
  const next = normalizeStoredWorkshopState(updater(current));
  const nextVersion = current.version + 1;
  await getWorkshopStateRepository().saveState(instanceId, {
    ...next,
    version: nextVersion,
    monitoring: current.monitoring,
    sprintUpdates: current.sprintUpdates,
  }, {
    expectedVersion: current.version,
  });
  return getWorkshopState(instanceId);
}

export async function setCurrentAgendaItem(itemId: string, instanceId = getCurrentWorkshopInstanceId()) {
  return updateWorkshopState((state) => {
    const agenda = normalizeAgenda(state.agenda, itemId);
    return {
      ...state,
      agenda,
      workshopMeta: { ...state.workshopMeta, currentPhaseLabel: resolveCurrentPhaseLabel(agenda, state.workshopMeta.currentPhaseLabel) },
    };
  }, instanceId);
}

export async function updateAgendaItem(
  itemId: string,
  updates: Partial<Pick<AgendaItem, "title" | "time" | "description" | "goal" | "roomSummary">> & {
    facilitatorPrompts?: string[];
    watchFors?: string[];
    checkpointQuestions?: string[];
    sourceRefs?: AgendaItem["sourceRefs"];
  },
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) => {
    const agenda = normalizeAgenda(
      state.agenda.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...updates,
              facilitatorPrompts: updates.facilitatorPrompts ?? item.facilitatorPrompts,
              watchFors: updates.watchFors ?? item.watchFors,
              checkpointQuestions: updates.checkpointQuestions ?? item.checkpointQuestions,
              facilitatorRunner: buildRuntimeAgendaRunner({
                goal: updates.goal ?? item.goal,
                facilitatorPrompts: updates.facilitatorPrompts ?? item.facilitatorPrompts,
                watchFors: updates.watchFors ?? item.watchFors,
                checkpointQuestions: updates.checkpointQuestions ?? item.checkpointQuestions,
                previous: item.facilitatorRunner,
              }),
              sourceRefs: updates.sourceRefs ?? item.sourceRefs,
            }
          : item,
      ),
      state.agenda.find((item) => item.status === "current")?.id,
    );
    return {
      ...state,
      agenda,
      workshopMeta: { ...state.workshopMeta, currentPhaseLabel: resolveCurrentPhaseLabel(agenda, state.workshopMeta.currentPhaseLabel) },
    };
  }, instanceId);
}

export async function addAgendaItem(
  input: Pick<AgendaItem, "title" | "time" | "description"> & {
    goal?: string;
    roomSummary?: string;
    facilitatorPrompts?: string[];
    watchFors?: string[];
    checkpointQuestions?: string[];
    afterItemId?: string | null;
  },
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) => {
    const afterIndex = input.afterItemId ? state.agenda.findIndex((item) => item.id === input.afterItemId) : state.agenda.length - 1;
    const insertAt = afterIndex >= 0 ? afterIndex + 1 : state.agenda.length;
    const agenda = [...state.agenda];
    agenda.splice(insertAt, 0, {
      id: `custom-${randomUUID()}`,
      title: input.title,
      time: input.time,
      description: input.description,
      intent: "custom",
      goal: input.goal ?? input.description,
      roomSummary: input.roomSummary ?? input.description,
      facilitatorPrompts: input.facilitatorPrompts ?? [],
      watchFors: input.watchFors ?? [],
      checkpointQuestions: input.checkpointQuestions ?? [],
      facilitatorRunner: buildRuntimeAgendaRunner({
        goal: input.goal ?? input.description,
        facilitatorPrompts: input.facilitatorPrompts ?? [],
        watchFors: input.watchFors ?? [],
        checkpointQuestions: input.checkpointQuestions ?? [],
      }),
      sourceRefs: [],
      order: insertAt + 1,
      sourceBlueprintPhaseId: null,
      kind: "custom",
      status: "upcoming",
      defaultPresenterSceneId: null,
      presenterScenes: [],
    });
    const normalizedAgenda = normalizeAgenda(agenda, state.agenda.find((item) => item.status === "current")?.id);
    return {
      ...state,
      agenda: normalizedAgenda,
      workshopMeta: {
        ...state.workshopMeta,
        currentPhaseLabel: resolveCurrentPhaseLabel(normalizedAgenda, state.workshopMeta.currentPhaseLabel),
      },
    };
  }, instanceId);
}

export async function removeAgendaItem(itemId: string, instanceId = getCurrentWorkshopInstanceId()) {
  return updateWorkshopState((state) => {
    const remaining = state.agenda.filter((item) => item.id !== itemId);
    const normalizedAgenda = normalizeAgenda(
      remaining.length > 0 ? remaining : state.agenda.slice(0, 1),
      state.agenda.find((item) => item.id !== itemId && item.status === "current")?.id ?? remaining[0]?.id,
    );
    return {
      ...state,
      agenda: normalizedAgenda,
      workshopMeta: {
        ...state.workshopMeta,
        currentPhaseLabel: resolveCurrentPhaseLabel(normalizedAgenda, state.workshopMeta.currentPhaseLabel),
      },
    };
  }, instanceId);
}

export async function moveAgendaItem(
  itemId: string,
  direction: "up" | "down",
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) => {
    const agenda = [...state.agenda].sort((left, right) => left.order - right.order);
    const currentIndex = agenda.findIndex((item) => item.id === itemId);
    if (currentIndex < 0) {
      return state;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= agenda.length) {
      return state;
    }

    const [moved] = agenda.splice(currentIndex, 1);
    agenda.splice(targetIndex, 0, moved);
    const normalizedAgenda = normalizeAgenda(agenda, state.agenda.find((item) => item.status === "current")?.id);
    return {
      ...state,
      agenda: normalizedAgenda,
      workshopMeta: {
        ...state.workshopMeta,
        currentPhaseLabel: resolveCurrentPhaseLabel(normalizedAgenda, state.workshopMeta.currentPhaseLabel),
      },
    };
  }, instanceId);
}

export async function addPresenterScene(
  agendaItemId: string,
  input: Pick<PresenterScene, "label" | "sceneType"> & {
    title?: string;
    body?: string;
    intent?: PresenterSceneIntent;
    chromePreset?: PresenterChromePreset;
    ctaLabel?: string | null;
    ctaHref?: string | null;
    facilitatorNotes?: string[];
    sourceRefs?: PresenterScene["sourceRefs"];
    blocks?: PresenterBlock[];
  },
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) =>
    updateAgendaScenes(state, agendaItemId, (item) => {
      const blocks = normalizeBlocks(input.blocks, []);
      const title = resolveSceneTitle(input.label, input.title, blocks);
      const body = resolveSceneBody(input.body, blocks);
      const normalized = normalizePresenterScenes(
        [
          ...item.presenterScenes,
          {
            id: `scene-${randomUUID()}`,
            label: input.label,
            sceneType: input.sceneType,
            surface: deriveSceneSurface(input.sceneType),
            intent: input.intent ?? deriveSceneIntent(input.sceneType),
            chromePreset: input.chromePreset ?? deriveSceneChromePreset(input.sceneType),
            title,
            body,
            ctaLabel: input.ctaLabel ?? null,
            ctaHref: input.ctaHref ?? null,
            facilitatorNotes: normalizeStringArray(input.facilitatorNotes, []),
            sourceRefs: Array.isArray(input.sourceRefs) ? input.sourceRefs : [],
            blocks: blocks.length > 0 ? blocks : buildFallbackPresenterBlocks({ sceneType: input.sceneType, title, body }),
            order: item.presenterScenes.length + 1,
            enabled: true,
            sourceBlueprintSceneId: null,
            kind: "custom",
          },
        ],
        item.defaultPresenterSceneId,
      );

      return {
        ...item,
        presenterScenes: normalized.scenes,
        defaultPresenterSceneId: normalized.defaultPresenterSceneId,
      };
    }), instanceId);
}

export async function updatePresenterScene(
  agendaItemId: string,
  sceneId: string,
  updates: Pick<PresenterScene, "label" | "sceneType"> & {
    title?: string;
    body?: string;
    intent?: PresenterSceneIntent;
    chromePreset?: PresenterChromePreset;
    ctaLabel?: string | null;
    ctaHref?: string | null;
    facilitatorNotes?: string[];
    sourceRefs?: PresenterScene["sourceRefs"];
    blocks?: PresenterBlock[];
  },
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) =>
    updateAgendaScenes(state, agendaItemId, (item) => {
      requirePresenterScene(item, sceneId);
      const normalized = normalizePresenterScenes(
        item.presenterScenes.map((scene) => {
          if (scene.id !== sceneId) {
            return scene;
          }

          const blocks = normalizeBlocks(updates.blocks, scene.blocks);
          const title = resolveSceneTitle(updates.label, updates.title, blocks);
          const body = resolveSceneBody(updates.body, blocks);

          return {
            ...scene,
            label: updates.label,
            sceneType: updates.sceneType,
            surface: deriveSceneSurface(updates.sceneType),
            intent:
              updates.intent ??
              (scene.intent === "custom" ? deriveSceneIntent(updates.sceneType) : scene.intent ?? deriveSceneIntent(updates.sceneType)),
            chromePreset:
              updates.chromePreset ??
              ((scene.chromePreset === "minimal" || scene.chromePreset === "participant" || scene.chromePreset === "checkpoint")
                ? deriveSceneChromePreset(updates.sceneType)
                : scene.chromePreset ?? deriveSceneChromePreset(updates.sceneType)),
            title,
            body,
            ctaLabel: updates.ctaLabel ?? null,
            ctaHref: updates.ctaHref ?? null,
            facilitatorNotes: updates.facilitatorNotes ?? scene.facilitatorNotes,
            sourceRefs: updates.sourceRefs ?? scene.sourceRefs,
            blocks: blocks.length > 0 ? blocks : buildFallbackPresenterBlocks({ sceneType: updates.sceneType, title, body }),
          };
        }),
        item.defaultPresenterSceneId,
      );

      return {
        ...item,
        presenterScenes: normalized.scenes,
        defaultPresenterSceneId: normalized.defaultPresenterSceneId,
      };
    }), instanceId);
}

export async function movePresenterScene(
  agendaItemId: string,
  sceneId: string,
  direction: "up" | "down",
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) =>
    updateAgendaScenes(state, agendaItemId, (item) => {
      requirePresenterScene(item, sceneId);
      const scenes = [...item.presenterScenes].sort((left, right) => left.order - right.order);
      const currentIndex = scenes.findIndex((scene) => scene.id === sceneId);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= scenes.length) {
        return item;
      }

      const [moved] = scenes.splice(currentIndex, 1);
      scenes.splice(targetIndex, 0, moved);
      const normalized = normalizePresenterScenes(
        scenes.map((scene, index) => ({ ...scene, order: index + 1 })),
        item.defaultPresenterSceneId,
      );

      return {
        ...item,
        presenterScenes: normalized.scenes,
        defaultPresenterSceneId: normalized.defaultPresenterSceneId,
      };
    }), instanceId);
}

export async function removePresenterScene(
  agendaItemId: string,
  sceneId: string,
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) =>
    updateAgendaScenes(state, agendaItemId, (item) => {
      requirePresenterScene(item, sceneId);
      const normalized = normalizePresenterScenes(
        item.presenterScenes.filter((scene) => scene.id !== sceneId),
        item.defaultPresenterSceneId === sceneId ? null : item.defaultPresenterSceneId,
      );

      return {
        ...item,
        presenterScenes: normalized.scenes,
        defaultPresenterSceneId: normalized.defaultPresenterSceneId,
      };
    }), instanceId);
}

export async function setDefaultPresenterScene(
  agendaItemId: string,
  sceneId: string,
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) =>
    updateAgendaScenes(state, agendaItemId, (item) => {
      requirePresenterScene(item, sceneId);
      const normalized = normalizePresenterScenes(item.presenterScenes, sceneId);
      return {
        ...item,
        presenterScenes: normalized.scenes,
        defaultPresenterSceneId: normalized.defaultPresenterSceneId,
      };
    }), instanceId);
}

export async function setPresenterSceneEnabled(
  agendaItemId: string,
  sceneId: string,
  enabled: boolean,
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) =>
    updateAgendaScenes(state, agendaItemId, (item) => {
      requirePresenterScene(item, sceneId);
      const normalized = normalizePresenterScenes(
        item.presenterScenes.map((scene) => (scene.id === sceneId ? { ...scene, enabled } : scene)),
        item.defaultPresenterSceneId,
      );

      return {
        ...item,
        presenterScenes: normalized.scenes,
        defaultPresenterSceneId: normalized.defaultPresenterSceneId,
      };
    }), instanceId);
}

export async function updateTeamFromParticipant(
  teamId: string,
  patch: { name?: string; repoUrl?: string; members?: string[] },
  instanceId: string,
) {
  const repository = getTeamRepository();
  const teams = await repository.listTeams(instanceId);
  const baselineTeams = teams.length > 0 ? teams : (await getBaseWorkshopState(instanceId)).teams;
  const team = baselineTeams.find((t) => t.id === teamId);
  if (!team) {
    throw new WorkshopStateTargetError("agenda_item_not_found", `team '${teamId}' not found`);
  }

  const updatedTeam = {
    ...team,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.repoUrl !== undefined ? { repoUrl: patch.repoUrl } : {}),
    ...(patch.members !== undefined ? { members: patch.members } : {}),
  };

  const nextTeams = baselineTeams.map((t) => (t.id === teamId ? updatedTeam : t));
  await repository.replaceTeams(instanceId, nextTeams);

  const state = normalizeStoredWorkshopState(await getBaseWorkshopState(instanceId));
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    version: state.version + 1,
    teams: nextTeams,
  }, {
    expectedVersion: state.version,
  });

  return getWorkshopState(instanceId);
}

export async function upsertTeam(input: Team, instanceId = getCurrentWorkshopInstanceId()) {
  const repository = getTeamRepository();
  await repository.upsertTeam(instanceId, input);
  const teams = await repository.listTeams(instanceId);

  // Keep the workshop-state projection aligned during the migration window.
  const state = normalizeStoredWorkshopState(await getBaseWorkshopState(instanceId));
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    version: state.version + 1,
    teams,
  }, {
    expectedVersion: state.version,
  });

  return getWorkshopState(instanceId);
}

export async function appendCheckIn(
  teamId: string,
  entry: Omit<TeamCheckIn, "writtenAt">,
  instanceId = getCurrentWorkshopInstanceId(),
) {
  const repository = getTeamRepository();
  const teams = await repository.listTeams(instanceId);
  const baselineTeams = teams.length > 0 ? teams : (await getBaseWorkshopState(instanceId)).teams;
  if (!baselineTeams.some((team) => team.id === teamId)) {
    throw new Error(`Team not found: ${teamId}`);
  }
  const checkIn: TeamCheckIn = { ...entry, writtenAt: new Date().toISOString() };
  const nextTeams = baselineTeams.map((team) =>
    team.id === teamId ? { ...team, checkIns: [...team.checkIns, checkIn] } : team,
  );
  await repository.replaceTeams(instanceId, nextTeams);

  // Keep the workshop-state projection aligned during the migration window.
  const state = normalizeStoredWorkshopState(await getBaseWorkshopState(instanceId));
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    version: state.version + 1,
    teams: nextTeams,
  }, {
    expectedVersion: state.version,
  });

  return getWorkshopState(instanceId);
}

export async function getWorkshopInstances(options?: { includeRemoved?: boolean }) {
  return getWorkshopInstanceRepository().listInstances(options);
}

export async function createWorkshopInstance(input: {
  id: string;
  templateId?: string;
  contentLang?: WorkshopContentLanguage;
  eventTitle?: string;
  city?: string;
  dateRange?: string;
  venueName?: string;
  roomName?: string;
  addressLine?: string;
  locationDetails?: string;
  facilitatorLabel?: string;
}, actorNeonUserId?: string | null) {
  const instanceRepository = getWorkshopInstanceRepository();
  const existingInstance = await instanceRepository.getInstance(input.id);
  if (existingInstance) {
    return existingInstance;
  }

  const now = new Date().toISOString();
  const templateId = input.templateId?.trim() || workshopTemplates[0]?.id || "blueprint-default";
  const instance = createWorkshopInstanceRecord({
    id: input.id,
    templateId,
    importedAt: now,
    contentLang: input.contentLang,
  });
  const nextInstance: WorkshopInstanceRecord = {
    ...instance,
    workshopMeta: {
      ...instance.workshopMeta,
      contentLang: input.contentLang ?? instance.workshopMeta.contentLang,
      eventTitle: input.eventTitle?.trim() || instance.workshopMeta.eventTitle,
      city: input.city?.trim() || instance.workshopMeta.city,
      dateRange: input.dateRange?.trim() || instance.workshopMeta.dateRange,
      venueName: input.venueName?.trim() || instance.workshopMeta.venueName,
      roomName: input.roomName?.trim() || instance.workshopMeta.roomName,
      addressLine: input.addressLine?.trim() || instance.workshopMeta.addressLine,
      locationDetails: input.locationDetails?.trim() || instance.workshopMeta.locationDetails,
      facilitatorLabel: input.facilitatorLabel?.trim() || instance.workshopMeta.facilitatorLabel,
    },
  };

  await instanceRepository.createInstance(nextInstance);
  await getWorkshopStateRepository().saveState(nextInstance.id, createWorkshopStateFromInstance(nextInstance));
  await getTeamRepository().replaceTeams(nextInstance.id, []);
  await getCheckpointRepository().replaceCheckpoints(nextInstance.id, []);
  await getMonitoringSnapshotRepository().replaceSnapshots(nextInstance.id, []);
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId: nextInstance.id,
    actorKind: "facilitator",
    action: "instance_created",
    result: "success",
    createdAt: now,
    metadata: {
      templateId: nextInstance.templateId,
      actorNeonUserId: actorNeonUserId ?? null,
    },
  });

  return nextInstance;
}

export async function updateWorkshopInstanceMetadata(
  instanceId: string,
  input: {
    contentLang?: WorkshopContentLanguage;
    eventTitle?: string;
    city?: string;
    dateRange?: string;
    venueName?: string;
    roomName?: string;
    addressLine?: string;
    locationDetails?: string;
    facilitatorLabel?: string;
  },
  actorNeonUserId?: string | null,
) {
  const repository = getWorkshopInstanceRepository();
  const current = await repository.getInstance(instanceId);
  if (!current) {
    return null;
  }

  const nextWorkshopMeta = {
    ...current.workshopMeta,
    contentLang: input.contentLang ?? current.workshopMeta.contentLang,
    eventTitle: input.eventTitle?.trim() || current.workshopMeta.eventTitle,
    city: input.city?.trim() || current.workshopMeta.city,
    dateRange: input.dateRange?.trim() || current.workshopMeta.dateRange,
    venueName: input.venueName?.trim() || current.workshopMeta.venueName,
    roomName: input.roomName?.trim() || current.workshopMeta.roomName,
    addressLine: input.addressLine?.trim() || current.workshopMeta.addressLine,
    locationDetails: input.locationDetails?.trim() || current.workshopMeta.locationDetails,
    facilitatorLabel: input.facilitatorLabel?.trim() || current.workshopMeta.facilitatorLabel,
  };
  const nextInstance = {
    ...current,
    workshopMeta: nextWorkshopMeta,
  };

  await repository.updateInstance(instanceId, nextInstance);

  const state = normalizeStoredWorkshopState(await getBaseWorkshopState(instanceId));
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    version: state.version + 1,
    workshopMeta: {
      ...state.workshopMeta,
      ...nextWorkshopMeta,
    },
    monitoring: state.monitoring,
    sprintUpdates: state.sprintUpdates,
  }, {
    expectedVersion: state.version,
  });

  const changedFields = Object.entries(input)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key]) => key)
    .join(",");

  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "instance_metadata_updated",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: {
      actorNeonUserId: actorNeonUserId ?? null,
      changedFields,
    },
  });

  return nextInstance;
}

export async function prepareWorkshopInstance(instanceId: string, actorNeonUserId?: string | null) {
  const repository = getWorkshopInstanceRepository();
  const current = await repository.getInstance(instanceId);
  if (!current) {
    return null;
  }

  const next = { ...current, status: "prepared" as const };
  await repository.updateInstance(instanceId, next);
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "instance_prepared",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: {
      actorNeonUserId: actorNeonUserId ?? null,
    },
  });
  return next;
}

export async function completeChallenge(
  challengeId: string,
  teamId: string,
  instanceId = getCurrentWorkshopInstanceId(),
) {
  return updateWorkshopState((state) => ({
    ...state,
    challenges: state.challenges.map((challenge) =>
      challenge.id === challengeId && !challenge.completedBy.includes(teamId)
        ? { ...challenge, completedBy: [...challenge.completedBy, teamId] }
        : challenge,
    ),
  }), instanceId);
}

export async function setRotationReveal(revealed: boolean, instanceId = getCurrentWorkshopInstanceId()) {
  return updateWorkshopState((state) => ({
    ...state,
    rotation: { ...state.rotation, revealed },
  }), instanceId);
}

export type RotationSignalInput = {
  freeText: string;
  tags?: string[];
  teamId?: string;
  artifactPaths?: string[];
  capturedBy?: RotationSignal["capturedBy"];
};

/**
 * Derive a cohort identifier for the learnings log entry. Prefers an
 * explicit `cohort` hint carried on the workshop instance metadata; if
 * absent, falls back to the ISO year-quarter of the capture timestamp.
 * The fallback is deterministic but fuzzy across year and quarter
 * boundaries — see ADR 2026-04-09 continuation-shift-as-eval for the
 * deferred tightening.
 */
function resolveCohort(cohortHint: string | null | undefined, capturedAt: string): string {
  if (cohortHint && cohortHint.trim().length > 0) {
    return cohortHint.trim();
  }
  const date = new Date(capturedAt);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }
  const year = date.getUTCFullYear();
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}

/**
 * captureRotationSignal — persist one facilitator observation to both
 * the instance-local store and the cross-cohort learnings log.
 *
 * Deliberately does NOT call updateWorkshopState. Rotation signals are
 * orthogonal to WorkshopState and live in their own repositories so
 * that the signal stream does not inflate the hot path of state reads
 * and so that signal writes do not contend with state writes for
 * optimistic concurrency.
 */
export async function captureRotationSignal(
  input: RotationSignalInput,
  instanceId = getCurrentWorkshopInstanceId(),
): Promise<RotationSignal> {
  const trimmedText = input.freeText.trim();
  if (trimmedText.length === 0) {
    throw new Error("captureRotationSignal: freeText is required");
  }

  const tags = (input.tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  const signal: RotationSignal = {
    id: randomUUID(),
    instanceId,
    capturedAt: new Date().toISOString(),
    capturedBy: input.capturedBy ?? "facilitator",
    ...(input.teamId ? { teamId: input.teamId } : {}),
    tags,
    freeText: trimmedText,
    ...(input.artifactPaths && input.artifactPaths.length > 0
      ? { artifactPaths: input.artifactPaths }
      : {}),
  };

  await getRotationSignalRepository().append(instanceId, signal);

  // Cohort identifier is derived from the ISO year-quarter of the capture
  // timestamp. The ADR deferred tightening this to an explicit cohort
  // field on the workshop instance record — see `docs/adr/2026-04-09-
  // continuation-shift-as-eval.md` "Consequences" for the rationale.
  await getLearningsLogRepository().append({
    cohort: resolveCohort(null, signal.capturedAt),
    instanceId,
    loggedAt: signal.capturedAt,
    signal,
  });

  return signal;
}

export async function listRotationSignals(
  instanceId = getCurrentWorkshopInstanceId(),
): Promise<RotationSignal[]> {
  return getRotationSignalRepository().list(instanceId);
}

export async function addSprintUpdate(update: SprintUpdate, instanceId = getCurrentWorkshopInstanceId()) {
  const repository = getCheckpointRepository();
  await repository.appendCheckpoint(instanceId, update);
  const checkpoints = await repository.listCheckpoints(instanceId);

  // Keep the workshop-state projection aligned during the migration window.
  const state = normalizeStoredWorkshopState(await getBaseWorkshopState(instanceId));
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    version: state.version + 1,
    sprintUpdates: checkpoints,
  }, {
    expectedVersion: state.version,
  });

  return getWorkshopState(instanceId);
}

export async function replaceMonitoring(items: MonitoringSnapshot[], instanceId = getCurrentWorkshopInstanceId()) {
  const repository = getMonitoringSnapshotRepository();
  await repository.replaceSnapshots(instanceId, items);

  // Keep the workshop-state projection aligned during the migration window.
  const state = normalizeStoredWorkshopState(await getBaseWorkshopState(instanceId));
  await getWorkshopStateRepository().saveState(instanceId, {
    ...state,
    version: state.version + 1,
    monitoring: items,
  }, {
    expectedVersion: state.version,
  });

  return getWorkshopState(instanceId);
}

export async function getLatestWorkshopArchive(instanceId = getCurrentWorkshopInstanceId()) {
  return getInstanceArchiveRepository().getLatestArchive(instanceId);
}

export async function createWorkshopArchive(options?: {
  reason?: "manual" | "reset";
  notes?: string | null;
}, instanceId = getCurrentWorkshopInstanceId()) {
  const reason = options?.reason ?? "manual";
  const archivedAt = new Date();
  const [workshopState, checkpoints, monitoringSnapshots, participantEventAccess, participantSessions] = await Promise.all([
    getWorkshopState(instanceId),
    getCheckpointRepository().listCheckpoints(instanceId),
    getMonitoringSnapshotRepository().getSnapshots(instanceId),
    getParticipantEventAccessRepository().getActiveAccess(instanceId),
    getEventAccessRepository().listSessions(instanceId),
  ]);

  const archiveRecord = {
    id: `archive-${randomUUID()}`,
    instanceId,
    archiveStatus: "ready" as const,
    storageUri: null,
    createdAt: archivedAt.toISOString(),
    retentionUntil: addDays(archivedAt, archiveRetentionDays),
    notes: options?.notes ?? null,
    payload: {
      archivedAt: archivedAt.toISOString(),
      reason,
      workshopState,
      checkpoints,
      monitoringSnapshots,
      participantEventAccessVersion: participantEventAccess?.version ?? null,
      participantSessions,
    },
  };

  await getInstanceArchiveRepository().createArchive(archiveRecord);
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "instance_archive_created",
    result: "success",
    createdAt: archivedAt.toISOString(),
    metadata: {
      reason,
      archiveId: archiveRecord.id,
      participantSessionCount: participantSessions.length,
      checkpointCount: checkpoints.length,
      monitoringSnapshotCount: monitoringSnapshots.length,
    },
  });
  emitRuntimeAlert({
    category: "instance_archive_created",
    severity: "info",
    instanceId,
    metadata: {
      reason,
      archiveId: archiveRecord.id,
    },
  });

  return archiveRecord;
}

export async function applyRuntimeRetentionPolicy(instanceId = getCurrentWorkshopInstanceId()) {
  const now = new Date();
  await Promise.all([
    getEventAccessRepository().deleteExpiredSessions(instanceId, now.toISOString()),
    getMonitoringSnapshotRepository().deleteOlderThan(instanceId, subtractDays(now, monitoringRetentionDays)),
    getAuditLogRepository().deleteOlderThan(instanceId, subtractDays(now, auditRetentionDays)),
    getRedeemAttemptRepository().deleteOlderThan(instanceId, subtractDays(now, redeemAttemptRetentionDays)),
    getInstanceArchiveRepository().deleteExpiredArchives(now.toISOString()),
  ]);
}

export async function resetWorkshopState(templateId = workshopTemplates[0]?.id || "blueprint-default", instanceId = getCurrentWorkshopInstanceId(), externalBlueprint?: BlueprintAgenda) {
  await createWorkshopArchive({
    reason: "reset",
    notes: `Automatic pre-reset archive for template ${templateId}`,
  }, instanceId);

  const sessionRepository = getEventAccessRepository();
  const sessions = await sessionRepository.listSessions(instanceId);
  await Promise.all(sessions.map((session) => sessionRepository.deleteSession(instanceId, session.tokenHash)));

  const instanceRepository = getWorkshopInstanceRepository();
  const existingInstance = await instanceRepository.getInstance(instanceId);
  const nextState = createWorkshopStateFromTemplate(
    templateId,
    instanceId,
    existingInstance ? resolveStoredContentLanguage(existingInstance.workshopMeta.contentLang) : undefined,
    externalBlueprint,
  );
  if (existingInstance) {
    const nextWorkshopMeta = {
      ...nextState.workshopMeta,
      contentLang: resolveStoredContentLanguage(existingInstance.workshopMeta.contentLang),
      eventTitle: existingInstance.workshopMeta.eventTitle,
      city: existingInstance.workshopMeta.city,
      dateRange: existingInstance.workshopMeta.dateRange,
      venueName: existingInstance.workshopMeta.venueName,
      roomName: existingInstance.workshopMeta.roomName,
      addressLine: existingInstance.workshopMeta.addressLine,
      locationDetails: existingInstance.workshopMeta.locationDetails,
      facilitatorLabel: existingInstance.workshopMeta.facilitatorLabel,
    };
    nextState.workshopMeta = nextWorkshopMeta;
    await instanceRepository.updateInstance(instanceId, {
      ...existingInstance,
      templateId,
      status: "prepared",
      importedAt: new Date().toISOString(),
      removedAt: null,
      workshopMeta: nextWorkshopMeta,
    });
  }
  await getWorkshopStateRepository().saveState(instanceId, nextState);
  await getTeamRepository().replaceTeams(instanceId, []);
  await getCheckpointRepository().replaceCheckpoints(instanceId, []);
  await getMonitoringSnapshotRepository().replaceSnapshots(instanceId, []);
  await applyRuntimeRetentionPolicy(instanceId);
  return getWorkshopState(instanceId);
}

export async function removeWorkshopInstance(instanceId: string, actorNeonUserId?: string | null) {
  await createWorkshopArchive({
    reason: "manual",
    notes: "Automatic pre-remove archive for instance removal",
  }, instanceId);

  await getWorkshopInstanceRepository().removeInstance(instanceId, new Date().toISOString());
  await getAuditLogRepository().append({
    id: `audit-${randomUUID()}`,
    instanceId,
    actorKind: "facilitator",
    action: "instance_removed",
    result: "success",
    createdAt: new Date().toISOString(),
    metadata: {
      actorNeonUserId: actorNeonUserId ?? null,
    },
  });
}
