import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { requireFacilitatorActionAccess, requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { auth } from "@/lib/auth/server";
import {
  buildAdminHref,
  buildAdminWorkspaceHref,
  buildWorkspaceStatusLabel,
  buildAdminOverviewState,
  buildAdminSessionState,
  buildAdminSummaryStats,
  deriveAdminPageState,
  getWorkshopDisplayTitle,
  getWorkshopLocationLines,
  readActionState,
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
import { workshopTemplates, type AgendaItem, type PresenterScene, type Team } from "@/lib/workshop-data";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import {
  addAgendaItem,
  addSprintUpdate,
  createWorkshopArchive,
  completeChallenge,
  getWorkshopState,
  getLatestWorkshopArchive,
  moveAgendaItem,
  removeAgendaItem,
  resetWorkshopState,
  setCurrentAgendaItem,
  setRotationReveal,
  updateAgendaItem,
  upsertTeam,
} from "@/lib/workshop-store";
import {
  AdminLanguageSwitcher,
  AdminPanel,
  ControlCard,
  FieldLabel,
  KeyValueRow,
  SummaryStat,
  StatusPill,
  adminHeroPanelClassName,
  adminHeroTileClassName,
  adminDangerButtonClassName,
  adminInputClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "../../admin-ui";

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

type PresenterBlock = {
  id: string;
  type: string;
};

type RichPresenterScene = PresenterScene & Partial<{
  intent: string;
  chromePreset: string;
  blocks: PresenterBlock[];
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
  const description = roomSummary || goal || String(formData.get("description") ?? "").trim();
  const afterItemId = String(formData.get("afterItemId") ?? "").trim();

  if (title && time && description) {
    const state = await addAgendaItem(
      {
        title,
        time,
        description,
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
  }>;
}) {
  const routeParams = await params;
  const query = await searchParams;
  const lang = resolveUiLanguage(query?.lang);
  const copy = adminCopy[lang];
  const activeSection = resolveAdminSection(query?.section);
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
  const richCurrentAgendaItem = currentAgendaItem as RichAgendaItem | null;
  const selectedAgendaItem =
    ((state.agenda.find((item: AgendaItem) => item.id === query?.agendaItem) ?? currentAgendaItem ?? state.agenda[0]) as RichAgendaItem | undefined) ??
    null;
  const selectedTeam = state.teams.find((team: Team) => team.id === query?.team) ?? state.teams[0] ?? null;
  const selectedTeamCheckpoint = parseEvidenceSummary(selectedTeam?.checkpoint ?? "");
  const isOwner = currentFacilitator?.grant.role === "owner";
  const signedInEmail = authSession?.data?.user?.email ?? null;
  const signedInName = authSession?.data?.user?.name ?? null;
  const fileModeUsername = process.env.HARNESS_ADMIN_USERNAME ?? "facilitator";
  const summaryStats = buildAdminSummaryStats({ copy, state, selectedInstance, currentAgendaItem });
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
  const presenterState = buildPresenterControlState({
    state,
    instanceId: activeInstanceId,
    lang,
  });

  return (
    <main className="min-h-screen bg-[var(--surface-admin)] bg-[radial-gradient(circle_at_top_left,var(--ambient-right),transparent_34%),radial-gradient(circle_at_top_right,var(--ambient-left),transparent_24%),linear-gradient(180deg,var(--surface-admin),var(--surface-elevated))] px-4 py-6 text-[var(--text-primary)] sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-[112rem] flex-col gap-6">
        <header className="relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_62%)]" />
          <div className="relative grid gap-5 p-6 sm:p-7 xl:grid-cols-[minmax(0,1.34fr)_minmax(23rem,0.9fr)] 2xl:grid-cols-[minmax(0,1.42fr)_minmax(25rem,0.92fr)]">
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
              </div>

              <div className="flex w-full max-w-2xl flex-col gap-4 xl:items-end">
                <div className="flex items-center gap-3 self-start text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] xl:self-end">
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

                <section className={`${adminHeroPanelClassName} w-full p-4`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--hero-muted)]">
                      {copy.liveNow}
                    </span>
                    <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--hero-secondary)]">
                      {state.workshopMeta.currentPhaseLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-[var(--hero-muted)]">{copy.overviewTitle}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <ControlRoomHeroMetric label={copy.workspaceWhenLabel} value={selectedInstance?.workshopMeta.dateRange ?? state.workshopMeta.dateRange} />
                    <ControlRoomHeroMetric
                      label={copy.workspaceWhereLabel}
                      value={(selectedInstance ? getWorkshopLocationLines(selectedInstance).join(" / ") : "") || state.workshopMeta.city}
                    />
                    <ControlRoomHeroMetric label={copy.workspaceOwnerLabel} value={selectedInstance?.workshopMeta.facilitatorLabel ?? "n/a"} />
                    <ControlRoomHeroMetric label={copy.workspaceSignalLabel} value={overviewState.participantState} />
                  </div>
                </section>
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
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-[var(--border)] bg-[var(--border)] md:grid-cols-4">
            {summaryStats.map((stat) => (
              <SummaryStat key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} />
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-[var(--border)] px-6 py-4 text-xs leading-5 text-[var(--text-muted)] sm:px-7">
            {sessionState.signedInLine ? <p>{sessionState.signedInLine}</p> : null}
            {sessionState.archiveLine ? <p>{sessionState.archiveLine}</p> : null}
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
              <section className="space-y-4">
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

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {overviewState.compactRows.map((row) => (
                    <ControlRoomSnapshot key={row.label} label={row.label} value={row.value} />
                  ))}
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

              <section className="space-y-4">
                <ControlCard title={copy.moveAgendaTitle} description={copy.phaseControlHint}>
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
                </ControlCard>

                <ControlCard title={copy.continuationTitle} description={copy.continuationDescription}>
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
                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                      {copy.participantStatePrefix} {overviewState.participantState}.
                    </div>
                  </form>

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

                <ControlCard title={copy.presenterCardTitle} description={copy.presenterCardDescription}>
                  <div className="space-y-4">
                    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                      <span className="font-medium text-[var(--text-primary)]">{copy.presenterCurrentSceneLabel}:</span>{" "}
                      {presenterState.currentDefaultScene?.label ?? copy.presenterNoSceneTitle}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <a
                        className={`${adminPrimaryButtonClassName} inline-flex w-full items-center justify-center`}
                        href={presenterState.currentPresenterHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.presenterOpenCurrentButton}
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

                <ControlCard title={copy.archiveResetTitle} description={copy.archiveResetDescription}>
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
                </ControlCard>
              </section>
            </div>
          </AdminPanel>
        ) : null}

        {activeSection === "agenda" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(22rem,0.94fr)] 2xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.9fr)_minmax(19rem,0.82fr)]">
            <div className="2xl:min-h-full">
              <AdminPanel
                eyebrow={copy.workshopStateEyebrow}
                title={copy.agendaSectionTitle}
                description={copy.agendaSectionDescription}
              >
                <div className="space-y-3">
                  {state.agenda.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-[20px] border p-4 ${
                        selectedAgendaItem?.id === item.id
                          ? "border-[var(--text-primary)] bg-[var(--surface)]"
                          : "border-[var(--border)] bg-[var(--surface-soft)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <TimelineRow item={item} copy={copy} detailed />
                        <Link
                          href={buildAdminHref({
                            lang,
                            section: activeSection,
                            instanceId: activeInstanceId,
                            agendaItemId: item.id,
                          })}
                          className="text-xs lowercase text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                        >
                          {copy.editActionLabel}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminPanel>
            </div>

            <div className="space-y-6">
              <AdminPanel eyebrow={copy.agendaEditEyebrow} title={copy.agendaEditTitle} description={copy.agendaEditDescription}>
                {selectedAgendaItem ? (
                  <div className="space-y-4">
                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.agendaEditEyebrow}</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                        {selectedAgendaItem.time} • {selectedAgendaItem.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {selectedAgendaItem.roomSummary || selectedAgendaItem.description}
                      </p>
                    </div>

                    <form action={saveAgendaDetailsAction} className="space-y-3">
                      <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                      <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem]">
                        <input name="title" defaultValue={selectedAgendaItem.title} className={adminInputClassName} />
                        <input name="time" defaultValue={selectedAgendaItem.time} className={adminInputClassName} />
                      </div>
                      <div>
                        <FieldLabel htmlFor="agenda-goal">goal</FieldLabel>
                        <textarea
                          id="agenda-goal"
                          name="goal"
                          rows={3}
                          defaultValue={selectedAgendaItem.goal}
                          className={`${adminInputClassName} mt-2`}
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="agenda-room-summary">room summary</FieldLabel>
                        <textarea
                          id="agenda-room-summary"
                          name="roomSummary"
                          rows={4}
                          defaultValue={selectedAgendaItem.roomSummary}
                          className={`${adminInputClassName} mt-2`}
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="agenda-prompts">facilitator prompts</FieldLabel>
                        <textarea
                          id="agenda-prompts"
                          name="facilitatorPrompts"
                          rows={4}
                          defaultValue={listToTextareaValue(selectedAgendaItem.facilitatorPrompts)}
                          className={`${adminInputClassName} mt-2`}
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="agenda-watch-fors">watch fors</FieldLabel>
                        <textarea
                          id="agenda-watch-fors"
                          name="watchFors"
                          rows={4}
                          defaultValue={listToTextareaValue(selectedAgendaItem.watchFors)}
                          className={`${adminInputClassName} mt-2`}
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="agenda-checkpoints">checkpoint questions</FieldLabel>
                        <textarea
                          id="agenda-checkpoints"
                          name="checkpointQuestions"
                          rows={4}
                          defaultValue={listToTextareaValue(selectedAgendaItem.checkpointQuestions)}
                          className={`${adminInputClassName} mt-2`}
                        />
                      </div>
                      <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>
                        {copy.saveAgendaItemButton}
                      </AdminSubmitButton>
                    </form>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <form action={moveAgendaItemAction}>
                        <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                        <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                        <input name="direction" type="hidden" value="up" />
                        <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>
                          {copy.moveUpButton}
                        </AdminSubmitButton>
                      </form>
                      <form action={moveAgendaItemAction}>
                        <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                        <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                        <input name="direction" type="hidden" value="down" />
                        <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>
                          {copy.moveDownButton}
                        </AdminSubmitButton>
                      </form>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <form action={setAgendaAction}>
                        <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                        <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                        <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>
                          {copy.setCurrentPhase}
                        </AdminSubmitButton>
                      </form>

                      <form action={removeAgendaItemAction}>
                        <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                        <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                        <AdminSubmitButton className={`${adminDangerButtonClassName} w-full`}>
                          {copy.removeAgendaItemButton}
                        </AdminSubmitButton>
                      </form>
                    </div>
                  </div>
                ) : null}
              </AdminPanel>

              <AdminPanel eyebrow={copy.currentPhase} title={copy.agendaCurrentTitle} description={copy.phaseControlHint}>
                <div className="space-y-4">
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.liveNow}</p>
                    <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                      {currentAgendaItem?.time} • {currentAgendaItem?.title}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                      {richCurrentAgendaItem?.roomSummary || currentAgendaItem?.description}
                    </p>
                    {richCurrentAgendaItem ? <AgendaItemDetail item={richCurrentAgendaItem} lang={lang} compact /> : null}
                  </div>
                </div>
              </AdminPanel>
            </div>

            <div className="space-y-6">
              <AdminPanel eyebrow={copy.agendaEditEyebrow} title={copy.addAgendaItemTitle} description={copy.addAgendaItemDescription}>
                <form action={addAgendaItemAction} className="space-y-3">
                  <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                  <input name="title" placeholder={copy.addAgendaItemTitle} className={adminInputClassName} />
                  <input name="time" placeholder="16:10" className={adminInputClassName} />
                  <textarea name="goal" rows={3} placeholder="Co má tahle chvíle udělat" className={adminInputClassName} />
                  <textarea name="roomSummary" rows={4} placeholder={copy.teamCheckpointPlaceholder} className={adminInputClassName} />
                  <textarea name="facilitatorPrompts" rows={3} placeholder="Jedna prompt/otázka na řádek" className={adminInputClassName} />
                  <textarea name="watchFors" rows={3} placeholder="Na co si dát pozor" className={adminInputClassName} />
                  <textarea name="checkpointQuestions" rows={3} placeholder="Checkpoint otázky" className={adminInputClassName} />
                  <select name="afterItemId" defaultValue={selectedAgendaItem?.id ?? ""} className={adminInputClassName}>
                    {state.agenda.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.time} • {item.title}
                      </option>
                    ))}
                  </select>
                  <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>
                    {copy.addAgendaItemButton}
                  </AdminSubmitButton>
                </form>
              </AdminPanel>

              <AdminPanel eyebrow={copy.presenterCardTitle} title={copy.presenterScenesLabel} description={copy.presenterCardDescription}>
                {selectedAgendaItem ? (
                  <div className="space-y-3">
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
                        />
                      ))
                    ) : (
                      <p className="text-sm leading-6 text-[var(--text-secondary)]">{copy.presenterNoSceneBody}</p>
                    )}
                  </div>
                ) : null}
              </AdminPanel>

              <AdminPanel eyebrow={copy.agendaSourceTitle} title={copy.agendaSourceTitle} description={copy.agendaSourceBody}>
                <div className="space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
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
          </div>
        ) : null}
          </div>
        </div>
      </div>
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

function ControlRoomHeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${adminHeroTileClassName} px-4 py-4`}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--hero-muted)]">{label}</p>
      <p className="mt-2 text-[13px] leading-5 text-[var(--hero-text)] sm:text-sm sm:leading-6">{value}</p>
    </div>
  );
}

function ControlRoomSnapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] px-4 py-4 transition duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-[15px] font-semibold leading-5 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function AgendaItemDetail({
  item,
  lang,
  compact = false,
}: {
  item: RichAgendaItem;
  lang: UiLanguage;
  compact?: boolean;
}) {
  const sections: Array<{ title: string; items: string[] }> = [
    { title: "Facilitator prompts", items: item.facilitatorPrompts ?? [] },
    { title: "Watch fors", items: item.watchFors ?? [] },
    { title: "Checkpoint questions", items: item.checkpointQuestions ?? [] },
  ].filter((section) => section.items.length > 0);

  return (
    <div className={`${compact ? "mt-4 space-y-4" : "space-y-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4"}`}>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">goal</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{item.goal}</p>
        </div>
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">room summary</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{item.roomSummary}</p>
        </div>
      </div>

      {sections.length > 0 ? (
        <div className="grid gap-3 xl:grid-cols-3">
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
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">source material</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(item.sourceRefs ?? []).map((ref) => (
              <a
                key={`${ref.path}-${ref.label}`}
                href={buildRepoSourceHref(ref.path)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              >
                {ref.label}
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
}: {
  scene: RichPresenterScene;
  agendaItemId: string;
  activeInstanceId: string;
  lang: UiLanguage;
  copy: (typeof adminCopy)[UiLanguage];
  isDefault: boolean;
}) {
  const sceneBlocks = scene.blocks ?? [];
  const sceneMeta = [scene.sceneType, scene.intent, scene.chromePreset].filter(Boolean).join(" • ");

  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-[var(--text-primary)]">{scene.label}</p>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            {sceneMeta}
            {isDefault ? ` • ${copy.presenterCurrentSceneLabel}` : ""}
            {!scene.enabled ? ` • ${copy.presenterSceneDisabled}` : ""}
          </p>
        </div>
        <a
          href={buildPresenterRouteHref({
            lang,
            instanceId: activeInstanceId,
            agendaItemId,
            sceneId: scene.id,
          })}
          target="_blank"
          rel="noreferrer"
          className="text-sm lowercase text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          {copy.presenterOpenSelectedScene}
        </a>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{scene.body}</p>
      {sceneBlocks.length > 0 ? (
        <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">room blocks</p>
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
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">facilitator notes</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
            {(scene.facilitatorNotes ?? []).map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {(scene.sourceRefs ?? []).length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {(scene.sourceRefs ?? []).map((ref: SourceRef) => (
            <a
              key={`${ref.path}-${ref.label}`}
              href={buildRepoSourceHref(ref.path)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              {ref.label}
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
