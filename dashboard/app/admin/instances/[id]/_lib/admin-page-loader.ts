import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import {
  buildAdminHref,
  buildAdminOverviewState,
  buildAdminSessionState,
  buildAdminSummaryStats,
  buildAdminWorkspaceHref,
  deriveAdminPageState,
  getWorkshopLocationLines,
  resolveAdminSection,
  resolveControlRoomOverlay,
  type AdminSection,
  type ControlRoomOverlay,
} from "@/lib/admin-page-view-model";
import { requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { getFacilitatorParticipantAccessState } from "@/lib/participant-access-management";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getInstanceGrantRepository } from "@/lib/instance-grant-repository";
import { buildParticipantMirrorHref, buildPresenterRouteHref } from "@/lib/presenter-view-model";
import type { RotationSignal } from "@/lib/runtime-contracts";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";
import { adminCopy, resolveUiLanguage } from "@/lib/ui-language";
import type { AgendaItem, Team } from "@/lib/workshop-data";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import {
  getLatestWorkshopArchive,
  getWorkshopState,
  listRotationSignals,
} from "@/lib/workshop-store";
import type {
  RichAgendaItem,
  RichPresenterScene,
} from "../_components/agenda/types";
import type { OutlineAgendaItem } from "../_components/outline-rail";
import {
  parseParticipantAccessFlash,
  participantAccessFlashCookieName,
} from "./participant-access-flash";

export type AdminPageSearchParams = {
  lang?: string;
  section?: string;
  error?: string;
  password?: string;
  team?: string;
  agendaItem?: string;
  scene?: string;
  overlay?: string;
};

function parseEvidenceSummary(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return { changed: "", verified: "", nextStep: "" };
  }

  const result = { changed: "", verified: "", nextStep: "" };
  let matched = false;

  for (const line of normalized.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("Co se změnilo:")) {
      result.changed = trimmed.replace("Co se změnilo:", "").trim();
      matched = true;
      continue;
    }

    if (trimmed.startsWith("Co to ověřuje:")) {
      result.verified = trimmed.replace("Co to ověřuje:", "").trim();
      matched = true;
      continue;
    }

    if (trimmed.startsWith("Další safe move:")) {
      result.nextStep = trimmed.replace("Další safe move:", "").trim();
      matched = true;
    }
  }

  if (!matched) {
    result.changed = normalized;
  }

  return result;
}

function isHandoffAgendaItem(item: Partial<AgendaItem> | null | undefined) {
  return item?.intent === "handoff" || item?.id === "rotation";
}

function getRoomPresenterScenes(item: RichAgendaItem | null | undefined): RichPresenterScene[] {
  return (item?.presenterScenes ?? []).filter((scene) => scene.surface === "room");
}

function getParticipantPresenterScenes(item: RichAgendaItem | null | undefined): RichPresenterScene[] {
  return (item?.presenterScenes ?? []).filter((scene) => scene.surface === "participant");
}

