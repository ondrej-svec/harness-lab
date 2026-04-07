import Link from "next/link";
import { redirect } from "next/navigation";
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
import { workshopTemplates } from "@/lib/workshop-data";
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
  adminDangerButtonClassName,
  adminInputClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "../../admin-ui";

export const dynamic = "force-dynamic";

const blueprintRepoUrl = "https://github.com/ondrej-svec/harness-lab/tree/main/workshop-blueprint";

function deriveNextTeamId(existingIds: string[]) {
  const numericIds = existingIds
    .map((id) => id.match(/^t(\d+)$/)?.[1])
    .filter(Boolean)
    .map((value) => Number(value));
  const nextNumber = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
  return `t${nextNumber}`;
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
  const description = String(formData.get("description") ?? "").trim();

  if (agendaId && title && time && description) {
    await updateAgendaItem(agendaId, { title, time, description }, instanceId);
  }

  redirect(buildAdminHref({ lang, section, instanceId, agendaItemId: agendaId || null }));
}

async function addAgendaItemAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const title = String(formData.get("title") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const afterItemId = String(formData.get("afterItemId") ?? "").trim();

  if (title && time && description) {
    const state = await addAgendaItem({ title, time, description, afterItemId: afterItemId || null }, instanceId);
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
  const text = String(formData.get("text") ?? "");
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
  const checkpoint = String(formData.get("checkpoint") ?? "").trim();
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
  const templateId = String(formData.get("templateId") ?? "");
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
  const [state, latestArchive, facilitatorGrants, currentFacilitator, authSession] = await Promise.all([
    getWorkshopState(activeInstanceId),
    getLatestWorkshopArchive(activeInstanceId),
    isNeonMode ? getInstanceGrantRepository().listActiveGrants(activeInstanceId) : Promise.resolve([]),
    isNeonMode ? getFacilitatorSession(activeInstanceId) : Promise.resolve(null),
    isNeonMode && auth ? auth.getSession() : Promise.resolve({ data: null }),
  ]);

  const { currentAgendaItem, nextAgendaItem, selectedInstance } = deriveAdminPageState(
    state,
    availableInstances,
    activeInstanceId,
  );
  const selectedAgendaItem =
    state.agenda.find((item) => item.id === query?.agendaItem) ?? currentAgendaItem ?? state.agenda[0] ?? null;
  const selectedTeam = state.teams.find((team) => team.id === query?.team) ?? state.teams[0] ?? null;
  const isOwner = currentFacilitator?.grant.role === "owner";
  const signedInEmail = authSession?.data?.user?.email ?? null;
  const signedInName = authSession?.data?.user?.name ?? null;
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

  return (
    <main className="min-h-screen bg-[var(--surface-admin)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.58),transparent_34%),radial-gradient(circle_at_top_right,rgba(0,0,0,0.04),transparent_24%),linear-gradient(180deg,var(--surface-admin),var(--surface-elevated))] px-4 py-6 text-[var(--text-primary)] sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-[94rem] flex-col gap-6">
        <header className="relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.06),transparent_62%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.09),transparent_62%)]" />
          <div className="relative grid gap-6 p-6 sm:p-7 xl:grid-cols-[minmax(0,1.42fr)_minmax(22rem,0.88fr)]">
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
                <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[rgba(255,255,255,0.56)] p-4 text-sm leading-6 text-[var(--text-secondary)] dark:bg-[rgba(28,25,23,0.56)]">
                  <p>{copy.sectionHint}</p>
                </div>
              </div>

              <div className="flex w-full max-w-xl flex-col gap-4 xl:items-end">
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
                    <button
                      type="submit"
                      className="text-xs lowercase text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                    >
                      {copy.signOutButton}
                    </button>
                  </form>
                </div>

                <section className="w-full rounded-[30px] border border-[var(--accent-border)] bg-[linear-gradient(180deg,rgba(12,10,9,0.96),rgba(28,25,23,0.9))] p-5 text-[var(--accent-text)] shadow-[0_20px_44px_rgba(12,10,9,0.18)]">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-muted)]">{copy.overviewTitle}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <ControlRoomHeroMetric label={copy.workspaceWhenLabel} value={selectedInstance?.workshopMeta.dateRange ?? state.workshopMeta.dateRange} />
                    <ControlRoomHeroMetric
                      label={copy.workspaceWhereLabel}
                      value={(selectedInstance ? getWorkshopLocationLines(selectedInstance).join(" / ") : "") || state.workshopMeta.city}
                    />
                    <ControlRoomHeroMetric label={copy.workspaceOwnerLabel} value={selectedInstance?.workshopMeta.facilitatorLabel ?? "n/a"} />
                    <ControlRoomHeroMetric label={copy.workspacePhaseLabel} value={state.workshopMeta.currentPhaseLabel} />
                  </div>
                </section>
              </div>

            <nav className="flex flex-wrap gap-x-3 gap-y-3 border-t border-[var(--border)] pt-4 xl:hidden">
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

          <div className="grid gap-px border-t border-[var(--border)] bg-[var(--border)] md:grid-cols-4">
            {summaryStats.map((stat) => (
              <SummaryStat key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} />
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-[var(--border)] px-6 py-4 text-xs leading-5 text-[var(--text-muted)] sm:px-7">
            {sessionState.signedInLine ? <p>{sessionState.signedInLine}</p> : null}
            {sessionState.archiveLine ? <p>{sessionState.archiveLine}</p> : null}
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-6 rounded-[30px] border border-[var(--accent-border)] bg-[linear-gradient(180deg,rgba(12,10,9,0.96),rgba(28,25,23,0.9))] p-4 text-[var(--accent-text)] shadow-[0_20px_44px_rgba(12,10,9,0.18)]">
              <p className="px-2 text-[11px] uppercase tracking-[0.28em] text-[var(--accent-muted)]">{copy.activeInstance}</p>
              <p className="mt-2 px-2 text-sm leading-6 text-[var(--accent-secondary)]">{state.workshopId}</p>
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

          <div className="space-y-6">
        {activeSection === "live" ? (
          <AdminPanel
            eyebrow={copy.workshopStateEyebrow}
            title={copy.overviewTitle}
            description={copy.overviewDescription}
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.34fr)_minmax(21rem,0.8fr)]">
              <section className="space-y-4">
                <div className="rounded-[30px] border border-[var(--accent-border)] bg-[linear-gradient(180deg,rgba(12,10,9,0.96),rgba(28,25,23,0.9))] p-6 text-[var(--accent-text)] shadow-[0_20px_44px_rgba(12,10,9,0.18)] sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--accent-border)] bg-[rgba(255,255,255,0.08)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--accent-muted)]">
                      {copy.liveNow}
                    </span>
                    <span className="rounded-full border border-[var(--accent-border)] bg-[rgba(255,255,255,0.08)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--accent-secondary)]">
                      {state.workshopMeta.currentPhaseLabel}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <h3 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--accent-text)]">
                        {overviewState.liveNowTitle}
                      </h3>
                      <p className="mt-4 max-w-2xl text-[15px] leading-6 text-[var(--accent-secondary)]">{overviewState.liveNowDescription}</p>
                    </div>
                    {overviewState.nextUpLabel ? (
                      <div className="rounded-[22px] border border-[var(--accent-border)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-sm leading-6 text-[var(--accent-secondary)]">
                        {overviewState.nextUpLabel}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {overviewState.compactRows.map((row) => (
                    <ControlRoomSnapshot key={row.label} label={row.label} value={row.value} />
                  ))}
                </div>

                <div className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.7)] p-5 shadow-[0_14px_30px_rgba(28,25,23,0.05)] dark:bg-[rgba(28,25,23,0.74)] sm:p-6">
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
                    <button className={`${adminPrimaryButtonClassName} w-full`} type="submit">
                      {copy.setCurrentPhase}
                    </button>
                  </form>
                </ControlCard>

                <ControlCard title={copy.continuationTitle} description={copy.continuationDescription}>
                  <form action={toggleRotationAction} className="space-y-4">
                    <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                    <div className="grid grid-cols-2 gap-3">
                      <button className={`${adminPrimaryButtonClassName} w-full`} type="submit" name="revealed" value="true">
                        {copy.unlockButton}
                      </button>
                      <button className={`${adminSecondaryButtonClassName} w-full`} type="submit" name="revealed" value="false">
                        {copy.hideAgainButton}
                      </button>
                    </div>
                    <div className="rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.54)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)] dark:bg-[rgba(28,25,23,0.56)]">
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
                      <button className={`${adminSecondaryButtonClassName} w-full`} type="submit">
                        {copy.archiveButton}
                      </button>
                    </form>

                    <form action={resetWorkshopAction} className="space-y-3 rounded-[18px] border border-[var(--danger-border)] bg-[var(--danger-surface)] p-4">
                      <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                      <select name="templateId" className={adminInputClassName}>
                        {workshopTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.label} • {template.room}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.resetHint}</p>
                      <button className={`${adminDangerButtonClassName} w-full`} type="submit">
                        {copy.resetButton}
                      </button>
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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.9fr)]">
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

            <div className="space-y-6">
              <AdminPanel eyebrow={copy.currentPhase} title={copy.agendaCurrentTitle} description={copy.phaseControlHint}>
                <div className="space-y-4">
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.liveNow}</p>
                    <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                      {currentAgendaItem?.time} • {currentAgendaItem?.title}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{currentAgendaItem?.description}</p>
                  </div>
                </div>
              </AdminPanel>

              <AdminPanel eyebrow={copy.agendaEditEyebrow} title={copy.agendaEditTitle} description={copy.agendaEditDescription}>
                {selectedAgendaItem ? (
                  <div className="space-y-4">
                    <form action={saveAgendaDetailsAction} className="space-y-3">
                      <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                      <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                      <input name="title" defaultValue={selectedAgendaItem.title} className={adminInputClassName} />
                      <input name="time" defaultValue={selectedAgendaItem.time} className={adminInputClassName} />
                      <textarea name="description" rows={4} defaultValue={selectedAgendaItem.description} className={adminInputClassName} />
                      <button className={adminPrimaryButtonClassName} type="submit">
                        {copy.saveAgendaItemButton}
                      </button>
                    </form>

                    <div className="grid grid-cols-2 gap-3">
                      <form action={moveAgendaItemAction}>
                        <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                        <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                        <input name="direction" type="hidden" value="up" />
                        <button className={`${adminSecondaryButtonClassName} w-full`} type="submit">
                          {copy.moveUpButton}
                        </button>
                      </form>
                      <form action={moveAgendaItemAction}>
                        <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                        <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                        <input name="direction" type="hidden" value="down" />
                        <button className={`${adminSecondaryButtonClassName} w-full`} type="submit">
                          {copy.moveDownButton}
                        </button>
                      </form>
                    </div>

                    <form action={setAgendaAction} className="space-y-3">
                      <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                      <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                      <button className={`${adminSecondaryButtonClassName} w-full`} type="submit">
                        {copy.setCurrentPhase}
                      </button>
                    </form>

                    <form action={removeAgendaItemAction}>
                      <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                      <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                      <button className={`${adminDangerButtonClassName} w-full`} type="submit">
                        {copy.removeAgendaItemButton}
                      </button>
                    </form>
                  </div>
                ) : null}
              </AdminPanel>

              <AdminPanel eyebrow={copy.agendaEditEyebrow} title={copy.addAgendaItemTitle} description={copy.addAgendaItemDescription}>
                <form action={addAgendaItemAction} className="space-y-3">
                  <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                  <input name="title" placeholder={copy.addAgendaItemTitle} className={adminInputClassName} />
                  <input name="time" placeholder="16:10" className={adminInputClassName} />
                  <textarea name="description" rows={4} placeholder={copy.teamCheckpointPlaceholder} className={adminInputClassName} />
                  <select name="afterItemId" defaultValue={selectedAgendaItem?.id ?? ""} className={adminInputClassName}>
                    {state.agenda.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.time} • {item.title}
                      </option>
                    ))}
                  </select>
                  <button className={adminPrimaryButtonClassName} type="submit">
                    {copy.addAgendaItemButton}
                  </button>
                </form>
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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
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

                <form action={registerTeamAction} className="grid gap-3">
                  <AdminActionStateFields
                    lang={lang}
                    section={activeSection}
                    instanceId={activeInstanceId}
                  />
                  <input name="id" type="hidden" value={selectedTeam?.id ?? ""} />
                  <input name="name" placeholder={copy.teamNamePlaceholder} defaultValue={selectedTeam?.name ?? ""} className={adminInputClassName} />
                  <input name="city" placeholder="Studio A" defaultValue={selectedTeam?.city ?? ""} className={adminInputClassName} />
                  <input name="repoUrl" placeholder="https://github.com/..." defaultValue={selectedTeam?.repoUrl ?? ""} className={adminInputClassName} />
                  <input name="projectBriefId" placeholder="standup-bot" defaultValue={selectedTeam?.projectBriefId ?? ""} className={adminInputClassName} />
                  <input
                    name="members"
                    placeholder="Anna, David, Eva"
                    defaultValue={selectedTeam?.members.join(", ") ?? ""}
                    className={adminInputClassName}
                  />
                  <textarea
                    name="checkpoint"
                    rows={5}
                    placeholder={copy.teamCheckpointPlaceholder}
                    defaultValue={selectedTeam?.checkpoint ?? ""}
                    className={adminInputClassName}
                  />
                  <button className={adminPrimaryButtonClassName} type="submit">
                    {selectedTeam ? copy.updateTeamButton : copy.createTeamButton}
                  </button>
                </form>
              </div>
            </AdminPanel>

            <AdminPanel eyebrow={copy.navTeams} title={copy.teamOpsTitle} description={copy.teamOpsDescription}>
              <div className="space-y-3">
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
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{team.checkpoint}</p>
                    <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{team.members.join(", ")}</p>
                  </div>
                ))}
              </div>
            </AdminPanel>
          </div>
        ) : null}

        {activeSection === "signals" ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <AdminPanel eyebrow={copy.signalEyebrow} title={copy.sprintFeedTitle} description={copy.signalDescription}>
              <form action={addCheckpointFeedAction} className="space-y-3">
                <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                <select name="teamId" className={adminInputClassName}>
                  {state.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <input name="at" defaultValue="11:15" className={adminInputClassName} />
                <textarea name="text" rows={4} className={adminInputClassName} />
                <button className={adminPrimaryButtonClassName} type="submit">
                  {copy.addUpdateButton}
                </button>
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
                <button className={adminPrimaryButtonClassName} type="submit">
                  {copy.recordCompletionButton}
                </button>
              </form>
            </AdminPanel>
          </div>
        ) : null}

        {activeSection === "access" ? (
          <AdminPanel eyebrow={copy.facilitatorsEyebrow} title={copy.facilitatorsTitle} description={copy.facilitatorsDescription}>
            {!isNeonMode ? (
              <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                <p className="text-sm text-[var(--text-muted)]">{copy.fileModeFacilitators}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {facilitatorGrants.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">{copy.facilitatorListEmpty}</p>
                ) : (
                  <div className="space-y-3">
                    {facilitatorGrants.map((grant) => (
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
                            <button type="submit" className="text-sm lowercase text-[var(--danger)] transition hover:text-[var(--text-primary)]">
                              {copy.revokeButton}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                {isOwner ? (
                  <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">{copy.addFacilitatorTitle}</h3>
                    <form action={addFacilitatorAction} className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(10rem,0.45fr)_auto] md:items-end">
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
                      <button className={adminPrimaryButtonClassName} type="submit">
                        {copy.addFacilitatorButton}
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            )}
          </AdminPanel>
        ) : null}

        {activeSection === "settings" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
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

                  <button className={adminPrimaryButtonClassName} type="submit">
                    {copy.changePasswordButton}
                  </button>
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
    <div className="rounded-[22px] border border-[var(--accent-border)] bg-[rgba(255,255,255,0.08)] px-4 py-4 transition duration-200 hover:bg-[rgba(255,255,255,0.12)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--accent-muted)]">{label}</p>
      <p className="mt-2 text-[13px] leading-5 text-[var(--accent-text)] sm:text-sm sm:leading-6">{value}</p>
    </div>
  );
}

function ControlRoomSnapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[rgba(255,255,255,0.62)] px-4 py-4 transition duration-200 hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.82)] dark:bg-[rgba(28,25,23,0.64)] dark:hover:bg-[rgba(28,25,23,0.78)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-[15px] font-semibold leading-5 text-[var(--text-primary)]">{value}</p>
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
        ? "border-[var(--border)] bg-[rgba(255,255,255,0.46)] dark:bg-[rgba(28,25,23,0.44)]"
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
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p>
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
      className={`rounded-full border px-4 py-2 text-sm font-medium lowercase transition duration-200 hover:-translate-y-0.5 ${
        dark
          ? active
            ? "border-[var(--accent-border)] bg-[rgba(255,255,255,0.12)] text-[var(--accent-text)] shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
            : "border-transparent text-[var(--accent-secondary)] hover:border-[var(--accent-border)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--accent-text)]"
          : active
            ? "border-[var(--border-strong)] bg-[var(--surface-soft)] text-[var(--text-primary)] shadow-[0_10px_24px_rgba(28,25,23,0.08)]"
            : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </Link>
  );
}
