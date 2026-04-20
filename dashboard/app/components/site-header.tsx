import Link from "next/link";
import { AdminRouteLink } from "@/app/admin/admin-route-link";
import { buildAgentPrompt, buildSiteHeaderNavLinks } from "@/lib/public-page-view-model";
import { publicCopy, type UiLanguage, withLang } from "@/lib/ui-language";
import { AgentPopover } from "./agent-popover";
import { ThemeSwitcher } from "./theme-switcher";

/**
 * SiteHeader — shared chrome for the public + participant surfaces.
 *
 * NOTE ON LANG LINKS: `csHref` and `enHref` default to the public home
 * page. Participant-surface callers MUST override them to the
 * participant path (`/participant`) so clicking the language switcher
 * doesn't drop a logged-in participant onto the public landing and
 * make them think their session expired.
 */
export function SiteHeader({
  isParticipant,
  lang,
  copy,
  csHref = withLang("/", "cs"),
  enHref = withLang("/", "en"),
}: {
  isParticipant: boolean;
  lang: UiLanguage;
  copy: (typeof publicCopy)[UiLanguage];
  csHref?: string;
  enHref?: string;
}) {
  const navLinks = buildSiteHeaderNavLinks({ isParticipant, lang, copy });

  return (
    <header className="relative overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--surface-panel)] px-5 py-4 shadow-[var(--shadow-soft)] backdrop-blur sm:px-6">
      <div className="pointer-events-none absolute -left-10 top-0 h-24 w-24 rounded-full bg-[radial-gradient(circle,var(--ambient-left),transparent_72%)] blur-2xl dashboard-drift" />
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,var(--accent-surface),transparent_74%)] opacity-[0.08] blur-3xl dashboard-drift-reverse" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link
          className="dashboard-motion-link relative text-sm font-medium lowercase tracking-[0.12em] text-[var(--text-primary)]"
          href={withLang("/", lang)}
          style={{ viewTransitionName: "site-brand" }}
        >
          {copy.brand}
        </Link>

        <div className="relative flex flex-col gap-3 lg:items-end">
          <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-sm lowercase text-[var(--text-secondary)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navLinks.map((link) => {
              const className = "dashboard-motion-link rounded-full px-3 py-1.5 transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]";
              // Anchor and external links do not trigger a route change — a
              // plain <a> is correct. Internal navigation links (e.g. /admin)
              // go through AdminRouteLink so clicks show pending state.
              if (link.external || link.href.startsWith("#")) {
                return (
                  <a
                    key={`${link.href}-${link.label}`}
                    className={className}
                    href={link.href}
                    rel={link.external ? "noreferrer" : undefined}
                    target={link.external ? "_blank" : undefined}
                  >
                    {link.label}
                  </a>
                );
              }
              return (
                <AdminRouteLink key={`${link.href}-${link.label}`} className={className} href={link.href}>
                  {link.label}
                </AdminRouteLink>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            {!isParticipant ? (
              <>
                <AgentPopover
                  label={copy.navAgents}
                  title={copy.agentPopoverTitle}
                  body={copy.agentPopoverBody}
                  prompt={buildAgentPrompt()}
                  copyLabel={copy.agentPopoverCopy}
                  copiedLabel={copy.agentPopoverCopied}
                />
                <span className="text-[var(--text-muted)]">/</span>
              </>
            ) : null}
            <LanguageSwitcher lang={lang} csHref={csHref} enHref={enHref} />
            <span className="text-[var(--text-muted)]">/</span>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}

function LanguageSwitcher({ lang, csHref, enHref }: { lang: UiLanguage; csHref: string; enHref: string }) {
  return (
    <div className="flex items-center gap-2 text-sm lowercase text-[var(--text-secondary)]">
      <Link
        className={lang === "cs" ? "dashboard-motion-link text-[var(--text-primary)]" : "dashboard-motion-link transition hover:text-[var(--text-primary)]"}
        href={csHref}
        prefetch={false}
      >
        cs
      </Link>
      <span>/</span>
      <Link
        className={lang === "en" ? "dashboard-motion-link text-[var(--text-primary)]" : "dashboard-motion-link transition hover:text-[var(--text-primary)]"}
        href={enHref}
        prefetch={false}
      >
        en
      </Link>
    </div>
  );
}
