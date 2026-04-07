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
    <section className="relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.72))] p-6 shadow-[var(--shadow-soft)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(28,25,23,0.12)] sm:p-7 dark:bg-[linear-gradient(180deg,rgba(28,25,23,0.92),rgba(28,25,23,0.76))] dark:hover:shadow-[0_24px_50px_rgba(0,0,0,0.34)]">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.05),transparent_62%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_62%)]" />
      <div className="relative">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{title}</h2>
        <p className="mt-3 max-w-2xl text-[13px] leading-5 text-[var(--text-secondary)] sm:text-sm sm:leading-6">{description}</p>
        <div className="mt-5">{children}</div>
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
    <section className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.82))] p-5 shadow-[0_14px_30px_rgba(28,25,23,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_38px_rgba(28,25,23,0.1)] dark:bg-[linear-gradient(180deg,rgba(28,25,23,0.96),rgba(28,25,23,0.84))] dark:hover:shadow-[0_20px_38px_rgba(0,0,0,0.28)]">
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
    <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.8))] px-6 py-5 transition-colors duration-200 dark:bg-[linear-gradient(180deg,rgba(12,10,9,0.98),rgba(28,25,23,0.9))]">
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
      className={`rounded-[20px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.72))] px-4 py-3 transition duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface)] dark:bg-[linear-gradient(180deg,rgba(41,37,36,0.92),rgba(41,37,36,0.76))] dark:hover:bg-[rgba(41,37,36,0.96)] ${
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
  "w-full rounded-[18px] border border-[var(--border-strong)] bg-[var(--input-bg)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition duration-200 hover:border-[var(--text-muted)] focus:border-[var(--text-primary)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_rgba(12,10,9,0.04)] focus-visible:border-[var(--text-primary)]";

export const adminPrimaryButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-5 py-2.5 text-[13px] font-medium lowercase text-[var(--accent-text)] shadow-[0_12px_24px_rgba(12,10,9,0.14)] transition duration-200 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(12,10,9,0.12),0_12px_24px_rgba(12,10,9,0.14)]";

export const adminSecondaryButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[rgba(255,255,255,0.62)] px-5 py-2.5 text-[13px] font-medium lowercase text-[var(--text-primary)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--text-primary)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(12,10,9,0.08)] dark:bg-[rgba(28,25,23,0.72)]";

export const adminDangerButtonClassName =
  "inline-flex items-center justify-center rounded-full border border-[var(--danger)] bg-[var(--danger)] px-5 py-2.5 text-[13px] font-medium lowercase text-white shadow-[0_12px_24px_rgba(220,38,38,0.18)] transition duration-200 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgba(220,38,38,0.12),0_12px_24px_rgba(220,38,38,0.18)]";
