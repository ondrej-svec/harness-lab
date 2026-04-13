import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  addAgendaItemAction,
  moveAgendaItemAction,
  removeAgendaItemAction,
  saveAgendaDetailsAction,
  setAgendaAction,
} from "./_actions/agenda";
import { renameAgendaItemAction, signOutAction, updateAgendaFieldAction } from "./_actions/operations";
import { toggleRotationAction } from "./_actions/settings";
import { InlineField } from "./_components/inline-field";
import { OutlineRail, type OutlineAgendaItem } from "./_components/outline-rail";
import { AccessSection } from "./_components/sections/access-section";
import { SettingsSection } from "./_components/sections/settings-section";
import { SignalsSection } from "./_components/sections/signals-section";
import { TeamsSection } from "./_components/sections/teams-section";
import { ViewTransitionCard } from "./_components/view-transition-card";
import {
  participantAccessFlashCookieName,
  parseParticipantAccessFlash,
} from "./_lib/participant-access-flash";
import { AdminRouteLink } from "@/app/admin/admin-route-link";
import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { requireFacilitatorActionAccess, requireFacilitatorPageAccess } from "@/lib/facilitator-access";
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
  readActionState,
  resolveControlRoomOverlay,
  resolveAdminSection,
  type AdminSection,
} from "@/lib/admin-page-view-model";
import { getInstanceGrantRepository } from "@/lib/instance-grant-repository";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";
import { buildRepoBlobUrl } from "@/lib/repo-links";
import { getFacilitatorParticipantAccessState } from "@/lib/participant-access-management";
import { adminCopy, resolveUiLanguage, type UiLanguage } from "@/lib/ui-language";
import { ThemeSwitcher } from "../../../components/theme-switcher";
import { buildParticipantMirrorHref, buildPresenterRouteHref } from "@/lib/presenter-view-model";
import {
  type AgendaItem,
  type PresenterBlock as WorkshopPresenterBlock,
  type PresenterScene,
  type RotationPlan,
  type Team,
} from "@/lib/workshop-data";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import {
  addPresenterScene,
  getWorkshopState,
  getLatestWorkshopArchive,
  movePresenterScene,
  captureRotationSignal,
  listRotationSignals,
  removePresenterScene,
  setDefaultPresenterScene,
  setPresenterSceneEnabled,
  updatePresenterScene,
} from "@/lib/workshop-store";
import type { RotationSignal } from "@/lib/runtime-contracts";
import {
  AdminLanguageSwitcher,
  AdminPanel,
  AdminSheet,
  ControlCard,
  FieldLabel,
  StatusPill,
  adminHeroPanelClassName,
  adminDangerButtonClassName,
  adminGhostButtonClassName,
  adminInputClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "../../admin-ui";
import { SceneBlockEditor } from "./scene-block-editor";

type SourceRef = {
  path: string;
  label: string;
};

type RichAgendaItem = AgendaItem & Partial<{
  goal: string;
  roomSummary: string;
  facilitatorPrompts: string[];
  watchFors: string[];
  checkpointQuestions: string[];
  sourceRefs: SourceRef[];
}>;

type PresenterBlockSummary = {
  id: string;
  type: string;
};

type RichPresenterScene = PresenterScene & Partial<{
  intent: string;
  chromePreset: string;
  blocks: PresenterBlockSummary[];
  facilitatorNotes: string[];
  sourceRefs: SourceRef[];
}>;

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

function parseTextareaList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}

function parseJsonArray<T>(value: string): T[] | undefined {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(normalized);
    return Array.isArray(parsed) ? (parsed as T[]) : undefined;
  } catch {
    return undefined;
  }
}

function buildRepoSourceHref(path: string) {
  return buildRepoBlobUrl(path);
}

function isHandoffAgendaItem(item: Partial<AgendaItem> | null | undefined) {
  return item?.intent === "handoff" || item?.id === "rotation";
}

