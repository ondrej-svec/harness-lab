import Link from "next/link";
import { buildSiteHeaderNavLinks } from "@/lib/public-page-view-model";
import { publicCopy, type UiLanguage, withLang } from "@/lib/ui-language";
import { ThemeSwitcher } from "./theme-switcher";

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
    <header className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] px-5 py-4 shadow-[var(--shadow-soft)] backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link className="text-sm font-medium lowercase tracking-[0.12em] text-[var(--text-primary)]" href={withLang("/", lang)}>
          {copy.brand}
        </Link>

        <div className="flex flex-col gap-3 lg:items-end">
          <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-sm lowercase text-[var(--text-secondary)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navLinks.map((link) => (
              <a
                key={`${link.href}-${link.label}`}
                className="rounded-full px-3 py-1.5 transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                href={link.href}
                rel={link.external ? "noreferrer" : undefined}
                target={link.external ? "_blank" : undefined}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
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
        className={lang === "cs" ? "text-[var(--text-primary)]" : "transition hover:text-[var(--text-primary)]"}
        href={csHref}
        prefetch={false}
      >
        cs
      </Link>
      <span>/</span>
      <Link
        className={lang === "en" ? "text-[var(--text-primary)]" : "transition hover:text-[var(--text-primary)]"}
        href={enHref}
        prefetch={false}
      >
        en
      </Link>
    </div>
  );
}
