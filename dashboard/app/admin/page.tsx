import Link from "next/link";
import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess, requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { auth } from "@/lib/auth/server";
import {
  buildAdminHref,
  buildAdminOverviewState,
  buildAdminSessionState,
  buildAdminSummaryStats,
  deriveAdminPageState,
  readActionState,
  resolveActiveInstanceId,
  resolveAdminSection,
  type AdminSection,
} from "@/lib/admin-page-view-model";
import { getInstanceGrantRepository } from "@/lib/instance-grant-repository";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";
import { getNeonSql } from "@/lib/neon-db";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { adminCopy, resolveUiLanguage, type UiLanguage, withLang } from "@/lib/ui-language";
import { ThemeSwitcher } from "../components/theme-switcher";
import { workshopTemplates } from "@/lib/workshop-data";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import {
  addAgendaItem,
  addSprintUpdate,
  createWorkshopInstance,
  createWorkshopArchive,
  completeChallenge,
  getWorkshopState,
  getLatestWorkshopArchive,
  moveAgendaItem,
  removeAgendaItem,
  removeWorkshopInstance,
  resetWorkshopState,
  setCurrentAgendaItem,
  setRotationReveal,
  updateAgendaItem,
  upsertTeam,
} from "@/lib/workshop-store";

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

async function switchInstanceAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  if (!instanceId) {
    redirect(buildAdminHref({ lang, section }));
  }

  await requireFacilitatorActionAccess(instanceId);
  redirect(buildAdminHref({ lang, section, instanceId }));
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

async function createInstanceAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const id = String(formData.get("newInstanceId") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const dateRange = String(formData.get("dateRange") ?? "").trim();
  if (id && templateId) {
    await createWorkshopInstance({ id, templateId, city, dateRange });
    redirect(buildAdminHref({ lang, section, instanceId: id }));
  }

  redirect(buildAdminHref({ lang, section, instanceId }));
}

