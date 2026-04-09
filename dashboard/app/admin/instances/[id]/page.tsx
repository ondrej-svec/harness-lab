import Link from "next/link";
import { redirect } from "next/navigation";
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
import { getNeonSql } from "@/lib/neon-db";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { adminCopy, resolveUiLanguage, type UiLanguage, withLang } from "@/lib/ui-language";
import { ThemeSwitcher } from "../../../components/theme-switcher";
import { buildPresenterControlState, buildPresenterRouteHref } from "@/lib/presenter-view-model";
import { workshopTemplates, type AgendaItem, type PresenterBlock as WorkshopPresenterBlock, type PresenterScene, type Team } from "@/lib/workshop-data";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import {
  addPresenterScene,
  addAgendaItem,
  addSprintUpdate,
  createWorkshopArchive,
  completeChallenge,
  getWorkshopState,
  getLatestWorkshopArchive,
  moveAgendaItem,
  movePresenterScene,
  removeAgendaItem,
  removePresenterScene,
  resetWorkshopState,
  setCurrentAgendaItem,
  setDefaultPresenterScene,
  setPresenterSceneEnabled,
  setRotationReveal,
  updateAgendaItem,
  updatePresenterScene,
  upsertTeam,
} from "@/lib/workshop-store";
import {
  AdminLanguageSwitcher,
  AdminPanel,
  AdminSheet,
  ControlCard,
  FieldLabel,
  KeyValueRow,
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

const blueprintRepoUrl = "https://github.com/ondrej-svec/harness-lab/tree/main/workshop-blueprint";
const repoBlobBaseUrl = "https://github.com/ondrej-svec/harness-lab/blob/main";

function deriveNextTeamId(existingIds: string[]) {
  const numericIds = existingIds
    .map((id) => id.match(/^t(\d+)$/)?.[1])
    .filter(Boolean)
    .map((value) => Number(value));
  const nextNumber = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
  return `t${nextNumber}`;
}

function buildEvidenceSummary(parts: {
  changed?: string;
  verified?: string;
  nextStep?: string;
  fallback?: string;
}) {
  const items = [
    parts.changed ? `Co se změnilo: ${parts.changed}` : null,
    parts.verified ? `Co to ověřuje: ${parts.verified}` : null,
    parts.nextStep ? `Další safe move: ${parts.nextStep}` : null,
  ].filter(Boolean);

  if (items.length > 0) {
    return items.join("\n");
  }

  return parts.fallback?.trim() ?? "";
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
  return `${repoBlobBaseUrl}/${path}`;
}

async function signOutAction(formData: FormData) {
  "use server";
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  if (auth) {
    await auth.signOut();
  }
  redirect(withLang("/admin/sign-in", lang));
}

async function setAgendaAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaId = String(formData.get("agendaId") ?? "");
  if (agendaId) {
    await setCurrentAgendaItem(agendaId, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId: agendaId || null }));
}

async function saveAgendaDetailsAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaId = String(formData.get("agendaId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const roomSummary = String(formData.get("roomSummary") ?? "").trim();
  const facilitatorPrompts = parseTextareaList(String(formData.get("facilitatorPrompts") ?? ""));
  const watchFors = parseTextareaList(String(formData.get("watchFors") ?? ""));
  const checkpointQuestions = parseTextareaList(String(formData.get("checkpointQuestions") ?? ""));
  const description = roomSummary || goal;

  if (agendaId && title && time && description) {
    await updateAgendaItem(
      agendaId,
      {
        title,
        time,
        description,
        goal: goal || description,
        roomSummary: roomSummary || description,
        facilitatorPrompts,
        watchFors,
        checkpointQuestions,
      },
      instanceId,
    );
  }

  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId: agendaId || null }));
}

async function addAgendaItemAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const title = String(formData.get("title") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const roomSummary = String(formData.get("roomSummary") ?? "").trim();
  const facilitatorPrompts = parseTextareaList(String(formData.get("facilitatorPrompts") ?? ""));
  const watchFors = parseTextareaList(String(formData.get("watchFors") ?? ""));
  const checkpointQuestions = parseTextareaList(String(formData.get("checkpointQuestions") ?? ""));
  const description = roomSummary || goal || String(formData.get("description") ?? "").trim();
  const afterItemId = String(formData.get("afterItemId") ?? "").trim();

  if (title && time && description) {
    const state = await addAgendaItem(
      {
        title,
        time,
        description,
        goal: goal || description,
        roomSummary: roomSummary || description,
        facilitatorPrompts,
        watchFors,
        checkpointQuestions,
        afterItemId: afterItemId || null,
      },
      instanceId,
    );
    const createdItem = state.agenda.find((item) => item.kind === "custom" && item.title === title && item.time === time);
    redirect(buildAdminHref({ lang, section, instanceId, agendaItemId: createdItem?.id ?? null }));
  }

  redirect(buildAdminHref({ lang, section, instanceId }));
}

async function moveAgendaItemAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaId = String(formData.get("agendaId") ?? "");
  const direction = String(formData.get("direction") ?? "") as "up" | "down";
  if (agendaId && (direction === "up" || direction === "down")) {
    await moveAgendaItem(agendaId, direction, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId: agendaId || null }));
}

async function removeAgendaItemAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const agendaId = String(formData.get("agendaId") ?? "");
  if (agendaId) {
    await removeAgendaItem(agendaId, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId }));
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

async function toggleRotationAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  await setRotationReveal(formData.get("revealed") === "true", instanceId);
  redirect(buildAdminHref({ lang, section, instanceId }));
}

