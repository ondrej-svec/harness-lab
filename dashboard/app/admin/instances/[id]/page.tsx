import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  addAgendaItemAction,
  moveAgendaItemAction,
  removeAgendaItemAction,
  saveAgendaDetailsAction,
  setAgendaAction,
} from "./_actions/agenda";
import { signOutAction } from "./_actions/operations";
import {
  addPresenterSceneAction,
  movePresenterSceneAction,
  removePresenterSceneAction,
  setDefaultPresenterSceneAction,
  togglePresenterSceneEnabledAction,
  updatePresenterSceneAction,
} from "./_actions/scenes";
import { AdminActionStateFields } from "./_components/admin-action-state-fields";
import type { RichAgendaItem, RichPresenterScene } from "./_components/agenda/types";
import { ControlRoomPersistentSummary } from "./_components/control-room-summary";
import { OutlineRail, type OutlineAgendaItem } from "./_components/outline-rail";
import { AccessSection } from "./_components/sections/access-section";
import { AgendaSection } from "./_components/sections/agenda-section";
import { SettingsSection } from "./_components/sections/settings-section";
import { SignalsSection } from "./_components/sections/signals-section";
import { TeamsSection } from "./_components/sections/teams-section";
import {
  participantAccessFlashCookieName,
  parseParticipantAccessFlash,
} from "./_lib/participant-access-flash";
import { AdminRouteLink } from "@/app/admin/admin-route-link";
import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { auth } from "@/lib/auth/server";
import {
  buildAdminHref,
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
  type AdminSection,
} from "@/lib/admin-page-view-model";
import { getInstanceGrantRepository } from "@/lib/instance-grant-repository";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";
import { getFacilitatorParticipantAccessState } from "@/lib/participant-access-management";
import { adminCopy, resolveUiLanguage, type UiLanguage } from "@/lib/ui-language";
import { ThemeSwitcher } from "../../../components/theme-switcher";
import { buildParticipantMirrorHref, buildPresenterRouteHref } from "@/lib/presenter-view-model";
import {
  type AgendaItem,
  type PresenterScene,
  type Team,
} from "@/lib/workshop-data";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import {
  getWorkshopState,
  getLatestWorkshopArchive,
  listRotationSignals,
} from "@/lib/workshop-store";
import type { RotationSignal } from "@/lib/runtime-contracts";
import {
  AdminLanguageSwitcher,
  AdminSheet,
  FieldLabel,
  StatusPill,
  adminDangerButtonClassName,
  adminInputClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "../../admin-ui";
import { SceneBlockEditor } from "./scene-block-editor";

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

function listToTextareaValue(items?: string[]) {
  return (items ?? []).join("\n");
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
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
        <header className="relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_62%)]" />
          <div className="relative space-y-5 p-6 sm:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <AdminRouteLink
                  href={buildAdminWorkspaceHref({ lang })}
                  className="inline-flex text-sm lowercase text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                >
                  {copy.controlRoomBack}
                </AdminRouteLink>
                <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{copy.deskEyebrow}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {selectedInstance ? (
                    <StatusPill
                      label={buildWorkspaceStatusLabel(copy, selectedInstance.status)}
                      tone={selectedInstance.status === "running" ? "live" : selectedInstance.status === "archived" ? "archived" : "neutral"}
                    />
                  ) : null}
                  <p className="text-sm text-[var(--text-muted)]">{state.workshopId}</p>
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
                  {selectedInstance ? getWorkshopDisplayTitle(selectedInstance) : copy.pageTitle}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{copy.controlRoomBody}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <ControlRoomHeaderMeta label={copy.workspaceWhenLabel} value={instanceWhenLabel} />
                  <ControlRoomHeaderMeta label={copy.workspaceWhereLabel} value={instanceWhereLabel} />
                  <ControlRoomHeaderMeta label={copy.workspaceOwnerLabel} value={instanceOwnerLabel} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-start text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] xl:justify-end">
                <AdminLanguageSwitcher
                  lang={lang}
                  csHref={buildAdminHref({
                    lang: "cs",
                    section: visibleSection,
                    instanceId: activeInstanceId,
                    teamId: query?.team ?? null,
                    agendaItemId: showAgendaDetail ? selectedAgendaItem?.id ?? null : null,
                    sceneId: showAgendaDetail ? selectedScene?.id ?? null : null,
                    overlay: visibleSection === "agenda" ? activeOverlay : null,
                  })}
                  enHref={buildAdminHref({
                    lang: "en",
                    section: visibleSection,
                    instanceId: activeInstanceId,
                    teamId: query?.team ?? null,
                    agendaItemId: showAgendaDetail ? selectedAgendaItem?.id ?? null : null,
                    sceneId: showAgendaDetail ? selectedScene?.id ?? null : null,
                    overlay: visibleSection === "agenda" ? activeOverlay : null,
                  })}
                />
                <span>/</span>
                <ThemeSwitcher />
                <span>/</span>
                <form action={signOutAction}>
                  <input name="lang" type="hidden" value={lang} />
                  <AdminSubmitButton className="text-xs lowercase text-[var(--text-muted)] transition hover:text-[var(--text-primary)]">
                    {copy.signOutButton}
                  </AdminSubmitButton>
                </form>
              </div>
            </div>

            <nav className="grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-4 sm:flex sm:flex-wrap sm:gap-x-3 sm:gap-y-3 xl:hidden">
              <AdminSectionLink
                lang={lang}
                section="agenda"
                activeSection={visibleSection}
                label={copy.navAgenda}
                instanceId={activeInstanceId}
              />
              <AdminSectionLink
                lang={lang}
                section="teams"
                activeSection={visibleSection}
                label={copy.navTeams}
                instanceId={activeInstanceId}
              />
              <AdminSectionLink
                lang={lang}
                section="signals"
                activeSection={visibleSection}
                label={copy.navSignals}
                instanceId={activeInstanceId}
              />
              <AdminSectionLink
                lang={lang}
                section="access"
                activeSection={visibleSection}
                label={copy.navAccess}
                instanceId={activeInstanceId}
              />
              <AdminSectionLink
                lang={lang}
                section="settings"
                activeSection={visibleSection}
                label={copy.navSettings}
                instanceId={activeInstanceId}
              />
            </nav>
            <div className="grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2 xl:grid-cols-4">
              {persistentSummaryRows.map((row) => (
                <ControlRoomPersistentSummary key={row.label} label={row.label} value={row.value} hint={row.hint} />
              ))}
            </div>
            <div className="flex flex-col gap-2 text-xs leading-5 text-[var(--text-muted)]">
              {sessionState.signedInLine ? <p>{sessionState.signedInLine}</p> : null}
              {sessionState.archiveLine ? <p>{sessionState.archiveLine}</p> : null}
            </div>
          </div>
        </header>

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
      {visibleSection === "agenda" && activeOverlay === "agenda-edit" && showAgendaDetail && selectedAgendaItem ? (
        <AdminSheet
          eyebrow={copy.agendaEditEyebrow}
          title={copy.agendaEditTitle}
          description={copy.agendaEditDescription}
          closeHref={agendaBaseHref}
          closeLabel={copy.closePanelButton}
        >
          <AgendaItemEditorSheetBody item={selectedAgendaItem} lang={lang} section="agenda" instanceId={activeInstanceId} copy={copy} />
        </AdminSheet>
      ) : null}
      {visibleSection === "agenda" && activeOverlay === "agenda-add" ? (
        <AdminSheet
          eyebrow={copy.agendaEditEyebrow}
          title={copy.addAgendaItemTitle}
          description={copy.addAgendaItemDescription}
          closeHref={agendaBaseHref}
          closeLabel={copy.closePanelButton}
        >
          <AgendaItemCreateSheetBody
            agenda={state.agenda}
            selectedAgendaItemId={selectedAgendaItem?.id ?? null}
            lang={lang}
            section="agenda"
            instanceId={activeInstanceId}
            copy={copy}
          />
        </AdminSheet>
      ) : null}
      {visibleSection === "agenda" && activeOverlay === "scene-edit" && selectedAgendaItem && selectedScene ? (
        <AdminSheet
          eyebrow={copy.agendaPresenterGroupTitle}
          title={copy.sceneEditTitle}
          description={copy.sceneEditDescription}
          closeHref={sceneBaseHref}
          closeLabel={copy.closePanelButton}
        >
          <PresenterSceneEditorSheetBody
            item={selectedAgendaItem}
            scene={selectedScene}
            lang={lang}
            section="agenda"
            instanceId={activeInstanceId}
            copy={copy}
          />
        </AdminSheet>
      ) : null}
      {visibleSection === "agenda" && activeOverlay === "scene-add" && selectedAgendaItem ? (
        <AdminSheet
          eyebrow={copy.agendaPresenterGroupTitle}
          title={copy.sceneAddTitle}
          description={copy.sceneAddDescription}
          closeHref={sceneBaseHref}
          closeLabel={copy.closePanelButton}
        >
          <PresenterSceneCreateSheetBody
            item={selectedAgendaItem}
            lang={lang}
            section="agenda"
            instanceId={activeInstanceId}
            copy={copy}
          />
        </AdminSheet>
      ) : null}
    </main>
  );
}

function ControlRoomHeaderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function AgendaItemEditorSheetBody({
  item,
  lang,
  section,
  instanceId,
  copy,
}: {
  item: RichAgendaItem;
  lang: UiLanguage;
  section: AdminSection;
  instanceId: string;
  copy: (typeof adminCopy)[UiLanguage];
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.runtimeCopyBadge}</p>
        <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">
          {item.time} • {item.title}
        </p>
      </div>

      <form action={saveAgendaDetailsAction} className="space-y-4">
        <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
        <input name="agendaId" type="hidden" value={item.id} />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem]">
          <div>
            <FieldLabel htmlFor="agenda-title">{copy.agendaFieldTitle}</FieldLabel>
            <input id="agenda-title" name="title" defaultValue={item.title} className={`${adminInputClassName} mt-2`} />
          </div>
          <div>
            <FieldLabel htmlFor="agenda-time">{copy.agendaFieldTime}</FieldLabel>
            <input id="agenda-time" name="time" defaultValue={item.time} className={`${adminInputClassName} mt-2`} />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="agenda-goal">{copy.agendaFieldGoal}</FieldLabel>
          <textarea
            id="agenda-goal"
            name="goal"
            rows={3}
            defaultValue={item.goal}
            className={`${adminInputClassName} mt-2`}
          />
        </div>
        <div>
          <FieldLabel htmlFor="agenda-room-summary">{copy.agendaFieldRoomSummary}</FieldLabel>
          <textarea
            id="agenda-room-summary"
            name="roomSummary"
            rows={4}
            defaultValue={item.roomSummary}
            className={`${adminInputClassName} mt-2`}
          />
        </div>
        <div>
          <FieldLabel htmlFor="agenda-prompts">{copy.agendaFieldFacilitatorPrompts}</FieldLabel>
          <textarea
            id="agenda-prompts"
            name="facilitatorPrompts"
            rows={5}
            defaultValue={listToTextareaValue(item.facilitatorPrompts)}
            className={`${adminInputClassName} mt-2`}
          />
        </div>
        <div>
          <FieldLabel htmlFor="agenda-watch-fors">{copy.agendaFieldWatchFors}</FieldLabel>
          <textarea
            id="agenda-watch-fors"
            name="watchFors"
            rows={5}
            defaultValue={listToTextareaValue(item.watchFors)}
            className={`${adminInputClassName} mt-2`}
          />
        </div>
        <div>
          <FieldLabel htmlFor="agenda-checkpoints">{copy.agendaFieldCheckpointQuestions}</FieldLabel>
          <textarea
            id="agenda-checkpoints"
            name="checkpointQuestions"
            rows={5}
            defaultValue={listToTextareaValue(item.checkpointQuestions)}
            className={`${adminInputClassName} mt-2`}
          />
        </div>
        <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>{copy.saveAgendaItemButton}</AdminSubmitButton>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        <form action={moveAgendaItemAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaId" type="hidden" value={item.id} />
          <input name="direction" type="hidden" value="up" />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>{copy.moveUpButton}</AdminSubmitButton>
        </form>
        <form action={moveAgendaItemAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaId" type="hidden" value={item.id} />
          <input name="direction" type="hidden" value="down" />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>{copy.moveDownButton}</AdminSubmitButton>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <form action={setAgendaAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaId" type="hidden" value={item.id} />
          <input name="returnTo" type="hidden" value="detail" />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>{copy.setCurrentPhase}</AdminSubmitButton>
        </form>
        <form action={removeAgendaItemAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaId" type="hidden" value={item.id} />
          <AdminSubmitButton className={`${adminDangerButtonClassName} w-full`}>{copy.removeAgendaItemButton}</AdminSubmitButton>
        </form>
      </div>
    </div>
  );
}

function AgendaItemCreateSheetBody({
  agenda,
  selectedAgendaItemId,
  lang,
  section,
  instanceId,
  copy,
}: {
  agenda: AgendaItem[];
  selectedAgendaItemId: string | null;
  lang: UiLanguage;
  section: AdminSection;
  instanceId: string;
  copy: (typeof adminCopy)[UiLanguage];
}) {
  return (
    <form action={addAgendaItemAction} className="space-y-4">
      <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
      <div>
        <FieldLabel htmlFor="new-agenda-title">{copy.agendaFieldTitle}</FieldLabel>
        <input id="new-agenda-title" name="title" placeholder={copy.addAgendaItemTitle} className={`${adminInputClassName} mt-2`} />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-time">{copy.agendaFieldTime}</FieldLabel>
        <input id="new-agenda-time" name="time" placeholder="16:10" className={`${adminInputClassName} mt-2`} />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-goal">{copy.agendaFieldGoal}</FieldLabel>
        <textarea
          id="new-agenda-goal"
          name="goal"
          rows={3}
          placeholder={copy.agendaNewGoalPlaceholder}
          className={`${adminInputClassName} mt-2`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-room-summary">{copy.agendaFieldRoomSummary}</FieldLabel>
        <textarea
          id="new-agenda-room-summary"
          name="roomSummary"
          rows={4}
          placeholder={copy.teamCheckpointPlaceholder}
          className={`${adminInputClassName} mt-2`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-prompts">{copy.agendaFieldFacilitatorPrompts}</FieldLabel>
        <textarea
          id="new-agenda-prompts"
          name="facilitatorPrompts"
          rows={4}
          placeholder={copy.agendaNewPromptPlaceholder}
          className={`${adminInputClassName} mt-2`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-watch-fors">{copy.agendaFieldWatchFors}</FieldLabel>
        <textarea
          id="new-agenda-watch-fors"
          name="watchFors"
          rows={4}
          placeholder={copy.agendaNewWatchForPlaceholder}
          className={`${adminInputClassName} mt-2`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-checkpoints">{copy.agendaFieldCheckpointQuestions}</FieldLabel>
        <textarea
          id="new-agenda-checkpoints"
          name="checkpointQuestions"
          rows={4}
          placeholder={copy.agendaNewCheckpointPlaceholder}
          className={`${adminInputClassName} mt-2`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="new-agenda-after">{copy.agendaFieldInsertAfter}</FieldLabel>
        <select
          id="new-agenda-after"
          name="afterItemId"
          defaultValue={selectedAgendaItemId ?? ""}
          className={`${adminInputClassName} mt-2`}
        >
          {agenda.map((item) => (
            <option key={item.id} value={item.id}>
              {item.time} • {item.title}
            </option>
          ))}
        </select>
      </div>
      <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>{copy.addAgendaItemButton}</AdminSubmitButton>
    </form>
  );
}

const presenterSceneTypeOptions: PresenterScene["sceneType"][] = [
  "briefing",
  "demo",
  "participant-view",
  "checkpoint",
  "reflection",
  "transition",
  "custom",
];

const presenterSceneIntentOptions: PresenterScene["intent"][] = [
  "framing",
  "teaching",
  "demo",
  "walkthrough",
  "checkpoint",
  "transition",
  "reflection",
  "custom",
];

const presenterChromePresetOptions: PresenterScene["chromePreset"][] = [
  "minimal",
  "agenda",
  "checkpoint",
  "participant",
  "team-trail",
];

function PresenterSceneCreateSheetBody({
  item,
  lang,
  section,
  instanceId,
  copy,
}: {
  item: RichAgendaItem;
  lang: UiLanguage;
  section: AdminSection;
  instanceId: string;
  copy: (typeof adminCopy)[UiLanguage];
}) {
  return (
    <form action={addPresenterSceneAction} className="space-y-4">
      <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
      <input name="agendaItemId" type="hidden" value={item.id} />
      <PresenterSceneFormFields copy={copy} lang={lang} />
      <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>{copy.createSceneButton}</AdminSubmitButton>
    </form>
  );
}

function PresenterSceneEditorSheetBody({
  item,
  scene,
  lang,
  section,
  instanceId,
  copy,
}: {
  item: RichAgendaItem;
  scene: RichPresenterScene;
  lang: UiLanguage;
  section: AdminSection;
  instanceId: string;
  copy: (typeof adminCopy)[UiLanguage];
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.time} • {item.title}</p>
        <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">{scene.label}</p>
      </div>

      <form action={updatePresenterSceneAction} className="space-y-4">
        <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
        <input name="agendaItemId" type="hidden" value={item.id} />
        <input name="sceneId" type="hidden" value={scene.id} />
        <PresenterSceneFormFields copy={copy} lang={lang} scene={scene} />
        <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>{copy.saveSceneButton}</AdminSubmitButton>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        <form action={movePresenterSceneAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaItemId" type="hidden" value={item.id} />
          <input name="sceneId" type="hidden" value={scene.id} />
          <input name="direction" type="hidden" value="up" />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>{copy.presenterMoveSceneUpButton}</AdminSubmitButton>
        </form>
        <form action={movePresenterSceneAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaItemId" type="hidden" value={item.id} />
          <input name="sceneId" type="hidden" value={scene.id} />
          <input name="direction" type="hidden" value="down" />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>{copy.presenterMoveSceneDownButton}</AdminSubmitButton>
        </form>
        <form action={setDefaultPresenterSceneAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaItemId" type="hidden" value={item.id} />
          <input name="sceneId" type="hidden" value={scene.id} />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>{copy.presenterSetDefaultSceneButton}</AdminSubmitButton>
        </form>
        <form action={togglePresenterSceneEnabledAction}>
          <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
          <input name="agendaItemId" type="hidden" value={item.id} />
          <input name="sceneId" type="hidden" value={scene.id} />
          <input name="enabled" type="hidden" value={scene.enabled ? "false" : "true"} />
          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>
            {scene.enabled ? copy.presenterHideSceneButton : copy.presenterShowSceneButton}
          </AdminSubmitButton>
        </form>
      </div>

      <form action={removePresenterSceneAction}>
        <AdminActionStateFields lang={lang} section={section} instanceId={instanceId} />
        <input name="agendaItemId" type="hidden" value={item.id} />
        <input name="sceneId" type="hidden" value={scene.id} />
        <AdminSubmitButton className={`${adminDangerButtonClassName} w-full`}>{copy.presenterRemoveSceneButton}</AdminSubmitButton>
      </form>
    </div>
  );
}

function PresenterSceneFormFields({
  copy,
  lang,
  scene,
}: {
  copy: (typeof adminCopy)[UiLanguage];
  lang: UiLanguage;
  scene?: RichPresenterScene;
}) {
  return (
    <>
      <div>
        <FieldLabel htmlFor="scene-label">{copy.sceneFieldLabel}</FieldLabel>
        <input id="scene-label" name="label" defaultValue={scene?.label ?? ""} className={`${adminInputClassName} mt-2`} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <FieldLabel htmlFor="scene-type">{copy.sceneFieldType}</FieldLabel>
          <select id="scene-type" name="sceneType" defaultValue={scene?.sceneType ?? "briefing"} className={`${adminInputClassName} mt-2`}>
            {presenterSceneTypeOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="scene-intent">{copy.sceneFieldIntent}</FieldLabel>
          <select id="scene-intent" name="intent" defaultValue={scene?.intent ?? "framing"} className={`${adminInputClassName} mt-2`}>
            {presenterSceneIntentOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="scene-preset">{copy.sceneFieldChromePreset}</FieldLabel>
          <select
            id="scene-preset"
            name="chromePreset"
            defaultValue={scene?.chromePreset ?? "minimal"}
            className={`${adminInputClassName} mt-2`}
          >
            {presenterChromePresetOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="scene-title">{copy.sceneFieldTitle}</FieldLabel>
        <input id="scene-title" name="title" defaultValue={scene?.title ?? ""} className={`${adminInputClassName} mt-2`} />
      </div>
      <div>
        <FieldLabel htmlFor="scene-body">{copy.sceneFieldBody}</FieldLabel>
        <textarea id="scene-body" name="body" rows={4} defaultValue={scene?.body ?? ""} className={`${adminInputClassName} mt-2`} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <FieldLabel htmlFor="scene-cta-label">{copy.sceneFieldCtaLabel}</FieldLabel>
          <input id="scene-cta-label" name="ctaLabel" defaultValue={scene?.ctaLabel ?? ""} className={`${adminInputClassName} mt-2`} />
        </div>
        <div>
          <FieldLabel htmlFor="scene-cta-href">{copy.sceneFieldCtaHref}</FieldLabel>
          <input id="scene-cta-href" name="ctaHref" defaultValue={scene?.ctaHref ?? ""} className={`${adminInputClassName} mt-2`} />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="scene-notes">{copy.sceneFieldFacilitatorNotes}</FieldLabel>
        <textarea
          id="scene-notes"
          name="facilitatorNotes"
          rows={4}
          defaultValue={listToTextareaValue(scene?.facilitatorNotes)}
          className={`${adminInputClassName} mt-2`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="scene-source-refs">{copy.sceneFieldSourceRefs}</FieldLabel>
        <textarea
          id="scene-source-refs"
          name="sourceRefs"
          rows={6}
          defaultValue={stringifyJson(scene?.sourceRefs ?? [])}
          className={`${adminInputClassName} mt-2 font-mono text-xs leading-6`}
        />
      </div>
      <div>
        <FieldLabel htmlFor="scene-block-editor">{copy.sceneFieldBlocks}</FieldLabel>
        <SceneBlockEditor initialBlocks={scene?.blocks ?? []} inputName="blocks" lang={lang} />
        <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{copy.sceneJsonHint}</p>
      </div>
    </>
  );
}

function AdminSectionLink({
  lang,
  section,
  activeSection,
  label,
  instanceId,
  tone = "light",
}: {
  lang: UiLanguage;
  section: AdminSection;
  activeSection: AdminSection;
  label: string;
  instanceId: string;
  tone?: "light" | "dark";
}) {
  const href = buildAdminHref({ lang, section, instanceId });
  const active = section === activeSection;
  const dark = tone === "dark";

  return (
    <AdminRouteLink
      href={href}
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-center text-sm font-medium lowercase transition duration-200 hover:-translate-y-0.5 ${
        dark
          ? active
            ? "border-[var(--hero-border)] bg-[var(--hero-tile-hover)] text-[var(--hero-text)] shadow-[var(--hero-shadow-soft)]"
            : "border-transparent text-[var(--hero-secondary)] hover:border-[var(--hero-border)] hover:bg-[var(--hero-tile-bg)] hover:text-[var(--hero-text)]"
          : active
            ? "border-[var(--border-strong)] bg-[var(--surface-soft)] text-[var(--text-primary)] shadow-[0_10px_24px_rgba(28,25,23,0.08)]"
            : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </AdminRouteLink>
  );
}