async function removeInstanceAction(formData: FormData) {
  "use server";
  const { lang, section, instanceId } = readActionState(formData);
  await requireFacilitatorActionAccess(instanceId);
  const targetInstanceId = String(formData.get("targetInstanceId") ?? "").trim();
  if (targetInstanceId) {
    await removeWorkshopInstance(targetInstanceId);
    const remainingInstances = await getWorkshopInstanceRepository().listInstances();
    const fallbackInstanceId = remainingInstances.find((instance) => instance.id !== targetInstanceId)?.id ?? undefined;
    redirect(buildAdminHref({ lang, section, instanceId: fallbackInstanceId }));
  }

  redirect(buildAdminHref({ lang, section, instanceId }));
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
  searchParams,
}: {
  searchParams?: Promise<{
    lang?: string;
    section?: string;
    error?: string;
    password?: string;
    instance?: string;
    team?: string;
    agendaItem?: string;
  }>;
}) {
  const params = await searchParams;
  const lang = resolveUiLanguage(params?.lang);
  const copy = adminCopy[lang];
  const activeSection = resolveAdminSection(params?.section);
  const errorParam = params?.error;
  const passwordParam = params?.password;
  const instanceRepo = getWorkshopInstanceRepository();
  const [availableInstances, defaultInstanceId] = await Promise.all([
    instanceRepo.listInstances(),
    instanceRepo.getDefaultInstanceId(),
  ]);
  const activeInstanceId = resolveActiveInstanceId(availableInstances, params?.instance, defaultInstanceId);

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
    state.agenda.find((item) => item.id === params?.agendaItem) ?? currentAgendaItem ?? state.agenda[0] ?? null;
  const selectedTeam = state.teams.find((team) => team.id === params?.team) ?? state.teams[0] ?? null;
  const isOwner = currentFacilitator?.grant.role === "owner";
  const canRemoveInstance = !isNeonMode || isOwner;
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
    <main className="min-h-screen bg-[var(--surface-admin)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.58),transparent_38%),linear-gradient(180deg,var(--surface-admin),var(--surface-elevated))] px-4 py-6 text-[var(--text-primary)] sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="flex flex-col gap-6 p-6 sm:p-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{copy.deskEyebrow}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-4xl">
                  {copy.pageTitle}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{copy.pageBody}</p>
                <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{copy.sectionHint}</p>
              </div>

              <div className="flex w-full max-w-xl flex-col gap-4 xl:items-end">
                <div className="grid w-full gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {copy.instanceSwitcherTitle}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                        {copy.instanceSwitcherDescription}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      <AdminLanguageSwitcher lang={lang} section={activeSection} instanceId={activeInstanceId} />
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
                  </div>

                  <form action={switchInstanceAction} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div>
                      <FieldLabel htmlFor="instance-id">{copy.instanceSelectLabel}</FieldLabel>
                      <input name="lang" type="hidden" value={lang} />
                      <input name="section" type="hidden" value={activeSection} />
                      <select id="instance-id" name="instanceId" defaultValue={activeInstanceId} className={inputClassName}>
                        {availableInstances.map((instance) => (
                          <option key={instance.id} value={instance.id}>
                            {instance.workshopMeta.city} • {instance.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button className={secondaryButtonClassName} type="submit">
                      {copy.switchInstanceButton}
                    </button>
                  </form>

                  <div className="grid gap-3 md:grid-cols-2">
                    <form action={createInstanceAction} className="space-y-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
                      <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                      <p className="text-sm font-medium text-[var(--text-primary)]">{copy.createInstanceTitle}</p>
                      <select name="templateId" className={inputClassName} defaultValue={selectedInstance?.templateId ?? workshopTemplates[0]?.id}>
                        {workshopTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.label}
                          </option>
                        ))}
                      </select>
                      <input name="newInstanceId" placeholder={copy.newInstanceIdPlaceholder} className={inputClassName} />
                      <input
                        name="city"
                        placeholder={copy.instanceCityPlaceholder}
                        className={inputClassName}
                        defaultValue={selectedInstance?.workshopMeta.city ?? ""}
                      />
                      <input
                        name="dateRange"
                        placeholder={copy.instanceDateRangePlaceholder}
                        className={inputClassName}
                        defaultValue={selectedInstance?.workshopMeta.dateRange ?? ""}
                      />
                      <button className={`${secondaryButtonClassName} w-full`} type="submit">
                        {copy.createInstanceButton}
                      </button>
                    </form>

                    <form action={removeInstanceAction} className="space-y-3 rounded-[18px] border border-[var(--danger-border)] bg-[var(--danger-surface)] p-4">
                      <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                      <input name="targetInstanceId" type="hidden" value={activeInstanceId} />
                      <p className="text-sm font-medium text-[var(--text-primary)]">{copy.removeInstanceTitle}</p>
                      <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.removeInstanceHint}</p>
                      <button className={`${dangerButtonClassName} w-full disabled:cursor-not-allowed disabled:opacity-50`} type="submit" disabled={!canRemoveInstance || availableInstances.length <= 1}>
                        {copy.removeInstanceButton}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex flex-wrap gap-x-5 gap-y-3 border-t border-[var(--border)] pt-4">
              <AdminSectionLink
                lang={lang}
                section="overview"
                activeSection={activeSection}
                label={copy.navOverview}
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
                section="account"
                activeSection={activeSection}
                label={copy.navAccount}
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

        {activeSection === "overview" ? (
          <AdminPanel
            eyebrow={copy.workshopStateEyebrow}
            title={copy.overviewTitle}
            description={copy.overviewDescription}
          >
            <div className="grid gap-4 rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:grid-cols-3">
              {overviewState.compactRows.map((row) => (
                <KeyValueRow key={row.label} label={row.label} value={row.value} compact />
              ))}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.78fr)]">
              <section className="space-y-4">
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.liveNow}</p>
                      <h3 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">{overviewState.liveNowTitle}</h3>
                    </div>
                    {overviewState.nextUpLabel ? (
                      <div className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm text-[var(--text-secondary)]">
                        {overviewState.nextUpLabel}
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">{overviewState.liveNowDescription}</p>
                </div>

                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
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
                    <select name="agendaId" defaultValue={currentAgendaItem?.id} className={inputClassName}>
                      {overviewState.phaseOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <button className={`${primaryButtonClassName} w-full`} type="submit">
                      {copy.setCurrentPhase}
                    </button>
                  </form>
                </ControlCard>

                <ControlCard title={copy.continuationTitle} description={copy.continuationDescription}>
                  <form action={toggleRotationAction} className="space-y-4">
                    <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                    <div className="grid grid-cols-2 gap-3">
                      <button className={`${primaryButtonClassName} w-full`} type="submit" name="revealed" value="true">
                        {copy.unlockButton}
                      </button>
                      <button className={`${secondaryButtonClassName} w-full`} type="submit" name="revealed" value="false">
                        {copy.hideAgainButton}
                      </button>
                    </div>
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">
                      {copy.participantStatePrefix} {overviewState.participantState}.
                    </p>
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
                        className={inputClassName}
                      />
                      <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.archiveHint}</p>
                      <button className={`${secondaryButtonClassName} w-full`} type="submit">
                        {copy.archiveButton}
                      </button>
                    </form>

                    <form action={resetWorkshopAction} className="space-y-3 rounded-[18px] border border-[var(--danger-border)] bg-[var(--danger-surface)] p-4">
                      <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                      <select name="templateId" className={inputClassName}>
                        {workshopTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.label} • {template.room}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.resetHint}</p>
                      <button className={`${dangerButtonClassName} w-full`} type="submit">
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
                      <input name="title" defaultValue={selectedAgendaItem.title} className={inputClassName} />
                      <input name="time" defaultValue={selectedAgendaItem.time} className={inputClassName} />
                      <textarea name="description" rows={4} defaultValue={selectedAgendaItem.description} className={inputClassName} />
                      <button className={primaryButtonClassName} type="submit">
                        {copy.saveAgendaItemButton}
                      </button>
                    </form>

                    <div className="grid grid-cols-2 gap-3">
                      <form action={moveAgendaItemAction}>
                        <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                        <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                        <input name="direction" type="hidden" value="up" />
                        <button className={`${secondaryButtonClassName} w-full`} type="submit">
                          {copy.moveUpButton}
                        </button>
                      </form>
                      <form action={moveAgendaItemAction}>
                        <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                        <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                        <input name="direction" type="hidden" value="down" />
                        <button className={`${secondaryButtonClassName} w-full`} type="submit">
                          {copy.moveDownButton}
                        </button>
                      </form>
                    </div>

                    <form action={setAgendaAction} className="space-y-3">
                      <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                      <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                      <button className={`${secondaryButtonClassName} w-full`} type="submit">
                        {copy.setCurrentPhase}
                      </button>
                    </form>

                    <form action={removeAgendaItemAction}>
                      <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                      <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                      <button className={`${dangerButtonClassName} w-full`} type="submit">
                        {copy.removeAgendaItemButton}
                      </button>
                    </form>
                  </div>
                ) : null}
              </AdminPanel>

              <AdminPanel eyebrow={copy.agendaEditEyebrow} title={copy.addAgendaItemTitle} description={copy.addAgendaItemDescription}>
                <form action={addAgendaItemAction} className="space-y-3">
                  <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                  <input name="title" placeholder={copy.addAgendaItemTitle} className={inputClassName} />
                  <input name="time" placeholder="16:10" className={inputClassName} />
                  <textarea name="description" rows={4} placeholder={copy.teamCheckpointPlaceholder} className={inputClassName} />
                  <select name="afterItemId" defaultValue={selectedAgendaItem?.id ?? ""} className={inputClassName}>
                    {state.agenda.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.time} • {item.title}
                      </option>
                    ))}
                  </select>
                  <button className={primaryButtonClassName} type="submit">
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
                  <input name="name" placeholder={copy.teamNamePlaceholder} defaultValue={selectedTeam?.name ?? ""} className={inputClassName} />
                  <input name="city" placeholder="Studio A" defaultValue={selectedTeam?.city ?? ""} className={inputClassName} />
                  <input name="repoUrl" placeholder="https://github.com/..." defaultValue={selectedTeam?.repoUrl ?? ""} className={inputClassName} />
                  <input name="projectBriefId" placeholder="standup-bot" defaultValue={selectedTeam?.projectBriefId ?? ""} className={inputClassName} />
                  <input
                    name="members"
                    placeholder="Anna, David, Eva"
                    defaultValue={selectedTeam?.members.join(", ") ?? ""}
                    className={inputClassName}
                  />
                  <textarea
                    name="checkpoint"
                    rows={5}
                    placeholder={copy.teamCheckpointPlaceholder}
                    defaultValue={selectedTeam?.checkpoint ?? ""}
                    className={inputClassName}
                  />
                  <button className={primaryButtonClassName} type="submit">
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
                <select name="teamId" className={inputClassName}>
                  {state.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <input name="at" defaultValue="11:15" className={inputClassName} />
                <textarea name="text" rows={4} className={inputClassName} />
                <button className={primaryButtonClassName} type="submit">
                  {copy.addUpdateButton}
                </button>
              </form>
            </AdminPanel>

            <AdminPanel eyebrow={copy.signalEyebrow} title={copy.completeChallengeTitle} description={copy.signalDescription}>
              <form action={completeChallengeAction} className="space-y-3">
                <AdminActionStateFields lang={lang} section={activeSection} instanceId={activeInstanceId} />
                <select name="teamId" className={inputClassName}>
                  {state.teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <select name="challengeId" className={inputClassName}>
                  {state.challenges.map((challenge) => (
                    <option key={challenge.id} value={challenge.id}>
                      {challenge.title}
                    </option>
                  ))}
                </select>
                <button className={primaryButtonClassName} type="submit">
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
                        className={inputClassName}
                      />
                      <select name="role" className={inputClassName}>
                        <option value="operator">operator</option>
                        <option value="owner">owner</option>
                        <option value="observer">observer</option>
                      </select>
                      <button className={primaryButtonClassName} type="submit">
                        {copy.addFacilitatorButton}
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            )}
          </AdminPanel>
        ) : null}

        {activeSection === "account" ? (
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
                    <input id="current-password" name="currentPassword" type="password" required className={`${inputClassName} mt-2`} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="new-password">{copy.newPasswordLabel}</FieldLabel>
                    <input id="new-password" name="newPassword" type="password" required className={`${inputClassName} mt-2`} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="confirm-password">{copy.confirmPasswordLabel}</FieldLabel>
                    <input id="confirm-password" name="confirmPassword" type="password" required className={`${inputClassName} mt-2`} />
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

                  <button className={primaryButtonClassName} type="submit">
                    {copy.changePasswordButton}
                  </button>
                </form>
              )}
            </AdminPanel>
          </div>
        ) : null}
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