async function addPresenterSceneAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaItemId = String(formData.get("agendaItemId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const sceneType = String(formData.get("sceneType") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const intent = String(formData.get("intent") ?? "").trim();
  const chromePreset = String(formData.get("chromePreset") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaHref = String(formData.get("ctaHref") ?? "").trim();
  const facilitatorNotes = parseTextareaList(String(formData.get("facilitatorNotes") ?? ""));
  const sourceRefs = parseJsonArray<SourceRef>(String(formData.get("sourceRefs") ?? ""));
  const blocks = parseJsonArray<WorkshopPresenterBlock>(String(formData.get("blocks") ?? ""));

  if (!agendaItemId || !label || !sceneType) {
    redirect(buildAdminHref({ lang, section, instanceId, agendaItemId, overlay: "scene-add" }));
  }

  const state = await addPresenterScene(
    agendaItemId,
    {
      label,
      sceneType: sceneType as PresenterScene["sceneType"],
      title,
      body,
      intent: (intent || undefined) as PresenterScene["intent"] | undefined,
      chromePreset: (chromePreset || undefined) as PresenterScene["chromePreset"] | undefined,
      ctaLabel: ctaLabel || null,
      ctaHref: ctaHref || null,
      facilitatorNotes,
      sourceRefs,
      blocks,
    },
    instanceId,
  );
  const agendaItem = state.agenda.find((item) => item.id === agendaItemId);
  const createdScene = [...(agendaItem?.presenterScenes ?? [])].sort((left, right) => right.order - left.order)[0] ?? null;

  redirect(
    buildAdminHref({
      lang,
      section,
      instanceId,
      agendaItemId,
      sceneId: createdScene?.id ?? null,
    }),
  );
}

async function updatePresenterSceneAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaItemId = String(formData.get("agendaItemId") ?? "").trim();
  const sceneId = String(formData.get("sceneId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const sceneType = String(formData.get("sceneType") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const intent = String(formData.get("intent") ?? "").trim();
  const chromePreset = String(formData.get("chromePreset") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaHref = String(formData.get("ctaHref") ?? "").trim();
  const facilitatorNotes = parseTextareaList(String(formData.get("facilitatorNotes") ?? ""));
  const sourceRefs = parseJsonArray<SourceRef>(String(formData.get("sourceRefs") ?? ""));
  const blocks = parseJsonArray<WorkshopPresenterBlock>(String(formData.get("blocks") ?? ""));

  if (!agendaItemId || !sceneId || !label || !sceneType) {
    redirect(buildAdminHref({ lang, section, instanceId, agendaItemId, sceneId, overlay: "scene-edit" }));
  }

  await updatePresenterScene(
    agendaItemId,
    sceneId,
    {
      label,
      sceneType: sceneType as PresenterScene["sceneType"],
      title,
      body,
      intent: (intent || undefined) as PresenterScene["intent"] | undefined,
      chromePreset: (chromePreset || undefined) as PresenterScene["chromePreset"] | undefined,
      ctaLabel: ctaLabel || null,
      ctaHref: ctaHref || null,
      facilitatorNotes,
      sourceRefs,
      blocks,
    },
    instanceId,
  );

  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId, sceneId }));
}

async function movePresenterSceneAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaItemId = String(formData.get("agendaItemId") ?? "").trim();
  const sceneId = String(formData.get("sceneId") ?? "").trim();
  const direction = String(formData.get("direction") ?? "").trim() as "up" | "down";
  if (agendaItemId && sceneId && (direction === "up" || direction === "down")) {
    await movePresenterScene(agendaItemId, sceneId, direction, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId, sceneId }));
}

async function setDefaultPresenterSceneAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaItemId = String(formData.get("agendaItemId") ?? "").trim();
  const sceneId = String(formData.get("sceneId") ?? "").trim();
  if (agendaItemId && sceneId) {
    await setDefaultPresenterScene(agendaItemId, sceneId, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId, sceneId }));
}

async function togglePresenterSceneEnabledAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaItemId = String(formData.get("agendaItemId") ?? "").trim();
  const sceneId = String(formData.get("sceneId") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "").trim() === "true";
  if (agendaItemId && sceneId) {
    await setPresenterSceneEnabled(agendaItemId, sceneId, enabled, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId, sceneId }));
}

async function removePresenterSceneAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaItemId = String(formData.get("agendaItemId") ?? "").trim();
  const sceneId = String(formData.get("sceneId") ?? "").trim();
  if (agendaItemId && sceneId) {
    await removePresenterScene(agendaItemId, sceneId, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId }));
}

