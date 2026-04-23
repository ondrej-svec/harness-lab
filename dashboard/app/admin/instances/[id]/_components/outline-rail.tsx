import { AdminRouteLink } from "@/app/admin/admin-route-link";
import { buildAdminHref } from "@/lib/admin-page-view-model";
import type { AdminSection } from "@/lib/admin-page-view-model";
import type { UiLanguage, adminCopy } from "@/lib/ui-language";

// Focused-canvas outline rail. Replaces the old 5-section sticky sidebar
// with a tree that nests agenda items under the Agenda section when it's
// active. Anchored via `viewTransitionName: outline-rail` so it doesn't
// drift during the admin→presenter morph.
//
// Server component — composes the existing client-side AdminRouteLink.

export type OutlineAgendaItem = {
  id: string;
  label: string;
  time: string | null;
  status: "done" | "current" | "upcoming";
};

type OutlineRailProps = {
  lang: UiLanguage;
  instanceId: string;
  activeSection: AdminSection;
  activeAgendaItemId: string | null;
  workshopLabel: string;
  agendaItems: readonly OutlineAgendaItem[];
  copy: (typeof adminCopy)[UiLanguage];
};

const SECTIONS: readonly { key: AdminSection; copyKey: keyof (typeof adminCopy)["cs"] }[] = [
  { key: "run", copyKey: "navAgenda" },
  { key: "people", copyKey: "navPeople" },
  { key: "summary", copyKey: "navSummary" },
  { key: "settings", copyKey: "navSettings" },
];

export function OutlineRail({
  lang,
  instanceId,
  activeSection,
  activeAgendaItemId,
  workshopLabel,
  agendaItems,
  copy,
}: OutlineRailProps) {
  return (
    <aside
      className="hidden xl:block print:hidden"
      style={{ viewTransitionName: "outline-rail" }}
      aria-label="workshop outline"
    >
      <div className="sticky top-6 rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-4 shadow-[0_14px_30px_rgba(28,25,23,0.05)]">
        <p className="px-2 text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
          {copy.activeInstance}
        </p>
        <p className="mt-2 px-2 text-sm leading-6 text-[var(--text-secondary)]">{workshopLabel}</p>

        <nav className="mt-4 flex flex-col gap-1.5">
          {SECTIONS.map(({ key, copyKey }) => {
            const label = copy[copyKey] as string;
            const href = buildAdminHref({ lang, section: key, instanceId });
            const active = key === activeSection;
            return (
              <div key={key}>
                <AdminRouteLink
                  href={href}
                  raw
                  className={`flex items-center rounded-[14px] border px-3 py-2 text-left text-sm font-medium lowercase transition ${
                    active
                      ? "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[0_8px_18px_rgba(28,25,23,0.06)]"
                      : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {label}
                </AdminRouteLink>
                {key === "run" && active && agendaItems.length > 0 ? (
                  <ul className="relative mt-1.5 ml-3 space-y-0.5 border-l border-[var(--border)] pl-4">
                    {agendaItems.map((item) => {
                      const itemHref = buildAdminHref({
                        lang,
                        section: "run",
                        instanceId,
                        agendaItemId: item.id,
                      });
                      const itemActive = item.id === activeAgendaItemId;
                      const statusDotClass =
                        item.status === "current"
                          ? "bg-[var(--text-primary)] border-[var(--text-primary)]"
                          : item.status === "done"
                            ? "bg-[var(--text-muted)] border-[var(--text-muted)]"
                            : "bg-[var(--surface)] border-[var(--border-strong)]";
                      return (
                        <li key={item.id} className="relative">
                          {/* Rail indicator: sits on the parent ul's left
                              border so the dot lives on the vertical line
                              rather than inline before the time text. */}
                          <span
                            aria-hidden
                            className={`absolute left-[-21px] top-2 h-1.5 w-1.5 rounded-full border ${statusDotClass}`}
                          />
                          <AdminRouteLink
                            href={itemHref}
                            raw
                            scroll={false}
                            data-agenda-item={item.id}
                            className={`block rounded-[10px] px-2 py-1.5 text-xs leading-5 transition ${
                              itemActive
                                ? "bg-[var(--surface-soft)] text-[var(--text-primary)]"
                                : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                            }`}
                          >
                            {item.time ? (
                              <span className="text-[var(--text-muted)]">{item.time} · </span>
                            ) : null}
                            {item.label}
                          </AdminRouteLink>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
