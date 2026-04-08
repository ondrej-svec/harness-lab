import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { auth } from "@/lib/auth/server";
import { requireFacilitatorActionAccess, requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import {
  buildAdminInstanceHref,
  buildAdminWorkspaceHref,
  buildLegacyAdminRedirectHref,
  buildWorkspaceStatusLabel,
  buildWorkspaceStatusSummary,
  filterWorkshopInstances,
  getWorkshopDisplayTitle,
  getWorkshopLocationLines,
  readWorkspaceFilters,
} from "@/lib/admin-page-view-model";
import { adminCopy, resolveUiLanguage, withLang } from "@/lib/ui-language";
import { ThemeSwitcher } from "../components/theme-switcher";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";
import { workshopTemplates } from "@/lib/workshop-data";
import { getWorkshopInstanceRepository } from "@/lib/workshop-instance-repository";
import { createWorkshopInstance, getWorkshopState, removeWorkshopInstance } from "@/lib/workshop-store";
import {
  AdminLanguageSwitcher,
  AdminDialog,
  FieldLabel,
  StatusPill,
  adminHeroPanelClassName,
  adminHeroTileClassName,
  adminDangerButtonClassName,
  adminInputClassName,
  adminPanelSurfaceClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "./admin-ui";

export const dynamic = "force-dynamic";

async function signOutAction(formData: FormData) {
  "use server";
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  if (auth) {
    await auth.signOut();
  }
  redirect(withLang("/admin/sign-in", lang));
}

async function createInstanceAction(formData: FormData) {
  "use server";
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  await requireFacilitatorActionAccess(null);

  const id = String(formData.get("newInstanceId") ?? "").trim();
  const templateId = workshopTemplates[0]?.id ?? "";
  const eventTitle = String(formData.get("eventTitle") ?? "").trim();
  const contentLang = formData.get("contentLang") === "en" ? "en" : "cs";
  const city = String(formData.get("city") ?? "").trim();
  const dateRange = formatWorkshopDateLabel(String(formData.get("dateRange") ?? ""), lang);
  const venueName = String(formData.get("venueName") ?? "").trim();
  const roomName = String(formData.get("roomName") ?? "").trim();
  const addressLine = String(formData.get("addressLine") ?? "").trim();
  const locationDetails = String(formData.get("locationDetails") ?? "").trim();
  const facilitatorLabel = String(formData.get("facilitatorLabel") ?? "").trim();

  if (id && templateId) {
    await createWorkshopInstance({
      id,
      templateId,
      contentLang,
      eventTitle,
      city,
      dateRange,
      venueName,
      roomName,
      addressLine,
      locationDetails,
      facilitatorLabel,
    });

    redirect(buildAdminInstanceHref({ lang, instanceId: id }));
  }

  redirect(buildAdminWorkspaceHref({ lang }));
}

function getContentLanguageLabel(
  contentLang: "cs" | "en" | undefined,
  copy: (typeof adminCopy)["cs" | "en"],
) {
  return contentLang === "en" ? copy.contentLanguageEnglish : copy.contentLanguageCzech;
}

async function removeInstanceAction(formData: FormData) {
  "use server";
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const query = String(formData.get("q") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const targetInstanceId = String(formData.get("targetInstanceId") ?? "").trim();
  const confirmRemoveInstanceId = String(formData.get("confirmRemoveInstanceId") ?? "").trim();
  if (!targetInstanceId) {
    redirect(buildAdminWorkspaceHref({ lang }));
  }
  if (confirmRemoveInstanceId !== targetInstanceId) {
    redirect(
      buildAdminWorkspaceHref({
        lang,
        query,
        status: status === "created" || status === "prepared" || status === "running" || status === "archived" ? status : "all",
        removeInstanceId: targetInstanceId,
      }),
    );
  }

  await requireFacilitatorActionAccess(targetInstanceId);
  await removeWorkshopInstance(targetInstanceId);
  redirect(
    buildAdminWorkspaceHref({
      lang,
      query,
      status: status === "created" || status === "prepared" || status === "running" || status === "archived" ? status : "all",
    }),
  );
}

function resolveStatusTone(status: string): "neutral" | "live" | "archived" {
  if (status === "running") {
    return "live";
  }
  if (status === "archived" || status === "removed") {
    return "archived";
  }
  return "neutral";
}

function resolveWorkspaceNextStep(copy: (typeof adminCopy)["cs" | "en"], status: string) {
  if (status === "running") {
    return copy.workspaceNextStepRunning;
  }
  if (status === "archived") {
    return copy.workspaceNextStepArchived;
  }
  if (status === "prepared") {
    return copy.workspaceNextStepPrepared;
  }
  return copy.workspaceNextStepCreated;
}

function formatWorkshopDateLabel(value: string, lang: "cs" | "en") {
  const normalized = value.trim();
  if (!normalized.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return normalized;
  }

  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  return new Intl.DateTimeFormat(lang === "cs" ? "cs-CZ" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function AdminWorkspacePage({
  searchParams,
}: {
  searchParams?: Promise<{
    lang?: string;
    q?: string;
    status?: string;
    instance?: string;
    section?: string;
    team?: string;
    agendaItem?: string;
    error?: string;
    password?: string;
    removeInstance?: string;
  }>;
}) {
  const params = await searchParams;
  const lang = resolveUiLanguage(params?.lang);
  const copy = adminCopy[lang];
  const instanceRepo = getWorkshopInstanceRepository();
  const availableInstances = await instanceRepo.listInstances();

  if (params?.instance) {
    redirect(
      buildLegacyAdminRedirectHref({
        lang,
        instanceId: params.instance,
        section: params.section,
        teamId: params.team ?? null,
        agendaItemId: params.agendaItem ?? null,
        error: params.error ?? null,
        password: params.password ?? null,
      }),
    );
  }

  await requireFacilitatorPageAccess(null);

  const filters = readWorkspaceFilters({ q: params?.q, status: params?.status });
  const removeInstanceId = params?.removeInstance?.trim() || null;
  const filteredInstances = filterWorkshopInstances(availableInstances, filters);
  const removeTargetInstance = removeInstanceId
    ? availableInstances.find((instance) => instance.id === removeInstanceId) ?? null
    : null;
  const workspaceStats = buildWorkspaceStatusSummary(availableInstances);
  const [loadedAuthSession, loadedWorkshopStates] = await Promise.all([
    getRuntimeStorageMode() === "neon" && auth ? auth.getSession() : Promise.resolve({ data: null }),
    Promise.all(filteredInstances.map(async (instance) => ({ instanceId: instance.id, state: await getWorkshopState(instance.id) }))),
  ]);
  const authSession: Awaited<ReturnType<NonNullable<typeof auth>["getSession"]>> | { data: null } = loadedAuthSession;
  const workshopStates: Array<{ instanceId: string; state: Awaited<ReturnType<typeof getWorkshopState>> }> = loadedWorkshopStates;

  const workshopStateMap = new Map(workshopStates.map((entry) => [entry.instanceId, entry.state]));
  const signedInEmail = authSession?.data?.user?.email ?? null;
  const signedInName = authSession?.data?.user?.name ?? null;

  return (
    <main className="min-h-screen bg-[var(--surface-admin)] bg-[radial-gradient(circle_at_top_left,var(--ambient-right),transparent_34%),radial-gradient(circle_at_top_right,var(--ambient-left),transparent_26%),linear-gradient(180deg,var(--surface-admin),var(--surface-elevated))] px-4 py-6 text-[var(--text-primary)] sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-[94rem] flex-col gap-6">
        <header className="relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_62%)]" />
          <div className="relative space-y-6 p-6 sm:p-7">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
              <div className="max-w-3xl">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{copy.workspaceEyebrow}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
                  {copy.workspaceTitle}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{copy.workspaceBody}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a className={`${adminPrimaryButtonClassName} w-full sm:w-auto`} href="#create-instance">
                    {copy.createInstanceTitle}
                  </a>
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm text-[var(--text-secondary)]">
                    {`${workspaceStats.prepared} ${copy.workspaceStatsPrepared} • ${workspaceStats.running} ${copy.workspaceStatsRunning}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] xl:justify-self-end">
                <AdminLanguageSwitcher
                  lang={lang}
                  csHref={buildAdminWorkspaceHref({ lang: "cs", query: filters.query, status: filters.status })}
                  enHref={buildAdminWorkspaceHref({ lang: "en", query: filters.query, status: filters.status })}
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

            <section className={`${adminHeroPanelClassName} p-5`}>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--hero-muted)]">{copy.workspaceSummaryTitle}</p>
                {signedInEmail ? (
                  <p className="text-xs leading-5 text-[var(--hero-secondary)]">{`${copy.signedInAs}: ${signedInName ?? signedInEmail}`}</p>
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <WorkspacePulseStat label={copy.workspaceStatsAll} value={`${workspaceStats.all}`} />
                <WorkspacePulseStat label={copy.workspaceStatsPrepared} value={`${workspaceStats.prepared}`} />
                <WorkspacePulseStat label={copy.workspaceStatsRunning} value={`${workspaceStats.running}`} />
                <WorkspacePulseStat label={copy.workspaceStatsArchived} value={`${workspaceStats.archived}`} />
              </div>
              <p className="mt-4 border-t border-[var(--hero-border)] pt-4 text-xs leading-5 text-[var(--hero-secondary)]">{copy.pageBody}</p>
            </section>
          </div>
        </header>

        <section className={`${adminPanelSurfaceClassName} p-5 sm:p-6`}>
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
              <form
                className="grid min-w-0 gap-3 rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-4 lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-end"
                method="get"
              >
                <div>
                  <FieldLabel htmlFor="workspace-query">{copy.workspaceSearchLabel}</FieldLabel>
                  <input
                    id="workspace-query"
                    name="q"
                    defaultValue={filters.query}
                    placeholder={copy.workspaceSearchPlaceholder}
                    className={`${adminInputClassName} mt-2`}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="workspace-status">{copy.workspaceStatusFilterLabel}</FieldLabel>
                  <select id="workspace-status" name="status" defaultValue={filters.status} className={`${adminInputClassName} mt-2`}>
                    <option value="all">{copy.workspaceStatsAll}</option>
                    <option value="created">{copy.instanceStatusCreated}</option>
                    <option value="prepared">{copy.instanceStatusPrepared}</option>
                    <option value="running">{copy.instanceStatusRunning}</option>
                    <option value="archived">{copy.instanceStatusArchived}</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <AdminSubmitButton className={adminPrimaryButtonClassName}>
                    {copy.workspaceSearchButton}
                  </AdminSubmitButton>
                  <Link className={adminSecondaryButtonClassName} href={buildAdminWorkspaceHref({ lang })}>
                    {copy.workspaceResetFilters}
                  </Link>
                </div>
              </form>

              <details className="group rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-4 transition-all duration-200 open:shadow-[var(--shadow-soft)] xl:col-start-2 xl:w-[23rem] xl:open:col-span-2 xl:open:col-start-1 xl:open:row-start-2 xl:open:w-auto">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{copy.createInstanceTitle}</p>
                    <p className="mt-1 text-sm font-medium leading-5 text-[var(--text-primary)]">{copy.workspaceCreateDescription}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{`${copy.createInstanceEventTitleLabel} • ${copy.instanceDateLabel} • ${copy.instanceVenueLabel}`}</p>
                  </div>
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xl leading-none text-[var(--text-secondary)] transition group-open:rotate-45">
                    +
                  </span>
                </summary>

                <div id="create-instance" className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
                  <div className="grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)] xl:items-start">
                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{copy.workspaceCreateStepsTitle}</p>
                      <div className="mt-3 space-y-2">
                        <CreateStep index="01" body={copy.workspaceCreateStepOne} />
                        <CreateStep index="02" body={copy.workspaceCreateStepTwo} />
                        <CreateStep index="03" body={copy.workspaceCreateStepThree} />
                      </div>
                    </div>

                    <form action={createInstanceAction} className="space-y-3">
                      <input name="lang" type="hidden" value={lang} />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)] sm:col-span-2">
                          {copy.instanceBlueprintSummary}
                        </div>

                        <div className="sm:col-span-2">
                          <FieldLabel htmlFor="event-title">{copy.createInstanceEventTitleLabel}</FieldLabel>
                          <input id="event-title" name="eventTitle" placeholder={copy.createInstanceEventTitlePlaceholder} className={`${adminInputClassName} mt-2`} />
                        </div>
                      </div>

                      <div>
                        <FieldLabel htmlFor="instance-id">{copy.instanceIdLabel}</FieldLabel>
                        <input id="instance-id" name="newInstanceId" placeholder={copy.newInstanceIdPlaceholder} className={`${adminInputClassName} mt-2`} />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <div>
                          <FieldLabel htmlFor="instance-date">{copy.instanceDateLabel}</FieldLabel>
                          <input id="instance-date" name="dateRange" type="date" className={`${adminInputClassName} mt-2`} />
                        </div>

                        <div>
                          <FieldLabel htmlFor="content-lang">{copy.contentLanguageLabel}</FieldLabel>
                          <select id="content-lang" name="contentLang" defaultValue="cs" className={`${adminInputClassName} mt-2`}>
                            <option value="cs">{copy.contentLanguageCzech}</option>
                            <option value="en">{copy.contentLanguageEnglish}</option>
                          </select>
                        </div>

                        <div>
                          <FieldLabel htmlFor="instance-address">{copy.instanceAddressLabel}</FieldLabel>
                          <input id="instance-address" name="addressLine" placeholder={copy.instanceAddressPlaceholder} className={`${adminInputClassName} mt-2`} />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <FieldLabel htmlFor="instance-venue">{copy.instanceVenueLabel}</FieldLabel>
                          <input id="instance-venue" name="venueName" placeholder={copy.instanceVenuePlaceholder} className={`${adminInputClassName} mt-2`} />
                        </div>
                        <div>
                          <FieldLabel htmlFor="instance-room">{copy.instanceRoomLabel}</FieldLabel>
                          <input id="instance-room" name="roomName" placeholder={copy.instanceRoomPlaceholder} className={`${adminInputClassName} mt-2`} />
                        </div>
                        <div>
                          <FieldLabel htmlFor="instance-city">{copy.instanceAreaLabel}</FieldLabel>
                          <input id="instance-city" name="city" placeholder={copy.instanceCityPlaceholder} className={`${adminInputClassName} mt-2`} />
                        </div>
                        <div>
                          <FieldLabel htmlFor="instance-owner">{copy.workspaceOwnerLabel}</FieldLabel>
                          <input id="instance-owner" name="facilitatorLabel" placeholder={copy.instanceOwnerPlaceholder} className={`${adminInputClassName} mt-2`} />
                        </div>
                      </div>

                      <textarea
                        name="locationDetails"
                        rows={3}
                        placeholder={copy.instanceLocationDetailsPlaceholder}
                        className={adminInputClassName}
                      />

                      <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full sm:w-auto`}>
                        {copy.createInstanceButton}
                      </AdminSubmitButton>
                    </form>
                  </div>
                </div>
              </details>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredInstances.length > 0 ? (
                filteredInstances.map((instance) => {
                    const state = workshopStateMap.get(instance.id);
                    const locationLines = getWorkshopLocationLines(instance);
                    const controlRoomHref = buildAdminInstanceHref({ lang, instanceId: instance.id });
                    const participantSignal = state?.rotation.revealed ? copy.workspaceSignalRevealed : copy.workspaceSignalHidden;
                    return (
                      <article
                        key={instance.id}
                        className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-strong-top),var(--card-strong-bottom))] p-3.5 shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[0_24px_40px_rgba(28,25,23,0.1)]"
                      >
                        <div className="absolute inset-x-0 top-0 h-14 bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_62%)]" />
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill label={buildWorkspaceStatusLabel(copy, instance.status)} tone={resolveStatusTone(instance.status)} />
                            </div>
                            <h3 className="mt-2.5 text-[1.28rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                              {getWorkshopDisplayTitle(instance)}
                            </h3>
                            <div className="mt-1.5 space-y-1 text-[13px] leading-5 text-[var(--text-secondary)]">
                              <p>{instance.workshopMeta.dateRange}</p>
                              <p>{locationLines[0] ?? instance.workshopMeta.city}</p>
                              {locationLines[1] ? <p className="text-[13px] text-[var(--text-muted)]">{locationLines[1]}</p> : null}
                            </div>
                            <p className="mt-2.5 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{instance.id}</p>
                          </div>
                          <Link className={`${adminSecondaryButtonClassName} shrink-0 px-3 py-2 text-xs`} href={controlRoomHref}>
                            {copy.workspaceOpenInstance}
                          </Link>
                        </div>

                        <div className="mt-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.workspaceNextStepLabel}</p>
                          <p className="mt-1 text-[13px] leading-5 text-[var(--text-primary)]">{resolveWorkspaceNextStep(copy, instance.status)}</p>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <WorkspaceMetaRow label={copy.workspaceOwnerLabel} value={instance.workshopMeta.facilitatorLabel ?? "n/a"} />
                          <WorkspaceMetaRow label={copy.workspaceSignalLabel} value={participantSignal} />
                          <WorkspaceMetaRow
                            label={copy.workspacePhaseLabel}
                            value={state?.workshopMeta.currentPhaseLabel ?? instance.workshopMeta.currentPhaseLabel}
                          />
                          <WorkspaceMetaRow
                            label={copy.contentLanguageLabel}
                            value={getContentLanguageLabel(instance.workshopMeta.contentLang, copy)}
                          />
                          <WorkspaceMetaRow label={copy.workspaceTeamsLabel} value={`${state?.teams.length ?? 0}`} />
                        </div>

                        <div className="mt-auto pt-4">
                          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
                            <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">archive-safe</span>
                            <Link
                              className="inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-medium lowercase text-[var(--danger)] transition hover:bg-[var(--danger-surface)]"
                              href={buildAdminWorkspaceHref({
                                lang,
                                query: filters.query,
                                status: filters.status,
                                removeInstanceId: instance.id,
                              })}
                            >
                              {copy.removeInstanceReviewButton}
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] p-6 lg:col-span-2">
                  <h3 className="text-lg font-medium text-[var(--text-primary)]">{copy.workspaceEmptyTitle}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{copy.workspaceEmptyBody}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link className={adminSecondaryButtonClassName} href={buildAdminWorkspaceHref({ lang })}>
                      {copy.workspaceResetFilters}
                    </Link>
                    <a className={adminPrimaryButtonClassName} href="#create-instance">
                      {copy.createInstanceTitle}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      {removeTargetInstance ? (
        <AdminDialog
          eyebrow={copy.removeInstanceDialogEyebrow}
          title={copy.removeInstanceDialogTitle}
          description={copy.removeInstanceDialogDescription}
          closeHref={buildAdminWorkspaceHref({ lang, query: filters.query, status: filters.status })}
          closeLabel={copy.cancelButton}
        >
          <div className="space-y-4">
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.activeInstance}</p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{getWorkshopDisplayTitle(removeTargetInstance)}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{removeTargetInstance.id}</p>
            </div>
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <p className="text-sm leading-6 text-[var(--text-primary)]">{copy.removeInstanceArchiveNote}</p>
            </div>
            <div className="rounded-[20px] border border-[var(--danger-border)] bg-[var(--danger-surface)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--danger)]">{copy.removeInstanceConsequenceLabel}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{copy.removeInstanceConsequenceBody}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                className={`${adminSecondaryButtonClassName} w-full sm:w-auto`}
                href={buildAdminWorkspaceHref({ lang, query: filters.query, status: filters.status })}
              >
                {copy.cancelButton}
              </Link>
              <form action={removeInstanceAction} className="w-full sm:w-auto">
                <input name="lang" type="hidden" value={lang} />
                <input name="q" type="hidden" value={filters.query} />
                <input name="status" type="hidden" value={filters.status} />
                <input name="targetInstanceId" type="hidden" value={removeTargetInstance.id} />
                <input name="confirmRemoveInstanceId" type="hidden" value={removeTargetInstance.id} />
                <AdminSubmitButton className={`${adminDangerButtonClassName} w-full sm:w-auto`}>
                  {copy.confirmRemoveInstanceButton}
                </AdminSubmitButton>
              </form>
            </div>
          </div>
        </AdminDialog>
      ) : null}
    </main>
  );
}

function WorkspacePulseStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${adminHeroTileClassName} px-4 py-4`}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--hero-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--hero-text)]">{value}</p>
    </div>
  );
}

function WorkspaceMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium leading-5 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function CreateStep({ index, body }: { index: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[11px] font-semibold tracking-[0.12em] text-[var(--text-muted)]">
        {index}
      </span>
      <p className="pt-1 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
    </div>
  );
}