async function captureRotationSignalAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);

  const freeText = String(formData.get("freeText") ?? "").trim();
  if (freeText.length === 0) {
    // The rendered form already enforces required on freeText. This guard is
    // the defense-in-depth layer for clients that bypass the HTML required
    // attribute. Silent redirect is intentional — the user retains their
    // unsubmitted value because the form POSTs via a full page reload.
    redirect(buildAdminHref({ lang, section, instanceId }));
  }

  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw.length > 0
    ? tagsRaw.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0)
    : [];

  const teamIdRaw = String(formData.get("teamId") ?? "").trim();
  const teamId = teamIdRaw.length > 0 ? teamIdRaw : undefined;

  await captureRotationSignal({ freeText, tags, teamId }, instanceId);
  redirect(buildAdminHref({ lang, section, instanceId }));
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
          <AdminPanel
            eyebrow={copy.workshopStateEyebrow}
            title={copy.agendaSectionTitle}
            description={copy.agendaSectionDescription}
          >
            <div className="space-y-6">
              {showAgendaDetail && selectedAgendaItem ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <span>{copy.agendaSectionTitle}</span>
                      <span aria-hidden="true">/</span>
                      <AdminRouteLink className="text-sm font-medium text-[var(--text-primary)] transition hover:text-[var(--text-secondary)]" href={agendaIndexHref}>
                        {copy.agendaTimelineTitle}
                      </AdminRouteLink>
                      <span aria-hidden="true">/</span>
                      <span className="text-sm text-[var(--text-primary)]">
                        {selectedAgendaItem.time} • {selectedAgendaItem.title}
                      </span>
                    </nav>
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">{copy.phaseControlHint}</p>
                  </div>

                  <div className={`${adminHeroPanelClassName} p-5 sm:p-6`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        label={
                          selectedAgendaItem.status === "current"
                            ? copy.liveNow
                            : selectedAgendaItem.status === "done"
                              ? copy.agendaStatusDone
                              : copy.agendaStatusUpcoming
                        }
                        tone={selectedAgendaItem.status === "current" ? "live" : "neutral"}
                      />
                      <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-xs text-[var(--hero-secondary)]">
                        {copy.runtimeCopyBadge}
                      </span>
                      <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-xs text-[var(--hero-secondary)]">
                        {selectedAgendaItem.kind === "custom" ? copy.customItemBadge : copy.blueprintItemBadge}
                      </span>
                    </div>
                    <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-[var(--hero-muted)]">{copy.agendaCurrentTitle}</p>
                    <h2 className="mt-3 flex flex-wrap items-baseline gap-x-3 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--hero-text)] sm:text-[2.4rem]">
                      <span>{selectedAgendaItem.time} •</span>
                      <InlineField
                        value={selectedAgendaItem.title}
                        fieldName="title"
                        label={copy.agendaCurrentTitle}
                        action={renameAgendaItemAction}
                        hiddenFields={{
                          instanceId: activeInstanceId,
                          agendaId: selectedAgendaItem.id,
                        }}
                      />
                    </h2>
                    <div className="mt-3 max-w-3xl text-sm leading-6 text-[var(--hero-secondary)]">
                      <InlineField
                        value={selectedAgendaItem.roomSummary || selectedAgendaItem.description}
                        fieldName="roomSummary"
                        label={copy.agendaDetailRoomSummaryTitle}
                        mode="textarea"
                        action={updateAgendaFieldAction}
                        hiddenFields={{
                          instanceId: activeInstanceId,
                          agendaId: selectedAgendaItem.id,
                          fieldName: "roomSummary",
                        }}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {selectedAgendaItem.id !== currentAgendaItem?.id ? (
                        <form action={setAgendaAction}>
                          <AdminActionStateFields lang={lang} section="agenda" instanceId={activeInstanceId} />
                          <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                          <input name="returnTo" type="hidden" value="detail" />
                          <AdminSubmitButton className={adminPrimaryButtonClassName}>{copy.agendaMoveLiveHereButton}</AdminSubmitButton>
                        </form>
                      ) : selectedAgendaProjectionHref ? (
                        <a
                          className={`${adminPrimaryButtonClassName} inline-flex`}
                          href={selectedAgendaProjectionHref}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {copy.presenterOpenCurrentButton}
                        </a>
                      ) : null}
                      {selectedAgendaProjectionHref && selectedAgendaItem.id !== currentAgendaItem?.id ? (
                        <a
                          className={`${adminGhostButtonClassName} inline-flex`}
                          href={selectedAgendaProjectionHref}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {copy.presenterOpenCurrentButton}
                        </a>
                      ) : null}
                      <a
                        className={`${adminSecondaryButtonClassName} inline-flex`}
                        href={selectedAgendaParticipantMirrorHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.presenterOpenParticipantSurfaceButton}
                      </a>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3">
                      <AdminRouteLink className={adminGhostButtonClassName} href={agendaEditHref}>
                        {copy.openEditSheetButton}
                      </AdminRouteLink>
                      {currentAgendaItem && selectedAgendaItem.id !== currentAgendaItem.id ? (
                        <AdminRouteLink className={adminGhostButtonClassName} href={liveAgendaHref}>
                          {copy.agendaJumpToLiveButton}
                        </AdminRouteLink>
                      ) : null}
                    </div>

                    <div className="mt-5 rounded-[20px] border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--hero-muted)]">{copy.presenterCurrentSceneLabel}</p>
                      <p className="mt-2 text-sm font-semibold text-[var(--hero-text)]">
                        {selectedDefaultScene?.label ?? copy.presenterNoSceneTitle}
                      </p>
                    </div>
                  </div>

                  {selectedAgendaOwnsHandoffControls ? (
                    <HandoffMomentCard
                      copy={copy}
                      lang={lang}
                      instanceId={activeInstanceId}
                      description={handoffIsLive ? copy.handoffMomentLiveDescription : copy.handoffMomentNextDescription}
                      participantState={overviewState.participantState}
                      slots={state.rotation.slots}
                      rotationSignals={rotationSignals}
                      teamChoices={state.teams.map((team) => ({ id: team.id, label: team.name }))}
                    />
                  ) : null}

                  <AgendaItemDetail item={selectedAgendaItem} lang={lang} copy={copy} />

                  <section className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-4 shadow-[0_14px_30px_rgba(28,25,23,0.05)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.agendaPresenterGroupTitle}</p>
                        <h3 className="mt-2 text-lg font-medium text-[var(--text-primary)]">
                          {selectedDefaultScene?.label ?? copy.presenterNoSceneTitle}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy.presenterCardDescription}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <AdminRouteLink className={adminSecondaryButtonClassName} href={sceneAddHref}>
                          {copy.presenterAddSceneButton}
                        </AdminRouteLink>
                        {selectedScene ? (
                          <AdminRouteLink className={adminGhostButtonClassName} href={roomSceneEditHref}>
                            {copy.presenterEditSceneButton}
                          </AdminRouteLink>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {roomScenes.length > 0 ? (
                        roomScenes.map((scene) => (
                          <PresenterSceneSummaryCard
                            key={scene.id}
                            scene={scene}
                            agendaItemId={selectedAgendaItem.id}
                            activeInstanceId={activeInstanceId}
                            lang={lang}
                            copy={copy}
                            isDefault={selectedAgendaItem.defaultPresenterSceneId === scene.id}
                            isSelected={selectedRoomScene?.id === scene.id}
                          />
                        ))
                      ) : (
                        <p className="text-sm leading-6 text-[var(--text-secondary)]">{copy.presenterNoSceneBody}</p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-4 shadow-[0_14px_30px_rgba(28,25,23,0.05)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.participantSurfaceCardTitle}</p>
                        <h3 className="mt-2 text-lg font-medium text-[var(--text-primary)]">
                          {selectedParticipantScene?.label ?? copy.participantSurfaceCardDescription}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy.participantSurfaceCardDescription}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={selectedAgendaParticipantMirrorHref}
                          target="_blank"
                          className={adminSecondaryButtonClassName}
                          rel="noreferrer"
                        >
                          {copy.presenterOpenParticipantSurfaceButton}
                        </a>
                        {selectedParticipantScene ? (
                          <AdminRouteLink className={adminGhostButtonClassName} href={participantSceneEditHref}>
                            {copy.presenterEditSceneButton}
                          </AdminRouteLink>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {participantScenes.length > 0 ? (
                        participantScenes.map((scene) => (
                          <PresenterSceneSummaryCard
                            key={scene.id}
                            scene={scene}
                            agendaItemId={selectedAgendaItem.id}
                            activeInstanceId={activeInstanceId}
                            lang={lang}
                            copy={copy}
                            isDefault={false}
                            isSelected={selectedParticipantScene?.id === scene.id}
                            participantOnly
                          />
                        ))
                      ) : (
                        <p className="text-sm leading-6 text-[var(--text-secondary)]">{copy.participantSurfaceRecoveryHint}</p>
                      )}
                    </div>
                  </section>

                  <details className="rounded-[22px] border border-[var(--border)] bg-[var(--card-top)] p-4">
                    <summary className="cursor-pointer list-none text-sm font-medium text-[var(--text-primary)]">
                      {copy.agendaStorageGroupTitle}
                    </summary>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
                      <p>{copy.agendaSourceBody}</p>
                      <p>
                        Repo seed: <code>dashboard/lib/workshop-data.ts</code>
                      </p>
                      <p>
                        File-mode runtime copy: <code>dashboard/data/&lt;instance&gt;/workshop-state.json</code>
                      </p>
                      <p>
                        Neon-mode runtime copy: <code>workshop_instances.workshop_state</code>
                      </p>
                    </div>
                  </details>
                </>
              ) : (
                <>
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
                    <div className={`${adminHeroPanelClassName} p-5 sm:p-6`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--hero-muted)]">
                          {copy.liveNow}
                        </span>
                        <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--hero-secondary)]">
                          {state.workshopMeta.currentPhaseLabel}
                        </span>
                      </div>
                      <h2 className="mt-4 text-[1.85rem] font-semibold tracking-[-0.05em] text-[var(--hero-text)] sm:text-3xl">
                        {overviewState.liveNowTitle}
                      </h2>
                      <p className="mt-3 max-w-3xl text-[15px] leading-6 text-[var(--hero-secondary)]">{overviewState.liveNowDescription}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                      <ControlRoomPersistentSummary
                        label={copy.currentPhase}
                        value={currentAgendaItem ? `${currentAgendaItem.time} • ${currentAgendaItem.title}` : copy.presenterNoSceneTitle}
                      />
                      <ControlRoomPersistentSummary
                        label={copy.nextUp}
                        value={nextAgendaItem ? `${nextAgendaItem.time} • ${nextAgendaItem.title}` : copy.presenterNoSceneTitle}
                      />
                      <ControlRoomPersistentSummary label={copy.workspaceSignalLabel} value={overviewState.participantState} hint={state.rotation.scenario} />
                    </div>
                  </div>

                  {contextualHandoffItem ? (
                    <HandoffMomentCard
                      copy={copy}
                      lang={lang}
                      instanceId={activeInstanceId}
                      description={handoffIsLive ? copy.handoffMomentLiveDescription : copy.handoffMomentNextDescription}
                      participantState={overviewState.participantState}
                      slots={state.rotation.slots}
                      jumpHref={handoffAgendaHref}
                      rotationSignals={rotationSignals}
                      teamChoices={state.teams.map((team) => ({ id: team.id, label: team.name }))}
                    />
                  ) : null}

                  <section className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-medium text-[var(--text-primary)]">{copy.agendaTimelineTitle}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy.agendaIndexDescription}</p>
                      </div>
                      <AdminRouteLink className={adminSecondaryButtonClassName} href={agendaAddHref}>
                        {copy.openAddAgendaItemButton}
                      </AdminRouteLink>
                    </div>
                    <div className="space-y-3">
                      {state.agenda.map((item) => {
                        const detailHref = buildAdminHref({
                          lang,
                          section: "agenda",
                          instanceId: activeInstanceId,
                          agendaItemId: item.id,
                        });

                        return (
                          <TimelineRow
                            key={item.id}
                            item={item}
                            copy={copy}
                            detailed
                            detailHref={detailHref}
                            lang={lang}
                            instanceId={activeInstanceId}
                          />
                        );
                      })}
                    </div>
                  </section>
                </>
              )}
            </div>
          </AdminPanel>
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

function AdminActionStateFields({
  lang,
  section,
  instanceId,
}: {
  lang: UiLanguage;
  section: AdminSection;
  instanceId: string;
}) {
  return (
    <>
      <input name="lang" type="hidden" value={lang} />
      <input name="section" type="hidden" value={section} />
      <input name="instanceId" type="hidden" value={instanceId} />
    </>
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

function ControlRoomPersistentSummary({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--text-primary)]">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}

function HandoffMomentCard({
  copy,
  lang,
  instanceId,
  description,
  participantState,
  slots,
  jumpHref,
  rotationSignals,
  teamChoices,
}: {
  copy: (typeof adminCopy)[UiLanguage];
  lang: UiLanguage;
  instanceId: string;
  description: string;
  participantState: string;
  slots: RotationPlan["slots"];
  jumpHref?: string | null;
  rotationSignals: RotationSignal[];
  teamChoices: Array<{ id: string; label: string }>;
}) {
  // Show the three most recent signals (newest first) to keep the card tight.
  const recentSignals = [...rotationSignals]
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt))
    .slice(0, 3);

  return (
    <ControlCard title={copy.handoffMomentTitle} description={description}>
      <div className="space-y-4">
        {jumpHref ? (
          <div className="flex flex-wrap justify-end gap-3">
            <AdminRouteLink className={adminGhostButtonClassName} href={jumpHref}>
              {copy.handoffMomentJumpButton}
            </AdminRouteLink>
          </div>
        ) : null}

        <form action={toggleRotationAction} className="space-y-4">
          <AdminActionStateFields lang={lang} section="agenda" instanceId={instanceId} />
          <div className="grid grid-cols-2 gap-3">
            <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`} name="revealed" value="true">
              {copy.unlockButton}
            </AdminSubmitButton>
            <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`} name="revealed" value="false">
              {copy.hideAgainButton}
            </AdminSubmitButton>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
            {copy.participantStatePrefix} {participantState}.
          </div>
        </form>

        <div className="space-y-2 border-t border-[var(--border)] pt-4">
          {slots.map((slot) => (
            <div key={`${slot.fromTeam}-${slot.toTeam}`} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
              <p className="font-medium text-[var(--text-primary)]">
                {slot.fromTeam} → {slot.toTeam}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{slot.note}</p>
            </div>
          ))}
        </div>

        <details className="group space-y-3 border-t border-[var(--border)] pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {copy.rotationSignalTitle}
                <span className="ml-2 inline-flex min-w-[1.75rem] justify-center rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                  {rotationSignals.length}
                </span>
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{copy.rotationSignalDescription}</p>
            </div>
            <span
              aria-hidden="true"
              className="text-lg text-[var(--text-muted)] transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>

          <form action={captureRotationSignalAction} className="space-y-3 pt-1">
            <AdminActionStateFields lang={lang} section="agenda" instanceId={instanceId} />
            <div>
              <FieldLabel htmlFor="rotation-signal-free-text">{copy.rotationSignalFreeTextLabel}</FieldLabel>
              <textarea
                id="rotation-signal-free-text"
                name="freeText"
                required
                rows={4}
                placeholder={copy.rotationSignalFreeTextPlaceholder}
                className={`${adminInputClassName} mt-2`}
              />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <FieldLabel htmlFor="rotation-signal-tags">{copy.rotationSignalTagsLabel}</FieldLabel>
                <input
                  id="rotation-signal-tags"
                  name="tags"
                  placeholder={copy.rotationSignalTagsPlaceholder}
                  className={`${adminInputClassName} mt-2`}
                />
              </div>
              <div>
                <FieldLabel htmlFor="rotation-signal-team">{copy.rotationSignalTeamLabel}</FieldLabel>
                <select
                  id="rotation-signal-team"
                  name="teamId"
                  defaultValue=""
                  className={`${adminInputClassName} mt-2`}
                >
                  <option value="">{copy.rotationSignalTeamNone}</option>
                  {teamChoices.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <AdminSubmitButton className={adminPrimaryButtonClassName}>
                {copy.rotationSignalSubmit}
              </AdminSubmitButton>
            </div>
          </form>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {copy.rotationSignalListTitle}
            </p>
            {recentSignals.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">{copy.rotationSignalListEmpty}</p>
            ) : (
              <ul className="space-y-2">
                {recentSignals.map((signal) => {
                  const teamLabel = signal.teamId
                    ? teamChoices.find((team) => team.id === signal.teamId)?.label ?? signal.teamId
                    : null;
                  const preview =
                    signal.freeText.length > 140 ? `${signal.freeText.slice(0, 137)}…` : signal.freeText;
                  return (
                    <li
                      key={signal.id}
                      className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[var(--text-primary)]">{preview}</p>
                        <time className="shrink-0 text-xs text-[var(--text-muted)]" dateTime={signal.capturedAt}>
                          {new Date(signal.capturedAt).toLocaleTimeString(lang === "cs" ? "cs-CZ" : "en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                      {(teamLabel || signal.tags.length > 0) && (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                          {teamLabel ? <span>{teamLabel}</span> : null}
                          {signal.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--text-secondary)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </details>
      </div>
    </ControlCard>
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

function AgendaItemDetail({
  item,
  lang,
  copy,
  compact = false,
}: {
  item: RichAgendaItem;
  lang: UiLanguage;
  copy: (typeof adminCopy)[UiLanguage];
  compact?: boolean;
}) {
  const sections: Array<{ title: string; items: string[] }> = [
    { title: copy.agendaFieldFacilitatorPrompts, items: item.facilitatorPrompts ?? [] },
    { title: copy.agendaFieldWatchFors, items: item.watchFors ?? [] },
    { title: copy.agendaFieldCheckpointQuestions, items: item.checkpointQuestions ?? [] },
  ].filter((section) => section.items.length > 0);
  const runnerSections: Array<{ title: string; items: string[] }> = [
    { title: copy.agendaRunnerSayTitle, items: item.facilitatorRunner.say ?? [] },
    { title: copy.agendaRunnerShowTitle, items: item.facilitatorRunner.show ?? [] },
    { title: copy.agendaRunnerDoTitle, items: item.facilitatorRunner.do ?? [] },
    { title: copy.agendaRunnerWatchTitle, items: item.facilitatorRunner.watch ?? [] },
    { title: copy.agendaRunnerFallbackTitle, items: item.facilitatorRunner.fallback ?? [] },
  ].filter((section) => section.items.length > 0);

  return (
    <div className={`${compact ? "mt-4 space-y-4" : "space-y-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4"}`}>
      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.agendaRunnerTitle}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy.agendaRunnerDescription}</p>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs text-[var(--text-secondary)]">
            {copy.runtimeCopyBadge}
          </span>
        </div>

        <div className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.agendaRunnerGoalTitle}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{item.facilitatorRunner.goal}</p>
        </div>

        {runnerSections.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {runnerSections.map((section) => (
              <div key={section.title} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{section.title}</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-primary)]">
                  {section.items.map((value) => (
                    <li key={value}>• {value}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.agendaDetailGoalTitle}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{item.goal}</p>
        </div>
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.agendaDetailRoomSummaryTitle}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{item.roomSummary}</p>
        </div>
      </div>

      {sections.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{section.title}</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                {section.items.map((value) => (
                  <li key={value}>• {value}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {(item.sourceRefs ?? []).length > 0 ? (
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.agendaDetailSourceMaterialTitle}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(item.sourceRefs ?? []).map((ref) => {
              const href = buildRepoSourceHref(ref.path);
              const className =
                "flex items-center justify-between rounded-[16px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]";

              if (!href) {
                return (
                  <div key={`${ref.path}-${ref.label}`} className={className}>
                    <span className="font-medium">{ref.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">{ref.path}</span>
                  </div>
                );
              }

              return (
                <a key={`${ref.path}-${ref.label}`} href={href} target="_blank" rel="noreferrer" className={className}>
                  <span className="font-medium">{ref.label}</span>
                  <span className="text-xs text-[var(--text-muted)]">{copy.openRepoLabel}</span>
                </a>
              );
            })}
          </div>
          {!compact ? (
            <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
              {lang === "cs" ? "Dashboard a zdrojové materiály mají sdílet stejný agenda backbone." : "Dashboard and source materials should share the same agenda backbone."}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PresenterSceneSummaryCard({
  scene,
  agendaItemId,
  activeInstanceId,
  lang,
  copy,
  isDefault,
  isSelected,
  participantOnly = false,
}: {
  scene: RichPresenterScene;
  agendaItemId: string;
  activeInstanceId: string;
  lang: UiLanguage;
  copy: (typeof adminCopy)[UiLanguage];
  isDefault: boolean;
  isSelected: boolean;
  participantOnly?: boolean;
}) {
  const sceneBlocks = scene.blocks ?? [];
  const surfaceLabel = participantOnly ? copy.participantSurfaceCardTitle : copy.presenterCardTitle;
  const sceneMeta = [surfaceLabel, scene.sceneType, scene.intent, scene.chromePreset].filter(Boolean).join(" • ");
  const sceneEditorHref = buildAdminHref({
    lang,
    section: "agenda",
    instanceId: activeInstanceId,
    agendaItemId,
    sceneId: scene.id,
    overlay: "scene-edit",
  });

  const presenterHref = buildPresenterRouteHref({
    lang,
    instanceId: activeInstanceId,
    agendaItemId,
    sceneId: scene.id,
  });
  const morphName = `scene-${agendaItemId}-${scene.id}`;

  return (
    <ViewTransitionCard name={morphName}>
    <div
      data-agenda-scene-card={scene.id}
      className={`rounded-[20px] border p-4 ${
        isSelected ? "border-[var(--text-primary)] bg-[var(--surface)] shadow-[0_14px_28px_rgba(28,25,23,0.08)]" : "border-[var(--border)] bg-[var(--surface-soft)]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-[var(--text-primary)]">{scene.label}</p>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            {sceneMeta}
            {isDefault ? ` • ${copy.presenterCurrentSceneLabel}` : ""}
            {!scene.enabled ? ` • ${copy.presenterSceneDisabled}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Primary click does soft nav → intercepting route → View Transitions morph.
              Secondary "pop out" action (ctrl/cmd-click) preserves multi-window workflow. */}
          <AdminRouteLink
            href={presenterHref}
            className={adminGhostButtonClassName}
          >
            {participantOnly ? copy.presenterOpenParticipantButton : copy.presenterOpenSelectedScene}
          </AdminRouteLink>
          <a
            href={presenterHref}
            target="_blank"
            rel="noreferrer"
            aria-label="otevřít v novém okně"
            className={`${adminGhostButtonClassName} px-2`}
          >
            ↗
          </a>
          <AdminRouteLink href={sceneEditorHref} className={adminGhostButtonClassName}>
            {copy.presenterEditSceneButton}
          </AdminRouteLink>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{scene.body}</p>
      {sceneBlocks.length > 0 ? (
        <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.presenterRoomBlocksTitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sceneBlocks.map((block) => (
              <span
                key={block.id}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]"
              >
                {block.type}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {(scene.facilitatorNotes ?? []).length > 0 ? (
        <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.presenterFacilitatorNotesTitle}</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
            {(scene.facilitatorNotes ?? []).map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {(scene.sourceRefs ?? []).length > 0 ? (
        <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.agendaDetailSourceMaterialTitle}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(scene.sourceRefs ?? []).map((ref: SourceRef) => {
            const href = buildRepoSourceHref(ref.path);
            const className =
              "flex items-center justify-between rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--card-top)]";

            if (!href) {
              return (
                <div key={`${ref.path}-${ref.label}`} className={className}>
                  <span className="font-medium">{ref.label}</span>
                  <span className="text-xs text-[var(--text-muted)]">{ref.path}</span>
                </div>
              );
            }

            return (
              <a key={`${ref.path}-${ref.label}`} href={href} target="_blank" rel="noreferrer" className={className}>
                <span className="font-medium">{ref.label}</span>
                <span className="text-xs text-[var(--text-muted)]">{copy.openLinkLabel}</span>
              </a>
            );
          })}
          </div>
        </div>
      ) : null}
    </div>
    </ViewTransitionCard>
  );
}

function TimelineRow({
  item,
  copy,
  lang,
  instanceId,
  detailHref,
  detailed = false,
}: {
  item: Awaited<ReturnType<typeof getWorkshopState>>["agenda"][number];
  copy: (typeof adminCopy)[UiLanguage];
  lang: UiLanguage;
  instanceId: string;
  detailHref: string;
  detailed?: boolean;
}) {
  const detailItem = item as RichAgendaItem;
  const statusLabel =
    item.status === "done"
      ? copy.agendaStatusDone
      : item.status === "current"
        ? copy.agendaStatusCurrent
        : copy.agendaStatusUpcoming;
  const markerClassName =
    item.status === "current"
      ? "bg-[var(--text-primary)]"
      : item.status === "done"
        ? "bg-[var(--text-muted)]"
        : "bg-transparent border border-[var(--border-strong)]";
  const rowClassName =
    item.status === "current"
      ? "border-[var(--highlight-border)] bg-[var(--highlight-surface)] shadow-[0_14px_28px_rgba(28,25,23,0.08)]"
      : item.status === "done"
        ? "border-[var(--border)] bg-[var(--surface-soft)]"
        : "border-[var(--border)] bg-transparent";

  return (
    <div
      data-agenda-item={item.id}
      className={`rounded-[22px] border px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] ${rowClassName}`}
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <span className={`mt-1 h-3 w-3 rounded-full ${markerClassName}`} />
          <span className="mt-2 h-full w-px bg-[var(--border)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--text-primary)]">
                {item.time} • {item.title}
              </p>
              {detailed || item.status === "current" ? (
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{detailItem.roomSummary || item.description}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{statusLabel}</span>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {item.status !== "current" ? (
                  <form action={setAgendaAction}>
                    <AdminActionStateFields lang={lang} section="agenda" instanceId={instanceId} />
                    <input name="agendaId" type="hidden" value={item.id} />
                    <input name="returnTo" type="hidden" value="index" />
                    <AdminSubmitButton className={adminSecondaryButtonClassName}>{copy.agendaMoveLiveHereButton}</AdminSubmitButton>
                  </form>
                ) : null}
                <AdminRouteLink className={adminGhostButtonClassName} href={detailHref}>
                  {copy.openAgendaDetailButton}
                </AdminRouteLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