async function addCheckpointFeedAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const teamId = String(formData.get("teamId") ?? "");
  const text = buildEvidenceSummary({
    changed: String(formData.get("checkpointChanged") ?? "").trim(),
    verified: String(formData.get("checkpointVerified") ?? "").trim(),
    nextStep: String(formData.get("checkpointNextStep") ?? "").trim(),
    fallback: String(formData.get("text") ?? "").trim(),
  });
  const at = String(formData.get("at") ?? "");
  if (teamId && text && at) {
    await addSprintUpdate(
      {
        id: `u-${Date.now()}`,
        teamId,
        text,
        at,
      },
      instanceId,
    );
  }
  redirect(buildAdminHref({ lang, section, instanceId }));
}

async function completeChallengeAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const teamId = String(formData.get("teamId") ?? "");
  const challengeId = String(formData.get("challengeId") ?? "");
  if (teamId && challengeId) {
    await completeChallenge(challengeId, teamId, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId }));
}

async function registerTeamAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const state = await getWorkshopState(instanceId);
  const id = String(formData.get("id") ?? "").trim() || deriveNextTeamId(state.teams.map((team) => team.id));
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "Studio A").trim();
  const repoUrl = String(formData.get("repoUrl") ?? "").trim();
  const projectBriefId = String(formData.get("projectBriefId") ?? "").trim();
  const checkpoint = buildEvidenceSummary({
    changed: String(formData.get("checkpointChanged") ?? "").trim(),
    verified: String(formData.get("checkpointVerified") ?? "").trim(),
    nextStep: String(formData.get("checkpointNextStep") ?? "").trim(),
    fallback: String(formData.get("checkpoint") ?? "").trim(),
  });
  const membersRaw = String(formData.get("members") ?? "").trim();

  if (id && name && repoUrl && projectBriefId) {
    await upsertTeam(
      {
        id,
        name,
        city,
        repoUrl,
        projectBriefId,
        checkpoint,
        members: membersRaw
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      },
      instanceId,
    );
  }
  redirect(buildAdminHref({ lang, section, instanceId, teamId: id || null }));
}

async function resetWorkshopAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const templateId = workshopTemplates[0]?.id ?? "";
  if (templateId) {
    await resetWorkshopState(templateId, instanceId);
  }
  redirect(buildAdminHref({ lang, section, instanceId }));
}

async function archiveWorkshopAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const notes = String(formData.get("notes") ?? "").trim();
  await createWorkshopArchive({ reason: "manual", notes: notes || null }, instanceId);
  redirect(buildAdminHref({ lang, section, instanceId }));
}

async function addFacilitatorAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "operator") as "owner" | "operator" | "observer";

  if (email && ["owner", "operator", "observer"].includes(role)) {
    const facilitator = await getFacilitatorSession(instanceId);
    if (facilitator?.grant.role === "owner") {
      const sql = getNeonSql();
      const users = (await sql.query(
        `SELECT id::text, name, email FROM neon_auth."user" WHERE email = $1 LIMIT 1`,
        [email],
      )) as { id: string; name: string; email: string }[];

      if (users.length > 0) {
        const repo = getInstanceGrantRepository();
        const existing = await repo.getActiveGrantByNeonUserId(instanceId, users[0].id);
        if (!existing) {
          await repo.createGrant(instanceId, users[0].id, role);
          await getAuditLogRepository().append({
            id: `audit-${Date.now()}`,
            instanceId,
            actorKind: "facilitator",
            action: "facilitator_grant_created",
            result: "success",
            createdAt: new Date().toISOString(),
            metadata: { grantedToEmail: email, role },
          });
        }
      }
    }
  }
  redirect(buildAdminHref({ lang, section, instanceId }));
}

async function revokeFacilitatorAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const grantId = String(formData.get("grantId") ?? "");

  if (grantId) {
    const facilitator = await getFacilitatorSession(instanceId);
    if (facilitator?.grant.role === "owner" && grantId !== facilitator.grant.id) {
      await getInstanceGrantRepository().revokeGrant(grantId);
      await getAuditLogRepository().append({
        id: `audit-${Date.now()}`,
        instanceId,
        actorKind: "facilitator",
        action: "facilitator_grant_revoked",
        result: "success",
        createdAt: new Date().toISOString(),
        metadata: { revokedGrantId: grantId },
      });
    }
  }
  redirect(buildAdminHref({ lang, section, instanceId }));
}

