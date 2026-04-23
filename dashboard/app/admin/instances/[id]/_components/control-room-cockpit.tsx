import { AdminRouteLink } from "@/app/admin/admin-route-link";
import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import {
  buildAdminHref,
  buildAdminWorkspaceHref,
  type AdminSection,
  type ControlRoomOverlay,
} from "@/lib/admin-page-view-model";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import { AdminLanguageSwitcher, StatusPill } from "../../../admin-ui";
import { ThemeSwitcher } from "../../../../components/theme-switcher";
import { signOutAction } from "../_actions/operations";

// Dense one-panel facilitator cockpit. Replaces the older two-card stack
// (hero header + persistent summary band) that pushed working content
// below the fold on iPad landscape. Layout is designed for 768–1536px —
// stacks at sm, one-row toolbar at lg+. The outline rail still takes
// over section navigation at xl+, so tabs hide there.

type Copy = (typeof adminCopy)[UiLanguage];

type InstanceBadge = {
  statusLabel: string;
  statusTone: "live" | "archived" | "neutral";
  displayTitle: string;
};

type SummaryRow = {
  label: string;
  value: string;
  hint?: string;
};

type SessionState = {
  signedInLine: string | null;
  archiveLine: string | null;
};

function CockpitSectionTab({
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
  const active = section === activeSection;
  return (
    <AdminRouteLink
      href={buildAdminHref({ lang, section, instanceId })}
      className={`inline-flex items-center justify-center rounded-full border px-3.5 py-1.5 text-[13px] font-medium lowercase transition duration-200 hover:-translate-y-0.5 ${
        active
          ? "border-[var(--border-strong)] bg-[var(--surface-soft)] text-[var(--text-primary)] shadow-[0_8px_18px_rgba(28,25,23,0.06)]"
          : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </AdminRouteLink>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-w-0 items-baseline gap-2">
      <span className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
        {label}
      </span>
      <span className="min-w-0 truncate text-[13px] leading-5 text-[var(--text-primary)]">
        {value}
      </span>
    </span>
  );
}

function ContextCell({ label, value, hint }: SummaryRow) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <div className="mt-1 flex min-w-0 items-baseline gap-2">
        <p className="min-w-0 truncate text-sm font-semibold leading-5 text-[var(--text-primary)]">
          {value}
        </p>
        {hint ? (
          <p className="min-w-0 truncate text-[11px] leading-5 text-[var(--text-muted)]">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export function ControlRoomCockpit({
  lang,
  copy,
  instanceId,
  visibleSection,
  activeOverlay,
  instanceBadge,
  workshopId,
  selectedAgendaItemId,
  selectedSceneId,
  selectedTeamId,
  showAgendaDetail,
  instanceWhenLabel,
  instanceWhereLabel,
  instanceOwnerLabel,
  summaryRows,
  sessionState,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  visibleSection: AdminSection;
  activeOverlay: ControlRoomOverlay | null;
  instanceBadge: InstanceBadge | null;
  workshopId: string;
  selectedAgendaItemId: string | null;
  selectedSceneId: string | null;
  selectedTeamId: string | null;
  showAgendaDetail: boolean;
  instanceWhenLabel: string;
  instanceWhereLabel: string;
  instanceOwnerLabel: string;
  summaryRows: readonly SummaryRow[];
  sessionState: SessionState;
}) {
  const langHref = (targetLang: UiLanguage) =>
    buildAdminHref({
      lang: targetLang,
      section: visibleSection,
      instanceId,
      teamId: selectedTeamId,
      agendaItemId: showAgendaDetail ? selectedAgendaItemId : null,
      sceneId: showAgendaDetail ? selectedSceneId : null,
      overlay: visibleSection === "run" ? activeOverlay : null,
    });

  return (
    <header className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)] backdrop-blur">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_58%)]"
      />

      {/* Row 1 — primary toolbar */}
      <div className="relative flex flex-col gap-3 px-4 py-3.5 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:gap-5 lg:py-4 lg:pl-6 lg:pr-5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
          <AdminRouteLink
            href={buildAdminWorkspaceHref({ lang })}
            className="inline-flex shrink-0 items-center gap-1.5 text-[13px] lowercase text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            <span aria-hidden className="text-base leading-none">‹</span>
            <span>{copy.controlRoomBack}</span>
          </AdminRouteLink>

          <span
            aria-hidden
            className="hidden h-5 w-px shrink-0 bg-[var(--border)] lg:inline-block"
          />
          <p className="hidden shrink-0 text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)] lg:inline">
            {copy.deskEyebrow}
          </p>

          {instanceBadge ? (
            <StatusPill label={instanceBadge.statusLabel} tone={instanceBadge.statusTone} />
          ) : null}

          <h1 className="min-w-0 truncate text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-2xl lg:text-[26px] xl:text-[28px]">
            {instanceBadge?.displayTitle ?? copy.pageTitle}
          </h1>

          <span className="shrink truncate text-xs leading-5 text-[var(--text-muted)]">
            {workshopId}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] lg:self-auto">
          <AdminLanguageSwitcher lang={lang} csHref={langHref("cs")} enHref={langHref("en")} />
          <span aria-hidden>/</span>
          <ThemeSwitcher />
          <span aria-hidden>/</span>
          <form action={signOutAction}>
            <input name="lang" type="hidden" value={lang} />
            <AdminSubmitButton className="text-[11px] lowercase tracking-[0.18em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]">
              {copy.signOutButton}
            </AdminSubmitButton>
          </form>
        </div>
      </div>

      {/* Row 2 — meta + section tabs (tabs hidden on xl where OutlineRail owns nav) */}
      <div className="relative flex flex-col gap-3 border-t border-[var(--border)] px-4 py-3 sm:px-5 md:flex-row md:items-center md:justify-between md:gap-6 lg:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5">
          <MetaItem label={copy.workspaceWhenLabel} value={instanceWhenLabel} />
          <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-[var(--border-strong)]" />
          <MetaItem label={copy.workspaceWhereLabel} value={instanceWhereLabel} />
          <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-[var(--border-strong)]" />
          <MetaItem label={copy.workspaceOwnerLabel} value={instanceOwnerLabel} />
        </div>

        <nav className="flex flex-wrap gap-1.5 xl:hidden" aria-label="workshop sections">
          <CockpitSectionTab
            lang={lang}
            section="run"
            activeSection={visibleSection}
            label={copy.navAgenda}
            instanceId={instanceId}
          />
          <CockpitSectionTab
            lang={lang}
            section="people"
            activeSection={visibleSection}
            label={copy.navPeople}
            instanceId={instanceId}
          />
          <CockpitSectionTab
            lang={lang}
            section="summary"
            activeSection={visibleSection}
            label={copy.navSummary}
            instanceId={instanceId}
          />
          <CockpitSectionTab
            lang={lang}
            section="settings"
            activeSection={visibleSection}
            label={copy.navSettings}
            instanceId={instanceId}
          />
        </nav>
      </div>

      {/* Row 3 — context strip (3 KPI cards after the 2026-04-23 cleanup) */}
      <div className="relative border-t border-[var(--border)] bg-[var(--surface-soft)]">
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-3 sm:px-5 sm:py-3.5 lg:px-6">
          {summaryRows.map((row) => (
            <ContextCell key={row.label} label={row.label} value={row.value} hint={row.hint} />
          ))}
        </div>
      </div>
    </header>
  );
}
