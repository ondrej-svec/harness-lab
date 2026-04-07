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
  adminDangerButtonClassName,
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
    <main className="min-h-screen bg-[var(--surface-admin)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.58),transparent_34%),radial-gradient(circle_at_top_right,rgba(0,0,0,0.04),transparent_26%),linear-gradient(180deg,var(--surface-admin),var(--surface-elevated))] px-4 py-6 text-[var(--text-primary)] sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-[94rem] flex-col gap-6">
        <header className="relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.06),transparent_62%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.09),transparent_62%)]" />
          <div className="relative grid gap-6 p-6 sm:p-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.88fr)]">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{copy.workspaceEyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
                {copy.workspaceTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{copy.workspaceBody}</p>
              <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[rgba(255,255,255,0.58)] p-4 text-sm leading-6 text-[var(--text-secondary)] dark:bg-[rgba(28,25,23,0.58)]">
                <p>{copy.sectionHint}</p>
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

              <section className="rounded-[30px] border border-[var(--accent-border)] bg-[linear-gradient(180deg,rgba(12,10,9,0.96),rgba(28,25,23,0.9))] p-5 text-[var(--accent-text)] shadow-[0_20px_44px_rgba(12,10,9,0.18)]">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-muted)]">{copy.workspaceSummaryTitle}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <WorkspacePulseStat label={copy.workspaceStatsAll} value={`${workspaceStats.all}`} />
                  <WorkspacePulseStat label={copy.workspaceStatsPrepared} value={`${workspaceStats.prepared}`} />
                  <WorkspacePulseStat label={copy.workspaceStatsRunning} value={`${workspaceStats.running}`} />
                  <WorkspacePulseStat label={copy.workspaceStatsArchived} value={`${workspaceStats.archived}`} />
                </div>

                <div className="mt-5 space-y-2 border-t border-[var(--accent-border)] pt-4 text-xs leading-5 text-[var(--accent-secondary)]">
                  {signedInEmail ? (
                    <p>{`${copy.signedInAs}: ${signedInName ?? signedInEmail}${currentFacilitator?.grant.role ? ` • ${currentFacilitator.grant.role}` : ""}`}</p>
                  ) : null}
                  <p>{copy.pageBody}</p>
                </div>
              </section>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(22rem,0.88fr)]">
          <div className="space-y-6">
            <AdminPanel eyebrow={copy.workspaceSummaryTitle} title={copy.pageTitle} description={copy.pageBody}>
              <form
                className="grid gap-3 rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0.58))] p-4 lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-end dark:bg-[linear-gradient(180deg,rgba(41,37,36,0.84),rgba(41,37,36,0.68))]"
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

              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                {filteredInstances.length > 0 ? (
                  filteredInstances.map((instance) => {
                    const state = workshopStateMap.get(instance.id);
                    const locationLines = getWorkshopLocationLines(instance);
                    const controlRoomHref = buildAdminInstanceHref({ lang, instanceId: instance.id });
                    return (
                      <article
                        key={instance.id}
                        className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.82))] p-4 shadow-[var(--shadow-soft)] dark:bg-[linear-gradient(180deg,rgba(28,25,23,0.96),rgba(28,25,23,0.82))] sm:p-5"
                      >
                        <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.05),transparent_62%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_62%)]" />
                        <div className="relative flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill label={buildWorkspaceStatusLabel(copy, instance.status)} tone={resolveStatusTone(instance.status)} />
                            </div>
                            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                              {getWorkshopDisplayTitle(instance)}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{instance.workshopMeta.dateRange}</p>
                            <p className="text-sm leading-6 text-[var(--text-secondary)]">{locationLines[0] ?? instance.workshopMeta.city}</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{instance.id}</p>
                          </div>
                          <Link className={adminSecondaryButtonClassName} href={controlRoomHref}>
                            {copy.workspaceOpenInstance}
                          </Link>
                        </div>

                        <div className="mt-5 rounded-[24px] border border-[var(--border)] bg-[rgba(255,255,255,0.62)] p-4 dark:bg-[rgba(28,25,23,0.62)]">
                          <WorkspaceMetaRow label={copy.workspaceWhereLabel} value={locationLines.join(" / ") || instance.workshopMeta.city} />
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <WorkspaceMetricTile
                              label={copy.workspaceOwnerLabel}
                              value={instance.workshopMeta.facilitatorLabel ?? "n/a"}
                            />
                            <WorkspaceMetricTile label={copy.workspaceWhereLabel} value={locationLines.join(" / ") || instance.workshopMeta.city} />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <WorkspaceMetricTile
                            label={copy.workspacePhaseLabel}
                            value={state?.workshopMeta.currentPhaseLabel ?? instance.workshopMeta.currentPhaseLabel}
                            prominent
                          />
                          <WorkspaceMetricTile label={copy.workspaceTeamsLabel} value={`${state?.teams.length ?? 0}`} prominent />
                        </div>

                        <div className="mt-auto pt-5">
                          <form
                            action={removeInstanceAction}
                            className="flex items-end justify-between gap-4 rounded-[22px] border border-[var(--border)] bg-[rgba(255,255,255,0.56)] p-4 dark:bg-[rgba(28,25,23,0.56)]"
                          >
                            <input name="lang" type="hidden" value={lang} />
                            <input name="targetInstanceId" type="hidden" value={instance.id} />
                            <span className="max-w-[15rem] text-xs leading-5 text-[var(--text-muted)]">{copy.removeInstanceHint}</span>
                            <button className={adminDangerButtonClassName} type="submit">
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
                  </div>
                )}
              </div>
            </AdminPanel>
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <AdminPanel eyebrow={copy.createInstanceTitle} title={copy.createInstanceTitle} description={copy.workspaceCreateDescription}>
              <div className="rounded-[26px] border border-[var(--accent-border)] bg-[linear-gradient(180deg,rgba(12,10,9,0.96),rgba(28,25,23,0.9))] p-5 text-[var(--accent-text)] shadow-[0_18px_36px_rgba(12,10,9,0.16)]">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent-muted)]">{copy.createInstanceTitle}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--accent-secondary)]">{copy.workspaceCreateDescription}</p>
              </div>

              <form action={createInstanceAction} className="mt-5 space-y-4">
                <input name="lang" type="hidden" value={lang} />
                <input name="accessInstanceId" type="hidden" value={workspaceAccessInstanceId} />

                <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(255,255,255,0.58)] p-4 dark:bg-[rgba(28,25,23,0.58)]">
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

                  <div className="mt-4">
                    <FieldLabel htmlFor="event-title">{copy.createInstanceEventTitleLabel}</FieldLabel>
                    <input id="event-title" name="eventTitle" placeholder={copy.createInstanceEventTitlePlaceholder} className={`${adminInputClassName} mt-2`} />
                  </div>

                  <div className="mt-4">
                    <FieldLabel htmlFor="instance-id">{copy.instanceIdLabel}</FieldLabel>
                    <input id="instance-id" name="newInstanceId" placeholder={copy.newInstanceIdPlaceholder} className={`${adminInputClassName} mt-2`} />
                  </div>
                </div>

                <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(255,255,255,0.58)] p-4 dark:bg-[rgba(28,25,23,0.58)]">
                  <div>
                    <FieldLabel htmlFor="instance-date">{copy.workspaceWhenLabel}</FieldLabel>
                    <input id="instance-date" name="dateRange" placeholder={copy.instanceDateRangePlaceholder} className={`${adminInputClassName} mt-2`} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="instance-venue">{copy.workspaceWhereLabel}</FieldLabel>
                      <input id="instance-venue" name="venueName" placeholder={copy.instanceVenuePlaceholder} className={`${adminInputClassName} mt-2`} />
                    </div>
                    <div>
                      <FieldLabel htmlFor="instance-room">{copy.instanceRoomLabel}</FieldLabel>
                      <input id="instance-room" name="roomName" placeholder={copy.instanceRoomPlaceholder} className={`${adminInputClassName} mt-2`} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <FieldLabel htmlFor="instance-address">{copy.workspaceWhereLabel}</FieldLabel>
                    <input id="instance-address" name="addressLine" placeholder={copy.instanceAddressPlaceholder} className={`${adminInputClassName} mt-2`} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input name="city" placeholder={copy.instanceCityPlaceholder} className={adminInputClassName} />
                    <input name="facilitatorLabel" placeholder={copy.instanceOwnerPlaceholder} className={adminInputClassName} />
                  </div>

                  <textarea
                    name="locationDetails"
                    rows={3}
                    placeholder={copy.instanceLocationDetailsPlaceholder}
                    className={`${adminInputClassName} mt-4`}
                  />
                </div>

                <button className={`${adminPrimaryButtonClassName} w-full`} type="submit">
                  {copy.createInstanceButton}
                </button>
              </form>
            </AdminPanel>
          </div>
        </div>
      </div>
    </main>
  );
}

function WorkspacePulseStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--accent-border)] bg-[rgba(255,255,255,0.08)] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--accent-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--accent-text)]">{value}</p>
    </div>
  );
}

function WorkspaceMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.42)] px-4 py-4 dark:bg-[rgba(41,37,36,0.42)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function WorkspaceMetricTile({
  label,
  value,
  prominent = false,
}: {
  label: string;
  value: string;
  prominent?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[rgba(255,255,255,0.56)] px-4 py-4 dark:bg-[rgba(28,25,23,0.56)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className={`mt-2 ${prominent ? "text-xl tracking-[-0.04em]" : "text-sm"} font-semibold text-[var(--text-primary)]`}>
        {value}
      </p>
    </div>
  );
}
