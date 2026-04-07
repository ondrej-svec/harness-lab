import Link from "next/link";
import type { ReactNode } from "react";
import type { UiLanguage } from "@/lib/ui-language";

export function AdminPanel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-5 shadow-[var(--shadow-soft)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(28,25,23,0.1)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_62%)]" />
      <div className="relative">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{eyebrow}</p>
        <h2 className="mt-2.5 text-[1.8rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[var(--text-secondary)] sm:text-sm sm:leading-6">{description}</p>
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

export function ControlCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-strong-top),var(--card-strong-bottom))] p-5 shadow-[0_14px_30px_rgba(28,25,23,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_38px_rgba(28,25,23,0.08)]">
      <h3 className="text-lg font-medium text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)] sm:text-sm sm:leading-6">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-[linear-gradient(180deg,var(--card-strong-top),var(--card-strong-bottom))] px-6 py-5 transition-colors duration-200">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-base font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-lg">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}

export function KeyValueRow({
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
      className={`rounded-[20px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] px-4 py-3 transition duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface)] ${
        compact ? "space-y-1" : "flex items-start justify-between gap-6"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className={`${compact ? "text-[15px] leading-5" : "text-right text-sm"} font-medium text-[var(--text-primary)]`}>{value}</p>
    </div>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "live" | "archived";
}) {
  const className =
    tone === "live"
      ? "border-[var(--accent-surface)] bg-[var(--accent-surface)] text-[var(--accent-text)]"
      : tone === "archived"
        ? "border-[var(--danger-border)] bg-[var(--danger-surface)] text-[var(--danger)]"
        : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-primary)]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium lowercase ${className}`}>{label}</span>
  );
}

export function AdminLanguageSwitcher({
  lang,
  csHref,
  enHref,
}: {
  lang: UiLanguage;
  csHref: string;
  enHref: string;
}) {
  return (
    <>
      <Link className={lang === "cs" ? "text-[var(--text-primary)]" : "transition hover:text-[var(--text-primary)]"} href={csHref}>
        CZ
      </Link>
      <span>/</span>
      <Link className={lang === "en" ? "text-[var(--text-primary)]" : "transition hover:text-[var(--text-primary)]"} href={enHref}>
        EN
      </Link>
    </>
  );
}

export const adminInputClassName =
  "w-full rounded-[16px] border border-[var(--border-strong)] bg-[var(--input-bg)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition duration-200 hover:border-[var(--text-muted)] focus:border-[var(--text-primary)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_rgba(12,10,9,0.05)] focus-visible:border-[var(--text-primary)] dark:focus:shadow-[0_0_0_4px_rgba(247,242,234,0.06)]";

export const adminPrimaryButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-5 py-2.5 text-[13px] font-medium lowercase text-[var(--accent-text)] shadow-[0_12px_24px_rgba(12,10,9,0.12)] transition duration-200 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(12,10,9,0.1),0_12px_24px_rgba(12,10,9,0.12)]";

export const adminSecondaryButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--card-strong-top)] px-5 py-2.5 text-[13px] font-medium lowercase text-[var(--text-primary)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--text-primary)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(12,10,9,0.08)]";

export const adminDangerButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-[var(--danger)] bg-[var(--danger)] px-5 py-2.5 text-[13px] font-medium lowercase text-white shadow-[0_12px_24px_rgba(220,38,38,0.18)] transition duration-200 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(220,38,38,0.12),0_12px_24px_rgba(220,38,38,0.18)]";

export const adminHeroPanelClassName =
  "rounded-[28px] border border-[var(--hero-border)] bg-[linear-gradient(180deg,var(--hero-top),var(--hero-bottom))] text-[var(--hero-text)] shadow-[var(--hero-shadow)]";

export const adminHeroTileClassName =
  "rounded-[22px] border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] transition duration-200 hover:bg-[var(--hero-tile-hover)]";