function AdminPanel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-soft)] backdrop-blur sm:p-7">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ControlCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5">
      <h3 className="text-lg font-medium text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-[var(--surface)] px-6 py-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-base font-medium text-[var(--text-primary)]">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{hint}</p> : null}
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

  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4">
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

function KeyValueRow({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 ${
        compact ? "space-y-1" : "flex items-start justify-between gap-6"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className={`${compact ? "text-base" : "text-right text-sm"} font-medium text-[var(--text-primary)]`}>{value}</p>
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-[16px] border border-[var(--border-strong)] bg-[var(--input-bg)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--text-primary)]";

const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-5 py-2.5 text-sm font-medium lowercase text-[var(--accent-text)] transition hover:opacity-92";

const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-transparent px-5 py-2.5 text-sm font-medium lowercase text-[var(--text-primary)] transition hover:border-[var(--text-primary)]";

const dangerButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-[var(--danger)] bg-[var(--danger)] px-5 py-2.5 text-sm font-medium lowercase text-white transition hover:opacity-92";

function AdminSectionLink({
  lang,
  section,
  activeSection,
  label,
  instanceId,
}: {
  lang: UiLanguage;
  section: AdminSection;
  activeSection: AdminSection;
  label: string;
  instanceId: string;
}) {
  const href = buildAdminHref({ lang, section, instanceId });
  const active = section === activeSection;

  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-sm font-medium lowercase transition ${
        active
          ? "border-[var(--border-strong)] bg-[var(--surface-soft)] text-[var(--text-primary)]"
          : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </Link>
  );
}

function AdminLanguageSwitcher({
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
      <Link
        className={lang === "cs" ? "text-[var(--text-primary)]" : "transition hover:text-[var(--text-primary)]"}
        href={buildAdminHref({ lang: "cs", section, instanceId })}
      >
        CZ
      </Link>
      <span>/</span>
      <Link
        className={lang === "en" ? "text-[var(--text-primary)]" : "transition hover:text-[var(--text-primary)]"}
        href={buildAdminHref({ lang: "en", section, instanceId })}
      >
        EN
      </Link>
    </>
  );
}
