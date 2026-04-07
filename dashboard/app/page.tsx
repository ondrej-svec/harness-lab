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
import {
  buildParticipantPanelState,
  buildParticipantTeamCards,
  buildPublicAccessPanelState,
  buildPublicFooterLinks,
  buildSharedRoomNotes,
  buildSiteHeaderNavLinks,
  deriveHomePageState,
  getBlueprintRepoUrl,
} from "@/lib/public-page-view-model";
import { getWorkshopState } from "@/lib/workshop-store";
import { publicCopy, resolveUiLanguage, type UiLanguage, withLang } from "@/lib/ui-language";
import { ThemeSwitcher } from "./components/theme-switcher";

export const dynamic = "force-dynamic";

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
  const { currentAgendaItem, nextAgendaItem, participantNotes, rotationRevealed } = deriveHomePageState(state);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_28%),linear-gradient(180deg,var(--surface),var(--surface-elevated))] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-7">
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
            rotationRevealed={rotationRevealed}
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
  const accessPanel = buildPublicAccessPanelState({ configuredEventCode, eventAccessError, copy });
  const footerLinks = buildPublicFooterLinks(lang, copy);
  const blueprintRepoUrl = getBlueprintRepoUrl();
  return (
    <>
      <section
        className="grid gap-10 border-b border-[var(--border)] py-10 lg:min-h-[58vh] lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.86fr)] lg:items-center lg:gap-14"
        id="overview"
      >
        <div className="max-w-3xl">
          <p className="text-sm lowercase text-[var(--text-muted)]">{copy.heroEyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.08em] text-[var(--text-primary)] sm:text-6xl lg:text-7xl">
            {copy.brand.split(" ").map((part, index) => (
              <span key={part}>
                {index > 0 ? <br /> : null}
                {part}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-secondary)] sm:text-xl">
            {copy.heroLead}
          </p>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-muted)]">{copy.heroBody}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <SignalTile title={copy.principleOneTitle} body={copy.principleOneBody} />
            <SignalTile title={copy.principleTwoTitle} body={copy.principleTwoBody} />
            <SignalTile title={copy.principleThreeTitle} body={copy.principleThreeBody} />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm lowercase text-[var(--text-secondary)]">
            <a
              className="rounded-full border border-[var(--border)] px-5 py-3 transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              href={blueprintRepoUrl}
              rel="noreferrer"
              target="_blank"
            >
              {copy.blueprintLink}
            </a>
            <p className="max-w-xl leading-6 text-[var(--text-muted)]">{copy.blueprintHint}</p>
          </div>
        </div>

        <aside id="access" className="rounded-[28px] border border-[var(--accent-surface)] bg-[var(--accent-surface)] p-6 text-[var(--accent-text)] shadow-[var(--shadow-soft)] sm:p-8">
          <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--accent-muted)]">{copy.accessEyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{copy.accessTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--accent-secondary)]">{copy.accessBody}</p>

          <form action={redeemEventCodeAction} className="mt-8 space-y-4">
            <input name="lang" type="hidden" value={lang} />
            <label className="block text-[11px] lowercase tracking-[0.18em] text-[var(--accent-muted)]" htmlFor="event-code">
              {copy.eventCodeLabel}
            </label>
            <input
              className="w-full rounded-[16px] border border-[var(--accent-border)] bg-transparent px-4 py-3 text-base text-[var(--accent-text)] outline-none placeholder:text-[var(--accent-muted)]"
              defaultValue={accessPanel.eventCodeDefaultValue}
              id="event-code"
              name="eventCode"
              placeholder={copy.eventCodePlaceholder}
            />
            <button
              className="w-full rounded-full border border-[var(--accent-text)] bg-[var(--accent-text)] px-4 py-3 text-sm font-medium lowercase text-[var(--accent-surface)] transition hover:bg-transparent hover:text-[var(--accent-text)]"
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

          {accessPanel.showSampleHint ? (
            <p className="mt-6 text-xs leading-6 text-[var(--accent-muted)]">{copy.sampleHint}</p>
          ) : null}

          {accessPanel.errorMessage ? (
            <p className="mt-6 border border-[var(--accent-border)] bg-[var(--accent-text)]/8 px-4 py-3 text-sm leading-6 text-[var(--accent-text)]">
              {accessPanel.errorMessage}
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
        <div className="grid gap-10 lg:grid-cols-2 xl:grid-cols-4 lg:gap-12">
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
          <div>
            <SectionLabel>{copy.detailsBlueprint}</SectionLabel>
            <p className="mt-4 text-base leading-8 text-[var(--text-secondary)]">{copy.detailsBlueprintBody}</p>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-6 py-8 text-sm text-[var(--text-muted)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="lowercase">{copy.brand}</p>
          <p className="mt-2 max-w-md leading-7">{copy.footerBody}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lowercase">
          <a className="transition hover:text-[var(--text-primary)]" href="#overview">
            {copy.footerTop}
          </a>
          <a className="transition hover:text-[var(--text-primary)]" href="#access">
            {copy.footerParticipantAccess}
          </a>
          {footerLinks.map((link) => (
            <a
              key={`${link.href}-${link.label}`}
              className="transition hover:text-[var(--text-primary)]"
              href={link.href}
              rel={link.external ? "noreferrer" : undefined}
              target={link.external ? "_blank" : undefined}
            >
              {link.label}
            </a>
          ))}
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
  const participantPanel = buildParticipantPanelState({
    copy,
    lang,
    currentAgendaItem,
    nextAgendaItem,
    participantSession,
    rotationRevealed,
  });
  const teamCards = buildParticipantTeamCards(participantTeams);
  const sharedNotes = buildSharedRoomNotes(publicNotes);
  return (
    <>
      <section className="grid gap-8 border-b border-[var(--border)] py-10 lg:grid-cols-[1.12fr_0.88fr]" id="room">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-soft)] backdrop-blur sm:p-7">
          <SectionLabel>{copy.participantEyebrow}</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            {participantPanel.title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            {participantPanel.body}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {participantPanel.metrics.map((metric) => (
              <MetricCard key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>

          <div className="mt-6 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{participantPanel.currentPhaseLabel}</p>
            <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{participantPanel.currentPhaseTitle}</p>
            {participantPanel.currentPhaseDescription ? (
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{participantPanel.currentPhaseDescription}</p>
            ) : null}
            {participantPanel.nextPhaseLabel ? (
              <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{participantPanel.nextPhaseLabel}</p>
            ) : null}
          </div>
        </div>

        <aside className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-soft)] backdrop-blur">
          <SectionLabel>{copy.sessionEyebrow}</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{copy.sessionBody}</p>
          <div className="mt-6 space-y-3">
            {sharedNotes.map((note) => (
              <div key={note} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                {note}
              </div>
            ))}
          </div>
          <form action={logoutEventCodeAction} className="mt-6">
            <input name="lang" type="hidden" value={lang} />
            <button
              className="w-full rounded-full border border-[var(--border-strong)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
          {teamCards.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {teamCards.map((team) => (
                <article key={team.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] backdrop-blur">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-[var(--text-primary)]">{team.name}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{team.city}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{team.id}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{team.checkpoint}</p>
                  <p className="mt-4 break-all rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)]">
                    {team.repoUrl}
                  </p>
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
          <div className="mt-4 grid gap-4">
            {sharedNotes.map((note) => (
              <div key={note} className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-4 text-sm leading-6 text-[var(--text-secondary)] shadow-[var(--shadow-soft)] backdrop-blur">
                {note}
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

function SignalTile({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-soft)] backdrop-blur">
      <p className="text-sm font-medium lowercase text-[var(--text-primary)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
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
    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-base font-medium leading-6 text-[var(--text-primary)]">{value}</p>
    </div>
  );
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
