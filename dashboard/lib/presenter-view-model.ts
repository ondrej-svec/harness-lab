import type { UiLanguage } from "./ui-language";
import type { WorkshopState } from "./workshop-data";
import { getDefaultPresenterScene, getPresenterScenesBySurface, resolvePresenterSelection } from "./presenter-scenes";

export function buildPresenterRouteHref(options: {
  lang: UiLanguage;
  instanceId: string;
  agendaItemId?: string | null;
  sceneId?: string | null;
}) {
  const params = new URLSearchParams();
  if (options.agendaItemId) {
    params.set("agendaItem", options.agendaItemId);
  }
  if (options.sceneId) {
    params.set("scene", options.sceneId);
  }
  params.set("lang", options.lang);
  const query = params.toString();
  return `/admin/instances/${options.instanceId}/presenter?${query}`;
}

export function buildParticipantMirrorHref(options: {
  lang: UiLanguage;
  instanceId: string;
}) {
  return options.lang === "en"
    ? `/admin/instances/${options.instanceId}/participant?lang=en`
    : `/admin/instances/${options.instanceId}/participant`;
}

export function buildPresenterControlState(options: {
  state: WorkshopState;
  instanceId: string;
  lang: UiLanguage;
}) {
  const { state, instanceId, lang } = options;
  const currentAgendaItem =
    state.agenda.find((item) => item.id === state.liveMoment.agendaItemId) ??
    state.agenda.find((item) => item.status === "current") ??
    state.agenda[0] ??
    null;
  const liveRoomSceneId = state.liveMoment.roomSceneId;
  const currentLiveScene =
    currentAgendaItem && liveRoomSceneId
      ? currentAgendaItem.presenterScenes.find(
          (scene) => scene.enabled && scene.surface === "room" && scene.id === liveRoomSceneId,
        ) ?? null
      : null;
  const currentDefaultScene = currentLiveScene ?? getDefaultPresenterScene(currentAgendaItem);
  const participantPreviewScene = getPresenterScenesBySurface(currentAgendaItem, "participant")[0] ?? null;

  return {
    currentAgendaItem,
    currentDefaultScene,
    currentPresenterHref: buildPresenterRouteHref({
      lang,
      instanceId,
      agendaItemId: currentAgendaItem?.id ?? null,
      sceneId: currentDefaultScene?.id ?? null,
    }),
    participantMirrorHref: buildParticipantMirrorHref({
      lang,
      instanceId,
    }),
    participantPreviewHref: participantPreviewScene
      ? buildPresenterRouteHref({
          lang,
          instanceId,
          agendaItemId: currentAgendaItem?.id ?? null,
          sceneId: participantPreviewScene.id,
        })
      : null,
  };
}

export function buildPresenterPageState(options: {
  state: WorkshopState;
  requestedAgendaItemId?: string | null;
  requestedSceneId?: string | null;
}) {
  const { state, requestedAgendaItemId, requestedSceneId } = options;
  const { activeAgendaItem, selectedScene, agendaItems } = resolvePresenterSelection({
    state,
    requestedAgendaItemId,
    requestedSceneId,
  });

  return {
    activeAgendaItem,
    selectedScene,
    agendaItems,
  };
}
