import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RichAgendaItem } from "./_components/agenda/types";
import { ControlRoomHeader } from "./_components/control-room-header";
import { ControlRoomPersistentSummary } from "./_components/control-room-summary";
import { OutlineRail, type OutlineAgendaItem } from "./_components/outline-rail";
import { AccessSection } from "./_components/sections/access-section";
import { AgendaSection } from "./_components/sections/agenda-section";
import { SettingsSection } from "./_components/sections/settings-section";
import { SignalsSection } from "./_components/sections/signals-section";
import { TeamsSection } from "./_components/sections/teams-section";
import { AgendaSheetOverlays } from "./_components/sheets/agenda-sheet-overlays";
import {
  participantAccessFlashCookieName,
  parseParticipantAccessFlash,
} from "./_lib/participant-access-flash";
import { requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { auth } from "@/lib/auth/server";
import {
  buildAdminSummaryStats,
  buildAdminWorkspaceHref,
  buildWorkspaceStatusLabel,
  buildAdminOverviewState,
  buildAdminSessionState,
  deriveAdminPageState,
  getWorkshopDisplayTitle,
  getWorkshopLocationLines,
  resolveControlRoomOverlay,
  resolveAdminSection,
  buildAdminHref,
  type AdminSection,
} from "@/lib/admin-page-view-model";
import { getInstanceGrantRepository } from "@/lib/instance-grant-repository";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";
import { getFacilitatorParticipantAccessState } from "@/lib/participant-access-management";
import { adminCopy, resolveUiLanguage } from "@/lib/ui-language";
import { buildParticipantMirrorHref, buildPresenterRouteHref } from "@/lib/presenter-view-model";
import { type AgendaItem, type Team } from "@/lib/workshop-data";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import {
  getWorkshopState,
  getLatestWorkshopArchive,
  listRotationSignals,
} from "@/lib/workshop-store";
import type { RotationSignal } from "@/lib/runtime-contracts";

export const dynamic = "force-dynamic";

function getRoomPresenterScenes(item: RichAgendaItem | null | undefined) {
  return (item?.presenterScenes ?? []).filter((scene) => scene.surface === "room");
}

function getParticipantPresenterScenes(item: RichAgendaItem | null | undefined) {
  return (item?.presenterScenes ?? []).filter((scene) => scene.surface === "participant");
}

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


export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    lang?: string;
    section?: string;
    error?: string;
    password?: string;
    team?: string;
    agendaItem?: string;
    scene?: string;
    overlay?: string;
  }>;
}) {
  const routeParams = await params;
  const query = await searchParams;
  const lang = resolveUiLanguage(query?.lang);
  const copy = adminCopy[lang];
  const activeSection = resolveAdminSection(query?.section);
  const visibleSection: AdminSection = activeSection === "live" ? "agenda" : activeSection;
  const activeOverlay = resolveControlRoomOverlay(query?.overlay);
  const errorParam = query?.error;
  const passwordParam = query?.password;
  const instanceRepo = getWorkshopInstanceRepository();
  const availableInstances = await instanceRepo.listInstances();
  const activeInstanceId = routeParams.id;

  if (!availableInstances.some((instance) => instance.id === activeInstanceId)) {
    redirect(buildAdminWorkspaceHref({ lang }));
  }

  await requireFacilitatorPageAccess(activeInstanceId);

  const isNeonMode = getRuntimeStorageMode() === "neon";
  const cookieStore = await cookies();
  const [
    loadedState,
    loadedLatestArchive,
    loadedFacilitatorGrants,
    loadedCurrentFacilitator,
    loadedAuthSession,
    loadedParticipantAccess,
    loadedRotationSignals,
  ] = await Promise.all([
    getWorkshopState(activeInstanceId),
    getLatestWorkshopArchive(activeInstanceId),
    isNeonMode ? getInstanceGrantRepository().listActiveGrants(activeInstanceId) : Promise.resolve([]),
    isNeonMode ? getFacilitatorSession(activeInstanceId) : Promise.resolve(null),
    isNeonMode && auth ? auth.getSession() : Promise.resolve({ data: null }),
    getFacilitatorParticipantAccessState(activeInstanceId),
    listRotationSignals(activeInstanceId).catch(() => [] as RotationSignal[]),
  ]);
  const state: Awaited<ReturnType<typeof getWorkshopState>> = loadedState;
  const rotationSignals = loadedRotationSignals;
  const latestArchive: Awaited<ReturnType<typeof getLatestWorkshopArchive>> = loadedLatestArchive;
  const facilitatorGrants: Awaited<ReturnType<ReturnType<typeof getInstanceGrantRepository>["listActiveGrants"]>> =
    loadedFacilitatorGrants;
  const currentFacilitator: Awaited<ReturnType<typeof getFacilitatorSession>> = loadedCurrentFacilitator;
  const authSession: Awaited<ReturnType<NonNullable<typeof auth>["getSession"]>> | { data: null } = loadedAuthSession;
  const participantAccess = loadedParticipantAccess;
  const participantAccessFlash = parseParticipantAccessFlash(
    cookieStore.get(participantAccessFlashCookieName)?.value,
    activeInstanceId,
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
    activeInstanceId,
  );
  const requestedAgendaItem = state.agenda.find((item: AgendaItem) => item.id === query?.agendaItem) as RichAgendaItem | undefined;
  const selectedAgendaItem = (requestedAgendaItem ?? currentAgendaItem ?? state.agenda[0]) as RichAgendaItem | undefined;
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
    selectedAgendaItem?.presenterScenes.find((scene) => scene.id === selectedAgendaItem.defaultPresenterSceneId) ??
    selectedAgendaItem?.presenterScenes[0] ??
    null;
  const selectedRoomScene =
    roomScenes.find((scene) => scene.id === query?.scene) ??
    roomScenes.find((scene) => scene.id === selectedAgendaItem?.defaultPresenterSceneId) ??
    roomScenes[0] ??
    null;
  const selectedParticipantScene =
    participantScenes.find((scene) => scene.id === query?.scene) ??
    participantScenes[0] ??
    null;
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
    activeInstanceId,
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
  const showAgendaDetail = visibleSection === "agenda" && Boolean(requestedAgendaItem);
  const selectedDefaultScene =
    roomScenes.find((scene) => scene.id === selectedAgendaItem?.defaultPresenterSceneId) ??
    roomScenes[0] ??
    null;
  const selectedAgendaProjectionHref = selectedAgendaItem
    ? buildPresenterRouteHref({
        lang,
        instanceId: activeInstanceId,
        agendaItemId: selectedAgendaItem.id,
        sceneId: selectedDefaultScene?.id ?? null,
      })
    : null;
  const selectedAgendaParticipantMirrorHref = buildParticipantMirrorHref({
    lang,
    instanceId: activeInstanceId,
  });
  const agendaIndexHref = buildAdminHref({
    lang,
    section: "agenda",
    instanceId: activeInstanceId,
  });
  const agendaDetailHref = buildAdminHref({
    lang,
    section: "agenda",
    instanceId: activeInstanceId,
    agendaItemId: selectedAgendaItem?.id ?? null,
  });
  const agendaBaseHref = showAgendaDetail ? agendaDetailHref : agendaIndexHref;
  const agendaEditHref =
    selectedAgendaItem
      ? buildAdminHref({
          lang,
          section: "agenda",
          instanceId: activeInstanceId,
          agendaItemId: selectedAgendaItem.id,
          overlay: "agenda-edit",
        })
      : agendaBaseHref;
  const agendaAddHref = buildAdminHref({
    lang,
    section: "agenda",
    instanceId: activeInstanceId,
    agendaItemId: selectedAgendaItem?.id ?? null,
    overlay: "agenda-add",
  });
  const sceneBaseHref = buildAdminHref({
    lang,
    section: "agenda",
    instanceId: activeInstanceId,
    agendaItemId: selectedAgendaItem?.id ?? null,
    sceneId: selectedScene?.id ?? null,
  });
  const sceneAddHref = buildAdminHref({
    lang,
    section: "agenda",
    instanceId: activeInstanceId,
    agendaItemId: selectedAgendaItem?.id ?? null,
    overlay: "scene-add",
  });
  const roomSceneEditHref =
    selectedAgendaItem && selectedRoomScene
      ? buildAdminHref({
          lang,
          section: "agenda",
          instanceId: activeInstanceId,
          agendaItemId: selectedAgendaItem.id,
          sceneId: selectedRoomScene.id,
          overlay: "scene-edit",
        })
      : sceneBaseHref;
  const participantSceneEditHref =
    selectedAgendaItem && selectedParticipantScene
      ? buildAdminHref({
          lang,
          section: "agenda",
          instanceId: activeInstanceId,
          agendaItemId: selectedAgendaItem.id,
          sceneId: selectedParticipantScene.id,
          overlay: "scene-edit",
        })
      : sceneBaseHref;
  const liveAgendaHref =
    currentAgendaItem
      ? buildAdminHref({
          lang,
          section: "agenda",
          instanceId: activeInstanceId,
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
        section: "agenda",
        instanceId: activeInstanceId,
        agendaItemId: contextualHandoffItem.id,
      })
    : null;
  const instanceWhenLabel = selectedInstance?.workshopMeta.dateRange ?? state.workshopMeta.dateRange;
  const instanceWhereLabel = (selectedInstance ? getWorkshopLocationLines(selectedInstance).join(" / ") : "") || state.workshopMeta.city;
  const instanceOwnerLabel = selectedInstance?.workshopMeta.facilitatorLabel ?? "n/a";

  return (
    <main className="min-h-screen bg-[var(--surface-admin)] bg-[radial-gradient(circle_at_top_left,var(--ambient-right),transparent_34%),radial-gradient(circle_at_top_right,var(--ambient-left),transparent_24%),linear-gradient(180deg,var(--surface-admin),var(--surface-elevated))] px-4 py-6 text-[var(--text-primary)] sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-[112rem] flex-col gap-6">
        <ControlRoomHeader
          lang={lang}
          copy={copy}
          instanceId={activeInstanceId}
          visibleSection={visibleSection}
          activeOverlay={activeOverlay}
          instanceBadge={
            selectedInstance
              ? {
                  statusLabel: buildWorkspaceStatusLabel(copy, selectedInstance.status),
                  statusTone:
                    selectedInstance.status === "running"
                      ? "live"
                      : selectedInstance.status === "archived"
                        ? "archived"
                        : "neutral",
                  displayTitle: getWorkshopDisplayTitle(selectedInstance),
                }
              : null
          }
          workshopId={state.workshopId}
          selectedAgendaItemId={selectedAgendaItem?.id ?? null}
          selectedSceneId={selectedScene?.id ?? null}
          selectedTeamId={query?.team ?? null}
          showAgendaDetail={showAgendaDetail}
          instanceWhenLabel={instanceWhenLabel}
          instanceWhereLabel={instanceWhereLabel}
          instanceOwnerLabel={instanceOwnerLabel}
        />
        <div className="rounded-[34px] border border-[var(--border)] bg-[var(--surface-panel)] px-6 py-5 shadow-[var(--shadow-soft)] backdrop-blur sm:px-7">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {persistentSummaryRows.map((row) => (
              <ControlRoomPersistentSummary key={row.label} label={row.label} value={row.value} hint={row.hint} />
            ))}
          </div>
          {(sessionState.signedInLine || sessionState.archiveLine) && (
            <div className="mt-4 flex flex-col gap-2 text-xs leading-5 text-[var(--text-muted)]">
              {sessionState.signedInLine ? <p>{sessionState.signedInLine}</p> : null}
              {sessionState.archiveLine ? <p>{sessionState.archiveLine}</p> : null}
            </div>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)] 2xl:grid-cols-[17rem_minmax(0,1fr)]">
          <OutlineRail
            lang={lang}
            instanceId={activeInstanceId}
            activeSection={visibleSection}
            activeAgendaItemId={selectedAgendaItem?.id ?? null}
            workshopLabel={state.workshopId}
            agendaItems={outlineAgendaItems}
            copy={copy}
          />

          <div className="space-y-6 2xl:space-y-7">
        {visibleSection === "agenda" ? (
          <AgendaSection
            lang={lang}
            copy={copy}
            instanceId={activeInstanceId}
            state={state}
            selectedAgendaItem={selectedAgendaItem ?? null}
            currentAgendaItem={(currentAgendaItem as RichAgendaItem | null) ?? null}
            nextAgendaItem={(nextAgendaItem as RichAgendaItem | null) ?? null}
            roomScenes={roomScenes}
            participantScenes={participantScenes}
            selectedScene={selectedScene}
            selectedRoomScene={selectedRoomScene}
            selectedParticipantScene={selectedParticipantScene}
            selectedDefaultScene={selectedDefaultScene}
            showAgendaDetail={showAgendaDetail}
            overviewState={overviewState}
            rotationSignals={rotationSignals}
            contextualHandoffItem={contextualHandoffItem}
            handoffIsLive={handoffIsLive}
            selectedAgendaOwnsHandoffControls={selectedAgendaOwnsHandoffControls}
            handoffAgendaHref={handoffAgendaHref}
            agendaIndexHref={agendaIndexHref}
            agendaEditHref={agendaEditHref}
            agendaAddHref={agendaAddHref}
            liveAgendaHref={liveAgendaHref}
            sceneAddHref={sceneAddHref}
            roomSceneEditHref={roomSceneEditHref}
            participantSceneEditHref={participantSceneEditHref}
            selectedAgendaProjectionHref={selectedAgendaProjectionHref}
            selectedAgendaParticipantMirrorHref={selectedAgendaParticipantMirrorHref}
          />
        ) : null}

        {activeSection === "teams" ? (
          <TeamsSection
            lang={lang}
            copy={copy}
            instanceId={activeInstanceId}
            state={state}
            selectedTeam={selectedTeam}
            selectedTeamCheckpoint={selectedTeamCheckpoint}
          />
        ) : null}

        {activeSection === "signals" ? (
          <SignalsSection lang={lang} copy={copy} instanceId={activeInstanceId} state={state} />
        ) : null}

        {activeSection === "access" ? (
          <AccessSection
            lang={lang}
            copy={copy}
            instanceId={activeInstanceId}
            isNeonMode={isNeonMode}
            isOwner={isOwner}
            currentFacilitatorGrantId={currentFacilitator?.grant.id ?? null}
            fileModeUsername={fileModeUsername}
            errorParam={errorParam}
            participantAccess={participantAccess}
            participantAccessExpiresValue={participantAccessExpiresValue}
            participantAccessFlash={participantAccessFlash}
            facilitatorGrants={facilitatorGrants}
          />
        ) : null}

        {activeSection === "settings" ? (
          <SettingsSection
            lang={lang}
            copy={copy}
            instanceId={activeInstanceId}
            isNeonMode={isNeonMode}
            hasAuth={Boolean(auth)}
            signedInEmail={signedInEmail}
            currentFacilitator={currentFacilitator}
            workshopId={state.workshopId}
            participantStateLabel={overviewState.participantState}
            passwordParam={passwordParam}
            errorParam={errorParam}
          />
        ) : null}
          </div>
        </div>
      </div>
      {visibleSection === "agenda" ? (
        <AgendaSheetOverlays
          lang={lang}
          copy={copy}
          instanceId={activeInstanceId}
          activeOverlay={activeOverlay}
          showAgendaDetail={showAgendaDetail}
          selectedAgendaItem={selectedAgendaItem}
          selectedScene={selectedScene}
          agenda={state.agenda}
          agendaBaseHref={agendaBaseHref}
          sceneBaseHref={sceneBaseHref}
        />
      ) : null}
    </main>
  );
}
