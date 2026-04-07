import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { requireFacilitatorActionAccess, requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { getFacilitatorSession } from "@/lib/facilitator-session";
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
  AdminPanel,
  FieldLabel,
  StatusPill,
  adminHeroPanelClassName,
  adminHeroTileClassName,
  adminInputClassName,
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
  const accessInstanceId = String(formData.get("accessInstanceId") ?? "").trim();
  await requireFacilitatorActionAccess(accessInstanceId);

  const id = String(formData.get("newInstanceId") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "").trim();
  const eventTitle = String(formData.get("eventTitle") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const dateRange = String(formData.get("dateRange") ?? "").trim();
  const venueName = String(formData.get("venueName") ?? "").trim();
  const roomName = String(formData.get("roomName") ?? "").trim();
  const addressLine = String(formData.get("addressLine") ?? "").trim();
  const locationDetails = String(formData.get("locationDetails") ?? "").trim();
  const facilitatorLabel = String(formData.get("facilitatorLabel") ?? "").trim();

  if (id && templateId) {
    await createWorkshopInstance({
      id,
      templateId,
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

async function removeInstanceAction(formData: FormData) {
  "use server";
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const targetInstanceId = String(formData.get("targetInstanceId") ?? "").trim();
  if (!targetInstanceId) {
    redirect(buildAdminWorkspaceHref({ lang }));
  }

  await requireFacilitatorActionAccess(targetInstanceId);
  await removeWorkshopInstance(targetInstanceId);
  redirect(buildAdminWorkspaceHref({ lang }));
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
  }>;
}) {
  const params = await searchParams;
  const lang = resolveUiLanguage(params?.lang);
  const copy = adminCopy[lang];
  const instanceRepo = getWorkshopInstanceRepository();
  const [availableInstances, defaultInstanceId] = await Promise.all([
    instanceRepo.listInstances(),
    instanceRepo.getDefaultInstanceId(),
  ]);
  const workspaceAccessInstanceId = availableInstances[0]?.id ?? defaultInstanceId;

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

  await requireFacilitatorPageAccess(workspaceAccessInstanceId);

  const filters = readWorkspaceFilters({ q: params?.q, status: params?.status });
  const filteredInstances = filterWorkshopInstances(availableInstances, filters);
  const workspaceStats = buildWorkspaceStatusSummary(availableInstances);
  const [currentFacilitator, authSession, workshopStates] = await Promise.all([
    getRuntimeStorageMode() === "neon" ? getFacilitatorSession(workspaceAccessInstanceId) : Promise.resolve(null),
    getRuntimeStorageMode() === "neon" && auth ? auth.getSession() : Promise.resolve({ data: null }),
    Promise.all(filteredInstances.map(async (instance) => ({ instanceId: instance.id, state: await getWorkshopState(instance.id) }))),
  ]);

  const workshopStateMap = new Map(workshopStates.map((entry) => [entry.instanceId, entry.state]));
  const signedInEmail = authSession?.data?.user?.email ?? null;
  const signedInName = authSession?.data?.user?.name ?? null;

  return (
    <main className="min-h-screen bg-[var(--surface-admin)] bg-[radial-gradient(circle_at_top_left,var(--ambient-right),transparent_34%),radial-gradient(circle_at_top_right,var(--ambient-left),transparent_26%),linear-gradient(180deg,var(--surface-admin),var(--surface-elevated))] px-4 py-6 text-[var(--text-primary)] sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-[94rem] flex-col gap-6">
        <header className="relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_62%)]" />
          <div className="relative grid gap-6 p-6 sm:p-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.88fr)]">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{copy.workspaceEyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
                {copy.workspaceTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{copy.workspaceBody}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a className={adminPrimaryButtonClassName} href="#create-instance">
                  {copy.createInstanceTitle}
                </a>
                <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm text-[var(--text-secondary)]">
                  {`${workspaceStats.prepared} ${copy.workspaceStatsPrepared} • ${workspaceStats.running} ${copy.workspaceStatsRunning}`}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:items-stretch">
              <div className="flex items-center gap-3 self-start text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] xl:self-end">
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
                  <button type="submit" className="text-xs lowercase text-[var(--text-muted)] transition hover:text-[var(--text-primary)]">
                    {copy.signOutButton}
                  </button>
                </form>
              </div>

              <section className={`${adminHeroPanelClassName} p-5`}>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--hero-muted)]">{copy.workspaceSummaryTitle}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <WorkspacePulseStat label={copy.workspaceStatsAll} value={`${workspaceStats.all}`} />
                  <WorkspacePulseStat label={copy.workspaceStatsPrepared} value={`${workspaceStats.prepared}`} />
                  <WorkspacePulseStat label={copy.workspaceStatsRunning} value={`${workspaceStats.running}`} />
                  <WorkspacePulseStat label={copy.workspaceStatsArchived} value={`${workspaceStats.archived}`} />
                </div>

                <div className="mt-4 space-y-2 border-t border-[var(--hero-border)] pt-4 text-xs leading-5 text-[var(--hero-secondary)]">
                  {signedInEmail ? (
                    <p>{`${copy.signedInAs}: ${signedInName ?? signedInEmail}${currentFacilitator?.grant.role ? ` • ${currentFacilitator.grant.role}` : ""}`}</p>
                  ) : null}
                  <p>{copy.pageBody}</p>
                </div>
              </section>
            </div>
          </div>
        </header>

        <AdminPanel eyebrow={copy.workspaceSummaryTitle} title={copy.pageTitle} description={copy.pageBody}>
          <div className="space-y-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
              <form
                className="grid gap-3 rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-4 lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-end"
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
                  <button className={adminPrimaryButtonClassName} type="submit">
                    {copy.workspaceSearchButton}
                  </button>
                  <Link className={adminSecondaryButtonClassName} href={buildAdminWorkspaceHref({ lang })}>
                    {copy.workspaceResetFilters}
                  </Link>
                </div>
              </form>

              <details className="group rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-4 xl:w-[23rem]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{copy.createInstanceTitle}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy.workspaceCreateDescription}</p>
                  </div>
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xl leading-none text-[var(--text-secondary)] transition group-open:rotate-45">
                    +
                  </span>
                </summary>

                <div id="create-instance" className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
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
                    <input name="accessInstanceId" type="hidden" value={workspaceAccessInstanceId} />

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <div>
                        <FieldLabel htmlFor="template-id">{copy.instanceSelectLabel}</FieldLabel>
                        <select id="template-id" name="templateId" className={`${adminInputClassName} mt-2`} defaultValue={workshopTemplates[0]?.id}>
                          {workshopTemplates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <FieldLabel htmlFor="event-title">{copy.createInstanceEventTitleLabel}</FieldLabel>
                        <input id="event-title" name="eventTitle" placeholder={copy.createInstanceEventTitlePlaceholder} className={`${adminInputClassName} mt-2`} />
                      </div>
                    </div>

                    <div>
                      <FieldLabel htmlFor="instance-id">{copy.instanceIdLabel}</FieldLabel>
                      <input id="instance-id" name="newInstanceId" placeholder={copy.newInstanceIdPlaceholder} className={`${adminInputClassName} mt-2`} />
                    </div>

                    <div>
                      <FieldLabel htmlFor="instance-date">{copy.workspaceWhenLabel}</FieldLabel>
                      <input id="instance-date" name="dateRange" placeholder={copy.instanceDateRangePlaceholder} className={`${adminInputClassName} mt-2`} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="instance-venue">{copy.workspaceWhereLabel}</FieldLabel>
                        <input id="instance-venue" name="venueName" placeholder={copy.instanceVenuePlaceholder} className={`${adminInputClassName} mt-2`} />
                      </div>
                      <div>
                        <FieldLabel htmlFor="instance-room">{copy.instanceRoomLabel}</FieldLabel>
                        <input id="instance-room" name="roomName" placeholder={copy.instanceRoomPlaceholder} className={`${adminInputClassName} mt-2`} />
                      </div>
                    </div>

                    <div>
                      <FieldLabel htmlFor="instance-address">{copy.workspaceWhereLabel}</FieldLabel>
                      <input id="instance-address" name="addressLine" placeholder={copy.instanceAddressPlaceholder} className={`${adminInputClassName} mt-2`} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <input name="city" placeholder={copy.instanceCityPlaceholder} className={adminInputClassName} />
                      <input name="facilitatorLabel" placeholder={copy.instanceOwnerPlaceholder} className={adminInputClassName} />
                    </div>

                    <textarea
                      name="locationDetails"
                      rows={3}
                      placeholder={copy.instanceLocationDetailsPlaceholder}
                      className={adminInputClassName}
                    />

                    <button className={`${adminPrimaryButtonClassName} w-full`} type="submit">
                      {copy.createInstanceButton}
                    </button>
                  </form>
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
                        className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-strong-top),var(--card-strong-bottom))] p-4 shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-[0_24px_40px_rgba(28,25,23,0.1)]"
                      >
                        <div className="absolute inset-x-0 top-0 h-14 bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_62%)]" />
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill label={buildWorkspaceStatusLabel(copy, instance.status)} tone={resolveStatusTone(instance.status)} />
                            </div>
                            <h3 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                              {getWorkshopDisplayTitle(instance)}
                            </h3>
                            <div className="mt-2 space-y-1 text-[13px] leading-5 text-[var(--text-secondary)]">
                              <p>{instance.workshopMeta.dateRange}</p>
                              <p>{locationLines[0] ?? instance.workshopMeta.city}</p>
                              {locationLines[1] ? <p className="text-[13px] text-[var(--text-muted)]">{locationLines[1]}</p> : null}
                            </div>
                            <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{instance.id}</p>
                          </div>
                          <Link className={`${adminSecondaryButtonClassName} shrink-0 px-3 py-2 text-xs`} href={controlRoomHref}>
                            {copy.workspaceOpenInstance}
                          </Link>
                        </div>

                        <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.workspaceNextStepLabel}</p>
                          <p className="mt-1.5 text-[13px] leading-5 text-[var(--text-primary)]">{resolveWorkspaceNextStep(copy, instance.status)}</p>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <WorkspaceMetaRow label={copy.workspaceOwnerLabel} value={instance.workshopMeta.facilitatorLabel ?? "n/a"} />
                          <WorkspaceMetaRow label={copy.workspaceSignalLabel} value={participantSignal} />
                          <WorkspaceMetaRow
                            label={copy.workspacePhaseLabel}
                            value={state?.workshopMeta.currentPhaseLabel ?? instance.workshopMeta.currentPhaseLabel}
                          />
                          <WorkspaceMetaRow label={copy.workspaceTeamsLabel} value={`${state?.teams.length ?? 0}`} />
                        </div>

                        <div className="mt-auto pt-4">
                          <form
                            action={removeInstanceAction}
                            className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3"
                          >
                            <input name="lang" type="hidden" value={lang} />
                            <input name="targetInstanceId" type="hidden" value={instance.id} />
                            <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">archive-safe</span>
                            <button className="inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-medium lowercase text-[var(--danger)] transition hover:bg-[var(--danger-surface)]" type="submit">
                              {copy.removeInstanceButton}
                            </button>
                          </form>
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
        </AdminPanel>
      </div>
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
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1.5 text-sm font-medium leading-5 text-[var(--text-primary)]">{value}</p>
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