export async function loadAdminPageViewModel({
  instanceId,
  query,
}: {
  instanceId: string;
  query: AdminPageSearchParams | undefined;
}) {
  const lang = resolveUiLanguage(query?.lang);
  const copy = adminCopy[lang];
  const activeSection = resolveAdminSection(query?.section);
  const visibleSection: AdminSection = activeSection;
  const activeOverlay: ControlRoomOverlay | null = resolveControlRoomOverlay(query?.overlay);

  const instanceRepo = getWorkshopInstanceRepository();
  const availableInstances = await instanceRepo.listInstances();

  if (!availableInstances.some((instance) => instance.id === instanceId)) {
    redirect(buildAdminWorkspaceHref({ lang }));
  }

  await requireFacilitatorPageAccess(instanceId);

  const isNeonMode = getRuntimeStorageMode() === "neon";
  const cookieStore = await cookies();
  const [
    state,
    latestArchive,
    facilitatorGrants,
    currentFacilitator,
    authSession,
    participantAccess,
    rotationSignals,
  ] = await Promise.all([
    getWorkshopState(instanceId),
    getLatestWorkshopArchive(instanceId),
    isNeonMode ? getInstanceGrantRepository().listActiveGrants(instanceId) : Promise.resolve([]),
    isNeonMode ? getFacilitatorSession(instanceId) : Promise.resolve(null),
    isNeonMode && auth ? auth.getSession() : Promise.resolve({ data: null }),
    getFacilitatorParticipantAccessState(instanceId),
    listRotationSignals(instanceId).catch(() => [] as RotationSignal[]),
  ]);

  const participantAccessFlash = parseParticipantAccessFlash(
    cookieStore.get(participantAccessFlashCookieName)?.value,
    instanceId,
  );
  const participantAccessExpiresValue = participantAccess.expiresAt
    ? new Intl.DateTimeFormat(lang === "en" ? "en-US" : "cs-CZ", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(participantAccess.expiresAt))
    : copy.participantAccessUnavailableValue;

  const { currentAgendaItem, nextAgendaItem, selectedInstance } = deriveAdminPageState(
    state,
    availableInstances,
    instanceId,
  );
  const requestedAgendaItem = state.agenda.find((item: AgendaItem) => item.id === query?.agendaItem) as
    | RichAgendaItem
    | undefined;
  const selectedAgendaItem = (requestedAgendaItem ?? currentAgendaItem ?? state.agenda[0]) as
    | RichAgendaItem
    | undefined;
  const outlineAgendaItems: OutlineAgendaItem[] = state.agenda.map((item) => ({
    id: item.id,
    label: item.title,
    time: item.time ?? null,
    status: (item.status ?? "upcoming") as OutlineAgendaItem["status"],
  }));
  const roomScenes = getRoomPresenterScenes(selectedAgendaItem);
  const participantScenes = getParticipantPresenterScenes(selectedAgendaItem);
  const selectedScene =
    selectedAgendaItem?.presenterScenes.find((scene) => scene.id === query?.scene) ??
    selectedAgendaItem?.presenterScenes.find(
      (scene) => scene.id === selectedAgendaItem.defaultPresenterSceneId,
    ) ??
    selectedAgendaItem?.presenterScenes[0] ??
    null;
  const selectedRoomScene =
    roomScenes.find((scene) => scene.id === query?.scene) ??
    roomScenes.find((scene) => scene.id === selectedAgendaItem?.defaultPresenterSceneId) ??
    roomScenes[0] ??
    null;
  const selectedParticipantScene =
    participantScenes.find((scene) => scene.id === query?.scene) ?? participantScenes[0] ?? null;
  const selectedTeam = state.teams.find((team: Team) => team.id === query?.team) ?? state.teams[0] ?? null;
  const selectedTeamLatestCheckIn = selectedTeam?.checkIns[selectedTeam.checkIns.length - 1]?.content ?? "";
  const selectedTeamCheckpoint = parseEvidenceSummary(selectedTeamLatestCheckIn);
  const isOwner = currentFacilitator?.grant.role === "owner";
  const signedInEmail = authSession?.data?.user?.email ?? null;
  const signedInName = authSession?.data?.user?.name ?? null;
  const fileModeUsername = process.env.HARNESS_ADMIN_USERNAME ?? "facilitator";

  const overviewState = buildAdminOverviewState({
    copy,
    lang,
    state,
    activeInstanceId: instanceId,
    currentAgendaItem,
    nextAgendaItem,
  });
  const sessionState = buildAdminSessionState({
    copy,
    signedInEmail,
    signedInName,
    currentRole: currentFacilitator?.grant.role ?? null,
    latestArchive,
  });
  const persistentSummaryRows = buildAdminSummaryStats({
    copy,
    state,
    selectedInstance,
    currentAgendaItem,
  });

  const showAgendaDetail = visibleSection === "run" && Boolean(requestedAgendaItem);
  const selectedDefaultScene =
    roomScenes.find((scene) => scene.id === selectedAgendaItem?.defaultPresenterSceneId) ??
    roomScenes[0] ??
    null;

  const selectedAgendaProjectionHref = selectedAgendaItem
    ? buildPresenterRouteHref({
        lang,
        instanceId,
        agendaItemId: selectedAgendaItem.id,
        sceneId: selectedDefaultScene?.id ?? null,
      })
    : null;
  const selectedAgendaParticipantMirrorHref = buildParticipantMirrorHref({ lang, instanceId });

  const agendaIndexHref = buildAdminHref({ lang, section: "run", instanceId });
  const agendaDetailHref = buildAdminHref({
    lang,
    section: "run",
    instanceId,
    agendaItemId: selectedAgendaItem?.id ?? null,
  });
  const agendaBaseHref = showAgendaDetail ? agendaDetailHref : agendaIndexHref;
  const sceneBaseHref = buildAdminHref({
    lang,
    section: "run",
    instanceId,
    agendaItemId: selectedAgendaItem?.id ?? null,
    sceneId: selectedScene?.id ?? null,
  });
  const liveAgendaHref = currentAgendaItem
    ? buildAdminHref({
        lang,
        section: "run",
        instanceId,
        agendaItemId: currentAgendaItem.id,
      })
    : agendaBaseHref;

  const contextualHandoffItem =
    (currentAgendaItem && isHandoffAgendaItem(currentAgendaItem as RichAgendaItem)
      ? (currentAgendaItem as RichAgendaItem)
      : nextAgendaItem && isHandoffAgendaItem(nextAgendaItem as RichAgendaItem)
        ? (nextAgendaItem as RichAgendaItem)
        : null) ?? null;
  const handoffIsLive = contextualHandoffItem?.id === currentAgendaItem?.id;
  const selectedAgendaOwnsHandoffControls = contextualHandoffItem?.id === selectedAgendaItem?.id;
  const handoffAgendaHref = contextualHandoffItem
    ? buildAdminHref({
        lang,
        section: "run",
        instanceId,
        agendaItemId: contextualHandoffItem.id,
      })
    : null;

  const instanceWhenLabel = selectedInstance?.workshopMeta.dateRange ?? state.workshopMeta.dateRange;
  const instanceWhereLabel =
    (selectedInstance ? getWorkshopLocationLines(selectedInstance).join(" / ") : "") ||
    state.workshopMeta.city;
  const instanceOwnerLabel = selectedInstance?.workshopMeta.facilitatorLabel ?? "n/a";

  return {
    lang,
    copy,
    activeSection,
    visibleSection,
    activeOverlay,
    errorParam: query?.error,
    passwordParam: query?.password,
    isNeonMode,
    state,
    latestArchive,
    facilitatorGrants,
    currentFacilitator,
    rotationSignals,
    participantAccess,
    participantAccessFlash,
    participantAccessExpiresValue,
    currentAgendaItem: currentAgendaItem as RichAgendaItem | null | undefined,
    nextAgendaItem: nextAgendaItem as RichAgendaItem | null | undefined,
    selectedInstance,
    selectedAgendaItem,
    outlineAgendaItems,
    roomScenes,
    participantScenes,
    selectedScene,
    selectedRoomScene,
    selectedParticipantScene,
    selectedTeam,
    selectedTeamCheckpoint,
    isOwner,
    signedInEmail,
    fileModeUsername,
    overviewState,
    sessionState,
    persistentSummaryRows,
    showAgendaDetail,
    selectedDefaultScene,
    selectedAgendaProjectionHref,
    selectedAgendaParticipantMirrorHref,
    agendaIndexHref,
    agendaBaseHref,
    sceneBaseHref,
    liveAgendaHref,
    contextualHandoffItem,
    handoffIsLive,
    selectedAgendaOwnsHandoffControls,
    handoffAgendaHref,
    instanceWhenLabel,
    instanceWhereLabel,
    instanceOwnerLabel,
  };
}
