import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getConfiguredEventCode,
  getParticipantSessionFromCookieStore,
  getParticipantTeamLookup,
  participantSessionCookieName,
  redeemEventCode,
  revokeParticipantSession,
} from "@/lib/event-access";
import { getWorkshopState } from "@/lib/workshop-store";
import { publicCopy, resolveUiLanguage, type UiLanguage, withLang } from "@/lib/ui-language";
import { ThemeSwitcher } from "./components/theme-switcher";

export const dynamic = "force-dynamic";
const publicRepoUrl = "https://github.com/ondrej-svec/harness-lab";

async function redeemEventCodeAction(formData: FormData) {
  "use server";
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));

  const result = await redeemEventCode(String(formData.get("eventCode") ?? ""));

  if (!result.ok) {
    redirect(withLang(`/?eventAccess=${result.reason}`, lang));
  }

  const cookieStore = await cookies();
  cookieStore.set(participantSessionCookieName, result.session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(result.session.expiresAt),
  });

  redirect(withLang("/", lang));
}

async function logoutEventCodeAction(formData: FormData) {
  "use server";
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));

  const cookieStore = await cookies();
  const token = cookieStore.get(participantSessionCookieName)?.value;
  await revokeParticipantSession(token);
  cookieStore.set(participantSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  redirect(withLang("/", lang));
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ eventAccess?: string; lang?: string }>;
}) {
  const state = await getWorkshopState();
  const params = await searchParams;
  const lang = resolveUiLanguage(params?.lang);
  const copy = publicCopy[lang];
  const participantSession = await getParticipantSessionFromCookieStore();
  const participantTeams = participantSession ? await getParticipantTeamLookup() : null;
  const configuredEventCode = await getConfiguredEventCode();
  const { agenda, rotation, ticker } = state;
  const currentAgendaItem = agenda.find((item) => item.status === "current") ?? agenda[0];
  const nextAgendaItem = agenda.find((item) => item.status === "upcoming");
  const participantNotes = ticker.slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 sm:py-8">
        <SiteHeader isParticipant={!!participantSession} lang={lang} copy={copy} />

        {participantSession ? (
          <ParticipantView
            copy={copy}
            lang={lang}
            currentAgendaItem={currentAgendaItem}
            nextAgendaItem={nextAgendaItem}
            participantSession={participantSession}
            participantTeams={participantTeams}
            publicNotes={participantNotes}
            rotationRevealed={rotation.revealed}
          />
        ) : (
          <PublicView configuredEventCode={configuredEventCode} eventAccessError={params?.eventAccess} copy={copy} lang={lang} />
        )}
      </div>
    </main>
  );
}

function SiteHeader({
  isParticipant,
  lang,
  copy,
}: {
  isParticipant: boolean;
  lang: UiLanguage;
  copy: (typeof publicCopy)[UiLanguage];
}) {
  return (
    <header className="border-b border-[var(--border)] pb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link className="text-sm font-medium lowercase tracking-[0.12em] text-[var(--text-primary)]" href={withLang("/", lang)}>
          {copy.brand}
        </Link>

        <div className="flex flex-col gap-3 lg:items-end">
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm lowercase text-[var(--text-secondary)]">
          {isParticipant ? (
            <>
              <a className="transition hover:text-[var(--text-primary)]" href="#room">
                {copy.navRoom}
              </a>
              <a className="transition hover:text-[var(--text-primary)]" href="#teams">
                {copy.navTeams}
              </a>
              <a className="transition hover:text-[var(--text-primary)]" href="#notes">
                {copy.navNotes}
              </a>
            </>
          ) : (
            <>
              <a className="transition hover:text-[var(--text-primary)]" href="#overview">
                {copy.navOverview}
              </a>
              <a className="transition hover:text-[var(--text-primary)]" href="#principles">
                {copy.navPrinciples}
              </a>
              <a className="transition hover:text-[var(--text-primary)]" href="#details">
                {copy.navDetails}
              </a>
              <a className="transition hover:text-[var(--text-primary)]" href="#access">
                {copy.navParticipantAccess}
              </a>
              <a
                aria-label={copy.navRepo}
                className="transition hover:text-[var(--text-primary)]"
                href={publicRepoUrl}
                rel="noreferrer"
                target="_blank"
              >
                <GitHubIcon className="h-4 w-4" />
              </a>
            </>
          )}
          <a className="transition hover:text-[var(--text-primary)]" href={withLang("/admin", lang)}>
            {copy.navFacilitatorLogin}
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher lang={lang} />
          <span className="text-[var(--text-muted)]">/</span>
          <ThemeSwitcher />
        </div>
        </div>
      </div>
    </header>
  );
}

