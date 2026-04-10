import { cookies } from "next/headers";
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
  buildPublicAccessPanelState,
  buildPublicFooterLinks,
  buildWorkshopContextLine,
  deriveHomePageState,
  getBlueprintRepoUrl,
} from "@/lib/public-page-view-model";
import { getWorkshopState } from "@/lib/workshop-store";
import { publicCopy, resolveUiLanguage, type UiLanguage, withLang } from "@/lib/ui-language";
import { ParticipantRoomSurface } from "./components/participant-room-surface";
import { SiteHeader } from "./components/site-header";
import { ParticipantLiveRefresh } from "./components/participant-live-refresh";
import { SubmitButton } from "./components/submit-button";

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
  const params = await searchParams;
  const lang = resolveUiLanguage(params?.lang);
  const copy = publicCopy[lang];
  const participantSession = await getParticipantSessionFromCookieStore();
  const state = await getWorkshopState(participantSession?.instanceId);
  const participantTeams = participantSession ? await getParticipantTeamLookup(participantSession.instanceId) : null;
  const configuredEventCode = await getConfiguredEventCode();
  const { currentAgendaItem, nextAgendaItem, participantNotes, rotationRevealed, workshopMeta } = deriveHomePageState(state);
  const workshopContextLine = participantSession ? buildWorkshopContextLine(workshopMeta) : "";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--ambient-left),transparent_28%),linear-gradient(180deg,var(--surface),var(--surface-elevated))] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-7">
        <SiteHeader isParticipant={!!participantSession} lang={lang} copy={copy} />

        {participantSession ? (
          <>
          <ParticipantLiveRefresh currentAgendaItemId={currentAgendaItem?.id} />
          <ParticipantRoomSurface
            copy={copy}
            lang={lang}
            workshopContextLine={workshopContextLine}
            currentAgendaItem={currentAgendaItem}
            nextAgendaItem={nextAgendaItem}
            participantSession={participantSession}
            participantTeams={participantTeams}
            publicNotes={participantNotes}
            rotationRevealed={rotationRevealed}
            logoutAction={logoutEventCodeAction}
          />
          </>
        ) : (
          <PublicView configuredEventCode={configuredEventCode} eventAccessError={params?.eventAccess} copy={copy} lang={lang} />
        )}
      </div>
    </main>
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
            {blueprintRepoUrl ? (
              <a
                className="rounded-full border border-[var(--border)] px-5 py-3 transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                href={blueprintRepoUrl}
                rel="noreferrer"
                target="_blank"
              >
                {copy.blueprintLink}
              </a>
            ) : null}
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
            <SubmitButton
              className="w-full rounded-full border border-[var(--accent-text)] bg-[var(--accent-text)] px-4 py-3 text-sm font-medium lowercase text-[var(--accent-surface)] transition hover:bg-transparent hover:text-[var(--accent-text)]"
            >
              {copy.eventCodeSubmit}
            </SubmitButton>
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

      <section className="border-b border-[var(--border)] py-12" id="structure">
        <div className="grid gap-10 lg:grid-cols-[0.48fr_1fr] lg:gap-16">
          <div>
            <SectionLabel>{copy.structureEyebrow}</SectionLabel>
            <h2 className="mt-4 max-w-sm text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
              {copy.structureTitle}
            </h2>
          </div>
          <div className="space-y-0">
            <PhaseStep number="1" title={copy.structurePhase1Title} body={copy.structurePhase1Body} />
            <PhaseStep number="2" title={copy.structurePhase2Title} body={copy.structurePhase2Body} />
            <PhaseStep number="3" title={copy.structurePhase3Title} body={copy.structurePhase3Body} />
            <PhaseStep number="4" title={copy.structurePhase4Title} body={copy.structurePhase4Body} />
            <PhaseStep number="5" title={copy.structurePhase5Title} body={copy.structurePhase5Body} />
            <p className="mt-6 text-sm leading-7 text-[var(--text-muted)]">{copy.structureOutcome}</p>
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

function PhaseStep({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="grid gap-3 border-t border-[var(--border)] py-4 sm:grid-cols-[2.5rem_180px_1fr] sm:gap-6">
      <span className="text-sm font-medium tabular-nums text-[var(--text-muted)]">{number}</span>
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