async function changePasswordAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const revokeOtherSessions = formData.get("revokeOtherSessions") === "on";

  if (!auth) {
    redirect(buildAdminHref({ lang, section, instanceId, error: "unavailable" }));
  }

  if (newPassword !== confirmPassword) {
    redirect(buildAdminHref({ lang, section, instanceId, error: "password_mismatch" }));
  }

  const { error } = await auth.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions,
  });

  if (error) {
    redirect(buildAdminHref({ lang, section, instanceId, error: error.message || "password_change_failed" }));
  }

  redirect(buildAdminHref({ lang, section, instanceId, password: "changed" }));
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
  const [loadedState, loadedLatestArchive, loadedFacilitatorGrants, loadedCurrentFacilitator, loadedAuthSession] =
    await Promise.all([
      getWorkshopState(activeInstanceId),
      getLatestWorkshopArchive(activeInstanceId),
      isNeonMode ? getInstanceGrantRepository().listActiveGrants(activeInstanceId) : Promise.resolve([]),
      isNeonMode ? getFacilitatorSession(activeInstanceId) : Promise.resolve(null),
      isNeonMode && auth ? auth.getSession() : Promise.resolve({ data: null }),
    ]);
  const state: Awaited<ReturnType<typeof getWorkshopState>> = loadedState;
  const latestArchive: Awaited<ReturnType<typeof getLatestWorkshopArchive>> = loadedLatestArchive;
  const facilitatorGrants: Awaited<ReturnType<ReturnType<typeof getInstanceGrantRepository>["listActiveGrants"]>> =
    loadedFacilitatorGrants;
  const currentFacilitator: Awaited<ReturnType<typeof getFacilitatorSession>> = loadedCurrentFacilitator;
  const authSession: Awaited<ReturnType<NonNullable<typeof auth>["getSession"]>> | { data: null } = loadedAuthSession;

  const { currentAgendaItem, nextAgendaItem, selectedInstance } = deriveAdminPageState(
    state,
    availableInstances,
    activeInstanceId,
  );
  const selectedAgendaItem =
    ((state.agenda.find((item: AgendaItem) => item.id === query?.agendaItem) ?? currentAgendaItem ?? state.agenda[0]) as RichAgendaItem | undefined) ??
    null;
  const selectedScene =
    selectedAgendaItem?.presenterScenes.find((scene) => scene.id === query?.scene) ??
    selectedAgendaItem?.presenterScenes.find((scene) => scene.id === selectedAgendaItem.defaultPresenterSceneId) ??
    selectedAgendaItem?.presenterScenes[0] ??
    null;
  const selectedTeam = state.teams.find((team: Team) => team.id === query?.team) ?? state.teams[0] ?? null;
  const selectedTeamCheckpoint = parseEvidenceSummary(selectedTeam?.checkpoint ?? "");
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
  const presenterState = buildPresenterControlState({
    state,
    instanceId: activeInstanceId,
    lang,
  });
  const agendaBaseHref = buildAdminHref({
    lang,
    section: "agenda",
    instanceId: activeInstanceId,
    agendaItemId: selectedAgendaItem?.id ?? null,
  });
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
  const sceneEditHref =
    selectedAgendaItem && selectedScene
      ? buildAdminHref({
          lang,
          section: "agenda",
          instanceId: activeInstanceId,
          agendaItemId: selectedAgendaItem.id,
          sceneId: selectedScene.id,
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
    (currentAgendaItem && (currentAgendaItem as RichAgendaItem).intent === "handoff"
      ? (currentAgendaItem as RichAgendaItem)
      : nextAgendaItem && (nextAgendaItem as RichAgendaItem).intent === "handoff"
        ? (nextAgendaItem as RichAgendaItem)
        : null) ?? null;
  const handoffAgendaHref = contextualHandoffItem
    ? buildAdminHref({
        lang,
        section: "agenda",
        instanceId: activeInstanceId,
        agendaItemId: contextualHandoffItem.id,
      })
    : null;
  const handoffIsLive = contextualHandoffItem?.id === currentAgendaItem?.id;
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
                <Link
                  href={buildAdminWorkspaceHref({ lang })}
                  className="inline-flex text-sm lowercase text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                >
                  {copy.controlRoomBack}
                </Link>
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
                  csHref={buildAdminHref({ lang: "cs", section: activeSection, instanceId: activeInstanceId })}
                  enHref={buildAdminHref({ lang: "en", section: activeSection, instanceId: activeInstanceId })}
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

            <nav className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4 sm:flex sm:flex-wrap sm:gap-x-3 sm:gap-y-3 xl:hidden">
              <AdminSectionLink
                lang={lang}
                section="live"
                activeSection={activeSection}
                label={copy.navLive}
                instanceId={activeInstanceId}
              />
              <AdminSectionLink
                lang={lang}
                section="agenda"
                activeSection={activeSection}
                label={copy.navAgenda}
                instanceId={activeInstanceId}
              />
              <AdminSectionLink
                lang={lang}
                section="teams"
                activeSection={activeSection}
                label={copy.navTeams}
                instanceId={activeInstanceId}
              />
              <AdminSectionLink
                lang={lang}
                section="signals"
                activeSection={activeSection}
                label={copy.navSignals}
                instanceId={activeInstanceId}
              />
              <AdminSectionLink
                lang={lang}
                section="access"
                activeSection={activeSection}
                label={copy.navAccess}
                instanceId={activeInstanceId}
              />
              <AdminSectionLink
                lang={lang}
                section="settings"
                activeSection={activeSection}
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
          <aside className="hidden xl:block">
            <div className={`sticky top-6 ${adminHeroPanelClassName} p-4`}>
              <p className="px-2 text-[11px] uppercase tracking-[0.28em] text-[var(--hero-muted)]">{copy.activeInstance}</p>
              <p className="mt-2 px-2 text-sm leading-6 text-[var(--hero-secondary)]">{state.workshopId}</p>
              <nav className="flex flex-col gap-2">
                <AdminSectionLink
                  lang={lang}
                  section="live"
                  activeSection={activeSection}
                  label={copy.navLive}
                  instanceId={activeInstanceId}
                  tone="dark"
                />
                <AdminSectionLink
                  lang={lang}
                  section="agenda"
                  activeSection={activeSection}
                  label={copy.navAgenda}
                  instanceId={activeInstanceId}
                  tone="dark"
                />
                <AdminSectionLink
                  lang={lang}
                  section="teams"
                  activeSection={activeSection}
                  label={copy.navTeams}
                  instanceId={activeInstanceId}
                  tone="dark"
                />
                <AdminSectionLink
                  lang={lang}
                  section="signals"
                  activeSection={activeSection}
                  label={copy.navSignals}
                  instanceId={activeInstanceId}
                  tone="dark"
                />
                <AdminSectionLink
                  lang={lang}
                  section="access"
                  activeSection={activeSection}
                  label={copy.navAccess}
                  instanceId={activeInstanceId}
                  tone="dark"
                />
                <AdminSectionLink
                  lang={lang}
                  section="settings"
                  activeSection={activeSection}
                  label={copy.navSettings}
                  instanceId={activeInstanceId}
                  tone="dark"
                />
              </nav>
            </div>
          </aside>

          <div className="space-y-6 2xl:space-y-7">
        {activeSection === "live" ? (
          <AdminPanel
            eyebrow={copy.workshopStateEyebrow}
            title={copy.overviewTitle}
            description={copy.overviewDescription}
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(22rem,0.86fr)] 2xl:grid-cols-[minmax(0,1.5fr)_minmax(24rem,0.82fr)]">
              <section className="order-2 space-y-4 xl:order-1">
                <div className={`${adminHeroPanelClassName} p-5 sm:p-6`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--hero-muted)]">
                      {copy.liveNow}
                    </span>
                    <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--hero-secondary)]">
                      {state.workshopMeta.currentPhaseLabel}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <h3 className="text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--hero-text)] sm:text-3xl">
                        {overviewState.liveNowTitle}
                      </h3>
                      <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[var(--hero-secondary)]">{overviewState.liveNowDescription}</p>
                    </div>
                    <div className="grid w-full gap-3 sm:w-auto">
                      {overviewState.nextUpLabel ? (
                        <div className="rounded-[20px] border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-4 py-3 text-sm leading-6 text-[var(--hero-secondary)]">
                          {overviewState.nextUpLabel}
                        </div>
                      ) : null}
                      <div className="rounded-[20px] border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-4 py-3 text-sm leading-6 text-[var(--hero-secondary)]">
                        {copy.workspaceSignalLabel}: {overviewState.participantState}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-5 shadow-[0_14px_30px_rgba(28,25,23,0.05)] sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">{copy.agendaTimelineTitle}</h3>
                    <Link
                      href={overviewState.agendaLink}
                      className="text-sm lowercase text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                    >
                      {copy.navAgenda}
                    </Link>
                  </div>
                  <div className="mt-4 space-y-3">
                    {state.agenda.map((item) => (
                      <TimelineRow key={item.id} item={item} copy={copy} />
                    ))}
                  </div>
                </div>
              </section>

              <section className="order-1 space-y-4 xl:order-2">
                <ControlCard title={copy.moveAgendaTitle} description={copy.phaseControlHint}>
                  <div className="space-y-3">
                    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.liveNow}</p>
                      <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                        {currentAgendaItem ? `${currentAgendaItem.time} • ${currentAgendaItem.title}` : copy.presenterNoSceneTitle}
                      </p>
                      {nextAgendaItem ? (
                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                          {copy.nextUp}: {nextAgendaItem.time} • {nextAgendaItem.title}
                        </p>
                      ) : null}
                    </div>
                    <form action={setAgendaAction} className="space-y-3">
                      <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                      <select name="agendaId" defaultValue={currentAgendaItem?.id} className={adminInputClassName}>
                        {overviewState.phaseOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>
                        {copy.setCurrentPhase}
                      </AdminSubmitButton>
                    </form>
                  </div>
                </ControlCard>

                {contextualHandoffItem && handoffAgendaHref ? (
                  <ControlCard
                    title={copy.handoffMomentTitle}
                    description={handoffIsLive ? copy.handoffMomentLiveDescription : copy.handoffMomentNextDescription}
                  >
                    <div className="space-y-4">
                      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                              {handoffIsLive ? copy.liveNow : copy.nextUp}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                              {contextualHandoffItem.time} • {contextualHandoffItem.title}
                            </p>
                          </div>
                          <Link className={adminGhostButtonClassName} href={handoffAgendaHref}>
                            {copy.handoffMomentJumpButton}
                          </Link>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                          {contextualHandoffItem.roomSummary || contextualHandoffItem.description}
                        </p>
                      </div>
                      <form action={toggleRotationAction} className="space-y-4">
                        <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                        <div className="grid grid-cols-2 gap-3">
                          <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`} name="revealed" value="true">
                            {copy.unlockButton}
                          </AdminSubmitButton>
                          <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`} name="revealed" value="false">
                            {copy.hideAgainButton}
                          </AdminSubmitButton>
                        </div>
                        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                          {copy.participantStatePrefix} {overviewState.participantState}.
                        </div>
                      </form>
                    </div>

                    <div className="mt-5 space-y-2 border-t border-[var(--border)] pt-4">
                      {state.rotation.slots.map((slot) => (
                        <div key={`${slot.fromTeam}-${slot.toTeam}`} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                          <p className="font-medium text-[var(--text-primary)]">
                            {slot.fromTeam} → {slot.toTeam}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{slot.note}</p>
                        </div>
                      ))}
                    </div>
                  </ControlCard>
                ) : null}

                <ControlCard title={copy.presenterCardTitle} description={copy.presenterCardDescription}>
                  <div className="space-y-4">
                    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                      <span className="font-medium text-[var(--text-primary)]">{copy.presenterCurrentSceneLabel}:</span>{" "}
                      {presenterState.currentDefaultScene?.label ?? copy.presenterNoSceneTitle}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <a
                        className={`${adminPrimaryButtonClassName} inline-flex w-full items-center justify-center`}
                        href={presenterState.currentPresenterHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.presenterOpenCurrentButton}
                      </a>
                      <a
                        className={`${adminSecondaryButtonClassName} inline-flex w-full items-center justify-center`}
                        href={presenterState.participantMirrorHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.presenterOpenParticipantSurfaceButton}
                      </a>
                      {presenterState.participantPreviewHref ? (
                        <a
                          className={`${adminSecondaryButtonClassName} inline-flex w-full items-center justify-center`}
                          href={presenterState.participantPreviewHref}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {copy.presenterOpenParticipantButton}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </ControlCard>
              </section>
            </div>
          </AdminPanel>
        ) : null}

        {activeSection === "agenda" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
            <AdminPanel
              eyebrow={copy.workshopStateEyebrow}
              title={copy.agendaSectionTitle}
              description={copy.agendaSectionDescription}
            >
              <div className="space-y-3">
                {state.agenda.map((item) => (
                  <Link
                    key={item.id}
                    href={buildAdminHref({
                      lang,
                      section: activeSection,
                      instanceId: activeInstanceId,
                      agendaItemId: item.id,
                    })}
                    className={`block rounded-[20px] border p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] ${
                      selectedAgendaItem?.id === item.id
                        ? "border-[var(--text-primary)] bg-[var(--surface)] shadow-[0_14px_28px_rgba(28,25,23,0.08)]"
                        : "border-[var(--border)] bg-[var(--surface-soft)]"
                    }`}
                  >
                    <TimelineRow item={item} copy={copy} detailed />
                  </Link>
                ))}
              </div>
            </AdminPanel>

            <div className="space-y-6">
              <AdminPanel eyebrow={copy.agendaEditEyebrow} title={copy.agendaCurrentTitle} description={copy.phaseControlHint}>
                {selectedAgendaItem ? (
                  <div className="space-y-5">
                    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
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
                        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                          {copy.runtimeCopyBadge}
                        </span>
                        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                          {selectedAgendaItem.kind === "custom" ? copy.customItemBadge : copy.blueprintItemBadge}
                        </span>
                      </div>
                      <h2 className="mt-4 text-[1.9rem] font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                        {selectedAgendaItem.time} • {selectedAgendaItem.title}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                        {selectedAgendaItem.roomSummary || selectedAgendaItem.description}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link className={adminPrimaryButtonClassName} href={agendaEditHref}>
                          {copy.openEditSheetButton}
                        </Link>
                        <form action={setAgendaAction}>
                          <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                          <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                          <AdminSubmitButton className={adminSecondaryButtonClassName}>{copy.setCurrentPhase}</AdminSubmitButton>
                        </form>
                        <Link className={adminSecondaryButtonClassName} href={agendaAddHref}>
                          {copy.openAddAgendaItemButton}
                        </Link>
                      </div>
                    </div>

                    {currentAgendaItem && selectedAgendaItem.id !== currentAgendaItem.id ? (
                      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.liveNow}</p>
                            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                              {currentAgendaItem.time} • {currentAgendaItem.title}
                            </p>
                          </div>
                          <Link className={adminGhostButtonClassName} href={liveAgendaHref}>
                            {copy.agendaJumpToLiveButton}
                          </Link>
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                      {copy.agendaRuntimeNotice}
                    </div>

                    <AgendaItemDetail item={selectedAgendaItem} lang={lang} copy={copy} />

                    <details className="rounded-[22px] border border-[var(--border)] bg-[var(--card-top)] p-4">
                      <summary className="cursor-pointer list-none text-sm font-medium text-[var(--text-primary)]">
                        {copy.agendaPresenterGroupTitle}
                      </summary>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link className={adminSecondaryButtonClassName} href={sceneAddHref}>
                          {copy.presenterAddSceneButton}
                        </Link>
                        {selectedScene ? (
                          <Link className={adminGhostButtonClassName} href={sceneEditHref}>
                            {copy.presenterEditSceneButton}
                          </Link>
                        ) : null}
                      </div>
                      <div className="mt-4 space-y-3">
                        {selectedAgendaItem.presenterScenes.length > 0 ? (
                          selectedAgendaItem.presenterScenes.map((scene) => (
                            <PresenterSceneSummaryCard
                              key={scene.id}
                              scene={scene}
                              agendaItemId={selectedAgendaItem.id}
                              activeInstanceId={activeInstanceId}
                              lang={lang}
                              copy={copy}
                              isDefault={selectedAgendaItem.defaultPresenterSceneId === scene.id}
                              isSelected={selectedScene?.id === scene.id}
                            />
                          ))
                        ) : (
                          <p className="text-sm leading-6 text-[var(--text-secondary)]">{copy.presenterNoSceneBody}</p>
                        )}
                      </div>
                    </details>

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
                  </div>
                ) : null}
              </AdminPanel>
            </div>
          </div>
        ) : null}

        {activeSection === "teams" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.1fr)]">
            <AdminPanel
              eyebrow={copy.teamOpsEyebrow}
              title={selectedTeam ? copy.editTeamTitle : copy.registerTeamTitle}
              description={selectedTeam ? copy.editTeamDescription : copy.teamOpsDescription}
            >
              <div className="space-y-4">
                {selectedTeam ? (
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{selectedTeam.name}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{selectedTeam.id}</p>
                      </div>
                      <Link
                        href={buildAdminHref({ lang, section: activeSection, instanceId: activeInstanceId })}
                        className="text-xs lowercase text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                      >
                        {copy.createAnotherTeamLabel}
                      </Link>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{selectedTeam.repoUrl}</p>
                  </div>
                ) : null}

                <form action={registerTeamAction} className="grid gap-3 lg:grid-cols-2">
                  <AdminActionStateFields
                    lang={lang}
                    section={activeSection}
                    instanceId={activeInstanceId}
                  />
                  <input name="id" type="hidden" value={selectedTeam?.id ?? ""} />
                  <input name="name" placeholder={copy.teamNamePlaceholder} defaultValue={selectedTeam?.name ?? ""} className={adminInputClassName} />
                  <input name="city" placeholder="Studio A" defaultValue={selectedTeam?.city ?? ""} className={adminInputClassName} />
                  <input
                    name="repoUrl"
                    placeholder="https://github.com/..."
                    defaultValue={selectedTeam?.repoUrl ?? ""}
                    className={`${adminInputClassName} lg:col-span-2`}
                  />
                  <input name="projectBriefId" placeholder="standup-bot" defaultValue={selectedTeam?.projectBriefId ?? ""} className={adminInputClassName} />
                  <input
                    name="members"
                    placeholder="Anna, David, Eva"
                    defaultValue={selectedTeam?.members.join(", ") ?? ""}
                    className={adminInputClassName}
                  />
                  <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)] lg:col-span-2">
                    {copy.checkpointFormHint}
                  </div>
                  <div className="lg:col-span-2">
                    <FieldLabel htmlFor="checkpoint-changed">{copy.checkpointChangedLabel}</FieldLabel>
                    <textarea
                      id="checkpoint-changed"
                      name="checkpointChanged"
                      rows={3}
                      placeholder={copy.checkpointChangedLabel}
                      defaultValue={selectedTeamCheckpoint.changed}
                      className={`${adminInputClassName} mt-2`}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <FieldLabel htmlFor="checkpoint-verified">{copy.checkpointVerifiedLabel}</FieldLabel>
                    <textarea
                      id="checkpoint-verified"
                      name="checkpointVerified"
                      rows={3}
                      placeholder={copy.checkpointVerifiedLabel}
                      defaultValue={selectedTeamCheckpoint.verified}
                      className={`${adminInputClassName} mt-2`}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <FieldLabel htmlFor="checkpoint-next-step">{copy.checkpointNextStepLabel}</FieldLabel>
                    <textarea
                      id="checkpoint-next-step"
                      name="checkpointNextStep"
                      rows={3}
                      placeholder={copy.checkpointNextStepLabel}
                      defaultValue={selectedTeamCheckpoint.nextStep}
                      className={`${adminInputClassName} mt-2`}
                    />
                  </div>
                  <AdminSubmitButton className={`${adminPrimaryButtonClassName} lg:col-span-2`}>
                    {selectedTeam ? copy.updateTeamButton : copy.createTeamButton}
                  </AdminSubmitButton>
                </form>
              </div>
            </AdminPanel>

            <AdminPanel eyebrow={copy.navTeams} title={copy.teamOpsTitle} description={copy.teamOpsDescription}>
              <div className="grid gap-3 2xl:grid-cols-2">
                {state.teams.map((team) => (
                  <div
                    key={team.id}
                    className={`rounded-[20px] border p-4 ${
                      selectedTeam?.id === team.id
                        ? "border-[var(--text-primary)] bg-[var(--surface)]"
                        : "border-[var(--border)] bg-[var(--surface-soft)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{team.name}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{team.repoUrl}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{team.id}</p>
                        <Link
                          href={buildAdminHref({
                            lang,
                            section: activeSection,
                            instanceId: activeInstanceId,
                            teamId: team.id,
                          })}
                          className="mt-2 inline-flex text-xs lowercase text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                        >
                          {copy.editActionLabel}
                        </Link>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">{team.checkpoint}</p>
                    <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{team.members.join(", ")}</p>
                  </div>
                ))}
              </div>
            </AdminPanel>
          </div>
        ) : null}

        {activeSection === "signals" ? (
          <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <AdminPanel eyebrow={copy.signalEyebrow} title={copy.sprintFeedTitle} description={copy.signalDescription}>
              <form action={addCheckpointFeedAction} className="grid gap-3 lg:grid-cols-2">
                <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                <select name="teamId" className={adminInputClassName}>
                  {state.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <div>
                  <FieldLabel htmlFor="signal-at">{copy.checkpointAtLabel}</FieldLabel>
                  <input id="signal-at" name="at" defaultValue="11:15" className={`${adminInputClassName} mt-2`} />
                </div>
                <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)] lg:col-span-2">
                  {copy.checkpointFormHint}
                </div>
                <div className="lg:col-span-2">
                  <FieldLabel htmlFor="signal-changed">{copy.checkpointChangedLabel}</FieldLabel>
                  <textarea id="signal-changed" name="checkpointChanged" rows={3} className={`${adminInputClassName} mt-2`} />
                </div>
                <div className="lg:col-span-2">
                  <FieldLabel htmlFor="signal-verified">{copy.checkpointVerifiedLabel}</FieldLabel>
                  <textarea id="signal-verified" name="checkpointVerified" rows={3} className={`${adminInputClassName} mt-2`} />
                </div>
                <div className="lg:col-span-2">
                  <FieldLabel htmlFor="signal-next-step">{copy.checkpointNextStepLabel}</FieldLabel>
                  <textarea id="signal-next-step" name="checkpointNextStep" rows={3} className={`${adminInputClassName} mt-2`} />
                </div>
                <AdminSubmitButton className={`${adminPrimaryButtonClassName} lg:col-span-2`}>
                  {copy.addUpdateButton}
                </AdminSubmitButton>
              </form>
            </AdminPanel>

            <AdminPanel eyebrow={copy.signalEyebrow} title={copy.completeChallengeTitle} description={copy.signalDescription}>
              <form action={completeChallengeAction} className="space-y-3">
                <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                <select name="teamId" className={adminInputClassName}>
                  {state.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <select name="challengeId" className={adminInputClassName}>
                  {state.challenges.map((challenge) => (
                    <option key={challenge.id} value={challenge.id}>
                      {challenge.title}
                    </option>
                  ))}
                </select>
                <AdminSubmitButton className={adminPrimaryButtonClassName}>
                  {copy.recordCompletionButton}
                </AdminSubmitButton>
              </form>
            </AdminPanel>
          </div>
        ) : null}

        {activeSection === "access" ? (
          <AdminPanel eyebrow={copy.facilitatorsEyebrow} title={copy.facilitatorsTitle} description={copy.facilitatorsDescription}>
            {!isNeonMode ? (
              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.fileModeFacilitatorsPanelTitle}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{copy.fileModeFacilitatorsPanelBody}</p>
                  <p className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)]">
                    {copy.fileModeFacilitators}
                  </p>
                  <div className="mt-4 space-y-3">
                    <KeyValueRow label={copy.fileModeAuthModeLabel} value={copy.fileModeAuthModeValue} />
                    <KeyValueRow label={copy.fileModeUsernameLabel} value={fileModeUsername} />
                    <KeyValueRow label={copy.fileModeScopeLabel} value={copy.fileModeScopeValue} />
                  </div>
                </div>

                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.fileModeUpgradeTitle}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{copy.fileModeUpgradeBody}</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
                      {copy.fileModeUpgradeBenefitOne}
                    </div>
                    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
                      {copy.fileModeUpgradeBenefitTwo}
                    </div>
                    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
                      {copy.fileModeUpgradeBenefitThree}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.16fr)_minmax(22rem,0.84fr)]">
                <div className="space-y-3">
                  {facilitatorGrants.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">{copy.facilitatorListEmpty}</p>
                  ) : (
                    facilitatorGrants.map((grant) => (
                      <div key={grant.id} className="flex items-center justify-between gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {grant.userName ?? grant.userEmail ?? grant.neonUserId}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {grant.userEmail ? `${grant.userEmail} · ` : ""}
                            {grant.role}
                          </p>
                        </div>
                        {isOwner && grant.id !== currentFacilitator?.grant.id ? (
                          <form action={revokeFacilitatorAction}>
                            <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                            <input name="grantId" type="hidden" value={grant.id} />
                            <AdminSubmitButton className="text-sm lowercase text-[var(--danger)] transition hover:text-[var(--text-primary)]">
                              {copy.revokeButton}
                            </AdminSubmitButton>
                          </form>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>

                {isOwner ? (
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">{copy.addFacilitatorTitle}</h3>
                    <form action={addFacilitatorAction} className="mt-4 grid gap-3">
                      <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder={copy.facilitatorEmailPlaceholder}
                        className={adminInputClassName}
                      />
                      <select name="role" className={adminInputClassName}>
                        <option value="operator">operator</option>
                        <option value="owner">owner</option>
                        <option value="observer">observer</option>
                      </select>
                      <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>
                        {copy.addFacilitatorButton}
                      </AdminSubmitButton>
                    </form>
                  </div>
                ) : null}
              </div>
            )}
          </AdminPanel>
        ) : null}

        {activeSection === "settings" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.18fr)]">
            <AdminPanel eyebrow={copy.accountEyebrow} title={copy.accountTitle} description={copy.accountDescription}>
              {!isNeonMode || !auth ? (
                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                  <p className="text-sm text-[var(--text-muted)]">{copy.accountFileMode}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <KeyValueRow label={copy.signInEmailLabel} value={signedInEmail ?? "unknown"} />
                  <KeyValueRow label="role" value={currentFacilitator?.grant.role ?? "unknown"} />
                  <KeyValueRow label={copy.activeInstance} value={state.workshopId} />
                </div>
              )}
            </AdminPanel>

            <div className="space-y-6">
              <AdminPanel
                eyebrow={copy.settingsSafetyEyebrow}
                title={copy.participantSurfaceCardTitle}
                description={copy.participantSurfaceCardDescription}
              >
                <div className="space-y-4">
                  <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                    {copy.participantStatePrefix} {overviewState.participantState}.
                  </div>
                  <form action={toggleRotationAction} className="space-y-4">
                    <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                    <div className="grid grid-cols-2 gap-3">
                      <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`} name="revealed" value="true">
                        {copy.unlockButton}
                      </AdminSubmitButton>
                      <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`} name="revealed" value="false">
                        {copy.hideAgainButton}
                      </AdminSubmitButton>
                    </div>
                    <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.participantSurfaceRecoveryHint}</p>
                  </form>
                </div>
              </AdminPanel>

              <AdminPanel eyebrow={copy.accountEyebrow} title={copy.passwordCardTitle} description={copy.accountDescription}>
                {!isNeonMode || !auth ? (
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                    <p className="text-sm text-[var(--text-muted)]">{copy.accountFileMode}</p>
                  </div>
                ) : (
                  <form action={changePasswordAction} className="space-y-4">
                    <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                    <div>
                      <FieldLabel htmlFor="current-password">{copy.currentPasswordLabel}</FieldLabel>
                      <input id="current-password" name="currentPassword" type="password" required className={`${adminInputClassName} mt-2`} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="new-password">{copy.newPasswordLabel}</FieldLabel>
                      <input id="new-password" name="newPassword" type="password" required className={`${adminInputClassName} mt-2`} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="confirm-password">{copy.confirmPasswordLabel}</FieldLabel>
                      <input id="confirm-password" name="confirmPassword" type="password" required className={`${adminInputClassName} mt-2`} />
                    </div>
                    <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                      <input name="revokeOtherSessions" type="checkbox" defaultChecked />
                      <span>{copy.revokeSessionsLabel}</span>
                    </label>

                    {passwordParam === "changed" ? (
                      <p className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)]">
                        {copy.passwordChanged}
                      </p>
                    ) : null}

                    {errorParam ? (
                      <p className="rounded-[18px] border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
                        {errorParam === "password_mismatch" ? copy.passwordMismatch : decodeURIComponent(errorParam)}
                      </p>
                    ) : null}

                    <AdminSubmitButton className={adminPrimaryButtonClassName}>
                      {copy.changePasswordButton}
                    </AdminSubmitButton>
                  </form>
                )}
              </AdminPanel>

              <AdminPanel
                eyebrow={copy.settingsSafetyEyebrow}
                title={copy.archiveResetTitle}
                description={copy.archiveResetDescription}
              >
                <div className="space-y-4">
                  <form action={archiveWorkshopAction} className="space-y-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                    <textarea
                      name="notes"
                      rows={3}
                      placeholder={copy.archivePlaceholder}
                      className={adminInputClassName}
                    />
                    <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.archiveHint}</p>
                    <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>
                      {copy.archiveButton}
                    </AdminSubmitButton>
                  </form>

                  <form action={resetWorkshopAction} className="space-y-3 rounded-[18px] border border-[var(--danger-border)] bg-[var(--danger-surface)] p-4">
                    <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                    <p className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                      {copy.resetBlueprintSummary}
                    </p>
                    <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.resetHint}</p>
                    <AdminSubmitButton className={`${adminDangerButtonClassName} w-full`}>
                      {copy.resetButton}
                    </AdminSubmitButton>
                  </form>

                  <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">{copy.blueprintLinkHint}</p>
                    <a
                      href={blueprintRepoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-medium lowercase text-[var(--text-primary)] transition hover:text-[var(--text-secondary)]"
                    >
                      {copy.blueprintLinkLabel}
                    </a>
                  </div>
                </div>
              </AdminPanel>
            </div>
          </div>
        ) : null}
          </div>
        </div>
      </div>
      {activeSection === "agenda" && activeOverlay === "agenda-edit" && selectedAgendaItem ? (
        <AdminSheet
          eyebrow={copy.agendaEditEyebrow}
          title={copy.agendaEditTitle}
          description={copy.agendaEditDescription}
          closeHref={agendaBaseHref}
          closeLabel={copy.closePanelButton}
        >
          <AgendaItemEditorSheetBody
            item={selectedAgendaItem}
            lang={lang}
            section={activeSection}
            instanceId={activeInstanceId}
            copy={copy}
          />
        </AdminSheet>
      ) : null}
      {activeSection === "agenda" && activeOverlay === "agenda-add" ? (
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
            section={activeSection}
            instanceId={activeInstanceId}
            copy={copy}
          />
        </AdminSheet>
      ) : null}
      {activeSection === "agenda" && activeOverlay === "scene-edit" && selectedAgendaItem && selectedScene ? (
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
            section={activeSection}
            instanceId={activeInstanceId}
            copy={copy}
          />
        </AdminSheet>
      ) : null}
      {activeSection === "agenda" && activeOverlay === "scene-add" && selectedAgendaItem ? (
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
            section={activeSection}
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

  return (
    <div className={`${compact ? "mt-4 space-y-4" : "space-y-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4"}`}>
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
            {(item.sourceRefs ?? []).map((ref) => (
              <a
                key={`${ref.path}-${ref.label}`}
                href={buildRepoSourceHref(ref.path)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-[16px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
              >
                <span className="font-medium">{ref.label}</span>
                <span className="text-xs text-[var(--text-muted)]">{copy.openRepoLabel}</span>
              </a>
            ))}
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
}: {
  scene: RichPresenterScene;
  agendaItemId: string;
  activeInstanceId: string;
  lang: UiLanguage;
  copy: (typeof adminCopy)[UiLanguage];
  isDefault: boolean;
  isSelected: boolean;
}) {
  const sceneBlocks = scene.blocks ?? [];
  const sceneMeta = [scene.sceneType, scene.intent, scene.chromePreset].filter(Boolean).join(" • ");
  const sceneEditorHref = buildAdminHref({
    lang,
    section: "agenda",
    instanceId: activeInstanceId,
    agendaItemId,
    sceneId: scene.id,
    overlay: "scene-edit",
  });

  return (
    <div
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
          <a
            href={buildPresenterRouteHref({
              lang,
              instanceId: activeInstanceId,
              agendaItemId,
              sceneId: scene.id,
            })}
            target="_blank"
            rel="noreferrer"
            className={adminGhostButtonClassName}
          >
            {copy.presenterOpenSelectedScene}
          </a>
          <Link href={sceneEditorHref} className={adminGhostButtonClassName}>
            {copy.presenterEditSceneButton}
          </Link>
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
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {(scene.sourceRefs ?? []).map((ref: SourceRef) => (
            <a
              key={`${ref.path}-${ref.label}`}
              href={buildRepoSourceHref(ref.path)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--card-top)]"
            >
              <span className="font-medium">{ref.label}</span>
              <span className="text-xs text-[var(--text-muted)]">{copy.openLinkLabel}</span>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TimelineRow({
  item,
  copy,
  detailed = false,
}: {
  item: Awaited<ReturnType<typeof getWorkshopState>>["agenda"][number];
  copy: (typeof adminCopy)[UiLanguage];
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
    <div className={`rounded-[22px] border px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] ${rowClassName}`}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <span className={`mt-1 h-3 w-3 rounded-full ${markerClassName}`} />
          <span className="mt-2 h-full w-px bg-[var(--border)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold text-[var(--text-primary)]">
              {item.time} • {item.title}
            </p>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{statusLabel}</span>
          </div>
          {detailed || item.status === "current" ? (
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{detailItem.roomSummary || item.description}</p>
          ) : null}
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
    <Link
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
    </Link>
  );
}
