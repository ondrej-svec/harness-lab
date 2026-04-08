import type { AgendaItem, PresenterScene, WorkshopState } from "./workshop-data";

export function normalizePresenterScenes(
  scenes: PresenterScene[],
  requestedDefaultSceneId?: string | null,
) {
  const orderedScenes = [...scenes]
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map((scene, index) => ({ ...scene, order: index + 1 }));
  const enabledScenes = orderedScenes.filter((scene) => scene.enabled);
  const fallbackSceneId = enabledScenes[0]?.id ?? orderedScenes[0]?.id ?? null;
  const defaultPresenterSceneId =
    requestedDefaultSceneId && enabledScenes.some((scene) => scene.id === requestedDefaultSceneId)
      ? requestedDefaultSceneId
      : fallbackSceneId;

  return {
    scenes: orderedScenes,
    defaultPresenterSceneId,
  };
}

export function getDefaultPresenterScene(item: AgendaItem | null | undefined) {
  if (!item) {
    return null;
  }

  const enabledScenes = item.presenterScenes.filter((scene) => scene.enabled);
  if (item.defaultPresenterSceneId) {
    const explicitScene = enabledScenes.find((scene) => scene.id === item.defaultPresenterSceneId);
    if (explicitScene) {
      return explicitScene;
    }
  }

  return enabledScenes[0] ?? item.presenterScenes[0] ?? null;
}

export function getPresenterSceneByType(
  item: AgendaItem | null | undefined,
  sceneType: PresenterScene["sceneType"],
) {
  return item?.presenterScenes.find((scene) => scene.enabled && scene.sceneType === sceneType) ?? null;
}

export function resolvePresenterSelection(options: {
  state: WorkshopState;
  requestedAgendaItemId?: string | null;
  requestedSceneId?: string | null;
}) {
  const { state, requestedAgendaItemId, requestedSceneId } = options;
  const activeAgendaItem =
    state.agenda.find((item) => item.id === requestedAgendaItemId) ??
    state.agenda.find((item) => item.status === "current") ??
    state.agenda[0] ??
    null;
  const selectedScene =
    activeAgendaItem?.presenterScenes.find((scene) => scene.id === requestedSceneId && scene.enabled) ??
    getDefaultPresenterScene(activeAgendaItem);

  return {
    activeAgendaItem,
    selectedScene,
    agendaItems: state.agenda.filter((item) => item.presenterScenes.some((scene) => scene.enabled)),
  };
}
