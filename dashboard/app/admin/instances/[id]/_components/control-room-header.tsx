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

type Copy = (typeof adminCopy)[UiLanguage];

function ControlRoomHeaderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{value}</p>
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

type InstanceBadge = {
  statusLabel: string;
  statusTone: "live" | "archived" | "neutral";
  displayTitle: string;
};

export function ControlRoomHeader({
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
}) {
  return (
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
              {instanceBadge ? (
                <StatusPill label={instanceBadge.statusLabel} tone={instanceBadge.statusTone} />
              ) : null}
              <p className="text-sm text-[var(--text-muted)]">{workshopId}</p>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
              {instanceBadge?.displayTitle ?? copy.pageTitle}
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
                instanceId,
                teamId: selectedTeamId,
                agendaItemId: showAgendaDetail ? selectedAgendaItemId : null,
                sceneId: showAgendaDetail ? selectedSceneId : null,
                overlay: visibleSection === "run" ? activeOverlay : null,
              })}
              enHref={buildAdminHref({
                lang: "en",
                section: visibleSection,
                instanceId,
                teamId: selectedTeamId,
                agendaItemId: showAgendaDetail ? selectedAgendaItemId : null,
                sceneId: showAgendaDetail ? selectedSceneId : null,
                overlay: visibleSection === "run" ? activeOverlay : null,
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
          <AdminSectionLink lang={lang} section="run" activeSection={visibleSection} label={copy.navAgenda} instanceId={instanceId} />
          <AdminSectionLink lang={lang} section="people" activeSection={visibleSection} label={copy.navPeople} instanceId={instanceId} />
          <AdminSectionLink lang={lang} section="access" activeSection={visibleSection} label={copy.navAccess} instanceId={instanceId} />
          <AdminSectionLink lang={lang} section="settings" activeSection={visibleSection} label={copy.navSettings} instanceId={instanceId} />
        </nav>
      </div>
    </header>
  );
}