function PublicView({
  configuredEventCode,
  eventAccessError,
  copy,
  lang,
}: {
  configuredEventCode: Awaited<ReturnType<typeof getConfiguredEventCode>>;
  eventAccessError?: string;
  copy: (typeof publicCopy)[UiLanguage];
  lang: UiLanguage;
}) {
  return (
    <>
      <section
        className="grid gap-12 border-b border-[var(--border)] py-12 lg:min-h-[72vh] lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.8fr)] lg:items-end lg:gap-16"
        id="overview"
      >
        <div className="max-w-3xl">
          <p className="text-sm lowercase text-[var(--text-muted)]">{copy.heroEyebrow}</p>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.06em] text-[var(--text-primary)] sm:text-6xl lg:text-8xl">
            {copy.brand.split(" ").map((part, index) => (
              <span key={part}>
                {index > 0 ? <br /> : null}
                {part}
              </span>
            ))}
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--text-secondary)] sm:text-xl">
            {copy.heroLead}
          </p>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-muted)]">{copy.heroBody}</p>
        </div>

        <aside id="access" className="border border-[var(--accent-surface)] bg-[var(--accent-surface)] p-6 text-[var(--accent-text)] sm:p-8">
          <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--accent-muted)]">{copy.accessEyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{copy.accessTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--accent-secondary)]">{copy.accessBody}</p>

          <form action={redeemEventCodeAction} className="mt-8 space-y-4">
            <input name="lang" type="hidden" value={lang} />
            <label className="block text-[11px] lowercase tracking-[0.18em] text-[var(--accent-muted)]" htmlFor="event-code">
              {copy.eventCodeLabel}
            </label>
            <input
              className="w-full border border-[var(--accent-border)] bg-transparent px-4 py-3 text-base text-[var(--accent-text)] outline-none placeholder:text-[var(--accent-muted)]"
              defaultValue={configuredEventCode?.isSample ? configuredEventCode.sampleCode : ""}
              id="event-code"
              name="eventCode"
              placeholder={copy.eventCodePlaceholder}
            />
            <button
              className="w-full border border-[var(--accent-text)] bg-[var(--accent-text)] px-4 py-3 text-sm font-medium lowercase text-[var(--accent-surface)] transition hover:bg-transparent hover:text-[var(--accent-text)]"
              type="submit"
            >
              {copy.eventCodeSubmit}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm lowercase">
            <a className="text-[var(--accent-secondary)] transition hover:text-[var(--accent-text)]" href={withLang("/admin", lang)}>
              {copy.facilitatorLogin}
            </a>
            <span className="text-[var(--accent-muted)]">/</span>
            <a className="text-[var(--accent-secondary)] transition hover:text-[var(--accent-text)]" href="#details">
              {copy.publicDetails}
            </a>
          </div>

          {configuredEventCode?.isSample ? (
            <p className="mt-6 text-xs leading-6 text-[var(--accent-muted)]">{copy.sampleHint}</p>
          ) : null}

          {eventAccessError ? (
            <p className="mt-6 border border-[var(--accent-border)] bg-[var(--accent-text)]/8 px-4 py-3 text-sm leading-6 text-[var(--accent-text)]">
              {formatEventAccessError(eventAccessError, copy)}
            </p>
          ) : null}
        </aside>
      </section>

      <section className="border-b border-[var(--border)] py-12" id="principles">
        <div className="grid gap-10 lg:grid-cols-[0.48fr_1fr] lg:gap-16">
          <div>
            <SectionLabel>{copy.principlesEyebrow}</SectionLabel>
            <h2 className="mt-4 max-w-sm text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
              {copy.principlesTitle}
            </h2>
          </div>
          <div className="space-y-6">
            <SimpleRule title={copy.principleOneTitle} body={copy.principleOneBody} />
            <SimpleRule title={copy.principleTwoTitle} body={copy.principleTwoBody} />
            <SimpleRule title={copy.principleThreeTitle} body={copy.principleThreeBody} />
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] py-12" id="details">
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div>
            <SectionLabel>{copy.detailsWhat}</SectionLabel>
            <p className="mt-4 text-base leading-8 text-[var(--text-secondary)]">{copy.detailsWhatBody}</p>
          </div>
          <div>
            <SectionLabel>{copy.detailsParticipants}</SectionLabel>
            <p className="mt-4 text-base leading-8 text-[var(--text-secondary)]">{copy.detailsParticipantsBody}</p>
          </div>
          <div>
            <SectionLabel>{copy.detailsBoundary}</SectionLabel>
            <p className="mt-4 text-base leading-8 text-[var(--text-secondary)]">{copy.detailsBoundaryBody}</p>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-6 py-8 text-sm text-[var(--text-muted)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="lowercase">{copy.brand}</p>
          <p className="mt-2 max-w-md leading-7">{copy.footerBody}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lowercase">
          <a className="transition hover:text-[var(--text-primary)]" href="#overview">
            {copy.footerTop}
          </a>
          <a className="transition hover:text-[var(--text-primary)]" href="#access">
            {copy.footerParticipantAccess}
          </a>
          <a
            aria-label={copy.navRepo}
            className="transition hover:text-[var(--text-primary)]"
            href={publicRepoUrl}
            rel="noreferrer"
            target="_blank"
          >
            <GitHubIcon className="h-4 w-4" />
          </a>
          <a className="transition hover:text-[var(--text-primary)]" href={withLang("/admin", lang)}>
            {copy.facilitatorLogin}
          </a>
        </div>
      </footer>
    </>
  );
}

function ParticipantView({
  copy,
  lang,
  currentAgendaItem,
  nextAgendaItem,
  participantSession,
  participantTeams,
  publicNotes,
  rotationRevealed,
}: {
  copy: (typeof publicCopy)[UiLanguage];
  lang: UiLanguage;
  currentAgendaItem: Awaited<ReturnType<typeof getWorkshopState>>["agenda"][number] | undefined;
  nextAgendaItem: Awaited<ReturnType<typeof getWorkshopState>>["agenda"][number] | undefined;
  participantSession: NonNullable<Awaited<ReturnType<typeof getParticipantSessionFromCookieStore>>>;
  participantTeams: Awaited<ReturnType<typeof getParticipantTeamLookup>> | null;
  publicNotes: Awaited<ReturnType<typeof getWorkshopState>>["ticker"];
  rotationRevealed: boolean;
}) {
  return (
    <>
      <section className="grid gap-8 border-b border-[var(--border)] py-10 lg:grid-cols-[1.2fr_0.8fr]" id="room">
        <div>
          <SectionLabel>{copy.participantEyebrow}</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            {currentAgendaItem?.title ?? copy.participantTitleFallback}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            {rotationRevealed
              ? copy.participantBodyRevealed
              : copy.participantBodyHidden}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <MetricCard label={copy.metricCurrentPhase} value={currentAgendaItem?.title ?? copy.participantTitleFallback} />
            <MetricCard label={copy.metricNext} value={nextAgendaItem?.title ?? copy.metricReflection} />
            <MetricCard label={copy.metricSessionUntil} value={formatDateTime(participantSession.expiresAt, lang)} />
          </div>
        </div>

        <aside className="border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <SectionLabel>{copy.sessionEyebrow}</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{copy.sessionBody}</p>
          <form action={logoutEventCodeAction} className="mt-6">
            <input name="lang" type="hidden" value={lang} />
            <button
              className="border border-[var(--border-strong)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
              type="submit"
            >
              {copy.leaveRoomContext}
            </button>
          </form>
        </aside>
      </section>

      <section className="grid gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div id="teams">
          <SectionLabel>{copy.roomData}</SectionLabel>
          {participantTeams ? (
            <div className="mt-4 space-y-4">
              {participantTeams.items.map((team) => (
                <article key={team.id} className="border-b border-[var(--border)] pb-5 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-[var(--text-primary)]">{team.name}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{team.city}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{team.id}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{team.checkpoint}</p>
                  <p className="mt-4 break-all text-sm text-[var(--text-muted)]">{team.repoUrl}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
              {copy.noRoomData}
            </p>
          )}
        </div>

        <div id="notes">
          <SectionLabel>{copy.sharedRoomNotes}</SectionLabel>
          <div className="mt-4 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {publicNotes.map((item) => (
              <div key={item.id} className="py-4 text-sm leading-6 text-[var(--text-secondary)]">
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--text-muted)]">{children}</p>;
}

function SimpleRule({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="grid gap-3 border-t border-[var(--border)] pt-5 sm:grid-cols-[220px_1fr] sm:gap-8">
      <p className="text-sm font-medium lowercase text-[var(--text-primary)]">{title}</p>
      <p className="text-sm leading-7 text-[var(--text-secondary)]">{body}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-base font-medium leading-6 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function formatDateTime(value: string, lang: UiLanguage) {
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatEventAccessError(value: string, copy: (typeof publicCopy)[UiLanguage]) {
  switch (value) {
    case "invalid_code":
      return copy.invalidCode;
    case "expired_code":
      return copy.expiredCode;
    default:
      return copy.unknownCodeError;
  }
}

function LanguageSwitcher({ lang }: { lang: UiLanguage }) {
  return (
    <div className="flex items-center gap-2 text-xs lowercase text-[var(--text-muted)]">
      <Link className={lang === "cs" ? "text-[var(--text-primary)]" : "transition hover:text-[var(--text-primary)]"} href={withLang("/", "cs")}>
        cz
      </Link>
      <span>/</span>
      <Link className={lang === "en" ? "text-[var(--text-primary)]" : "transition hover:text-[var(--text-primary)]"} href={withLang("/", "en")}>
        en
      </Link>
    </div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 .5C5.65.5.5 5.66.5 12.03c0 5.1 3.3 9.43 7.87 10.96.58.11.79-.25.79-.56 0-.28-.01-1.03-.02-2.01-3.2.7-3.88-1.55-3.88-1.55-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.69 1.26 3.35.97.1-.75.4-1.26.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.19 1.18a11.1 11.1 0 0 1 5.81 0c2.21-1.49 3.18-1.18 3.18-1.18.64 1.58.24 2.75.12 3.04.74.8 1.19 1.83 1.19 3.09 0 4.41-2.68 5.39-5.24 5.67.41.36.78 1.08.78 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.21.68.8.56A11.54 11.54 0 0 0 23.5 12.03C23.5 5.66 18.35.5 12 .5Z" />
    </svg>
  );
}
