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

export const dynamic = "force-dynamic";

async function redeemEventCodeAction(formData: FormData) {
  "use server";

  const result = await redeemEventCode(String(formData.get("eventCode") ?? ""));

  if (!result.ok) {
    redirect(`/?eventAccess=${result.reason}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(participantSessionCookieName, result.session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(result.session.expiresAt),
  });

  redirect("/");
}

async function logoutEventCodeAction() {
  "use server";

  const cookieStore = await cookies();
  const token = cookieStore.get(participantSessionCookieName)?.value;
  await revokeParticipantSession(token);
  cookieStore.set(participantSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  redirect("/");
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ eventAccess?: string }>;
}) {
  const state = await getWorkshopState();
  const params = await searchParams;
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
        <SiteHeader isParticipant={!!participantSession} />

        {participantSession ? (
          <ParticipantView
            currentAgendaItem={currentAgendaItem}
            nextAgendaItem={nextAgendaItem}
            participantSession={participantSession}
            participantTeams={participantTeams}
            publicNotes={participantNotes}
            rotationRevealed={rotation.revealed}
          />
        ) : (
          <PublicView configuredEventCode={configuredEventCode} eventAccessError={params?.eventAccess} />
        )}
      </div>
    </main>
  );
}

function SiteHeader({ isParticipant }: { isParticipant: boolean }) {
  return (
    <header className="border-b border-[var(--border)] pb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link className="text-sm font-medium lowercase tracking-[0.12em] text-[var(--text-primary)]" href="/">
          harness lab
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm lowercase text-[var(--text-secondary)]">
          {isParticipant ? (
            <>
              <a className="transition hover:text-[var(--text-primary)]" href="#room">
                room
              </a>
              <a className="transition hover:text-[var(--text-primary)]" href="#teams">
                teams
              </a>
              <a className="transition hover:text-[var(--text-primary)]" href="#notes">
                notes
              </a>
            </>
          ) : (
            <>
              <a className="transition hover:text-[var(--text-primary)]" href="#overview">
                overview
              </a>
              <a className="transition hover:text-[var(--text-primary)]" href="#principles">
                principles
              </a>
              <a className="transition hover:text-[var(--text-primary)]" href="#details">
                details
              </a>
              <a className="transition hover:text-[var(--text-primary)]" href="#access">
                participant access
              </a>
            </>
          )}
          <a className="transition hover:text-[var(--text-primary)]" href="/admin">
            facilitator login
          </a>
        </nav>
      </div>
    </header>
  );
}

function PublicView({
  configuredEventCode,
  eventAccessError,
}: {
  configuredEventCode: Awaited<ReturnType<typeof getConfiguredEventCode>>;
  eventAccessError?: string;
}) {
  return (
    <>
      <section
        className="grid gap-12 border-b border-[var(--border)] py-12 lg:min-h-[72vh] lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.8fr)] lg:items-end lg:gap-16"
        id="overview"
      >
        <div className="max-w-3xl">
          <p className="text-sm lowercase text-[var(--text-muted)]">workshop operating system for teams using ai agents</p>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.06em] text-[var(--text-primary)] sm:text-6xl lg:text-8xl">
            harness
            <br />
            lab
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--text-secondary)] sm:text-xl">
            Celodenní workshop o kontextu, workflow a handoffu pro práci s AI coding agenty.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-muted)]">
            Praktický den s reálným repem: kontext, plán, testy, handoff. Co po týmu zůstane, rozhoduje.
          </p>
        </div>

        <aside id="access" className="border border-[var(--accent-surface)] bg-[var(--accent-surface)] p-6 text-[var(--accent-text)] sm:p-8">
          <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--accent-muted)]">participant access</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">enter room context</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--accent-secondary)]">
            Pokud jste fyzicky v místnosti, facilitátor sdílí event code. Bez něj tato stránka zůstává veřejným
            přehledem Harness Labu.
          </p>

          <form action={redeemEventCodeAction} className="mt-8 space-y-4">
            <label className="block text-[11px] lowercase tracking-[0.18em] text-[var(--accent-muted)]" htmlFor="event-code">
              event code
            </label>
            <input
              className="w-full border border-[var(--accent-border)] bg-transparent px-4 py-3 text-base text-[var(--accent-text)] outline-none placeholder:text-[var(--accent-muted)]"
              defaultValue={configuredEventCode?.isSample ? configuredEventCode.sampleCode : ""}
              id="event-code"
              name="eventCode"
              placeholder="shared by facilitator"
            />
            <button
              className="w-full border border-[var(--accent-text)] bg-[var(--accent-text)] px-4 py-3 text-sm font-medium lowercase text-[var(--accent-surface)] transition hover:bg-transparent hover:text-[var(--accent-text)]"
              type="submit"
            >
              open participant view
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm lowercase">
            <a className="text-[var(--accent-secondary)] transition hover:text-[var(--accent-text)]" href="/admin">
              facilitator login
            </a>
            <span className="text-[var(--accent-muted)]">/</span>
            <a className="text-[var(--accent-secondary)] transition hover:text-[var(--accent-text)]" href="#details">
              public details
            </a>
          </div>

          {configuredEventCode?.isSample ? (
            <p className="mt-6 text-xs leading-6 text-[var(--accent-muted)]">
              Lokální demo běží se sample kódem, proto je pole předvyplněné. V preview a produkci to tak být nemá.
            </p>
          ) : null}

          {eventAccessError ? (
            <p className="mt-6 border border-[var(--accent-border)] bg-[var(--accent-text)]/8 px-4 py-3 text-sm leading-6 text-[var(--accent-text)]">
              {formatEventAccessError(eventAccessError)}
            </p>
          ) : null}
        </aside>
      </section>

      <section className="border-b border-[var(--border)] py-12" id="principles">
        <div className="grid gap-10 lg:grid-cols-[0.48fr_1fr] lg:gap-16">
          <div>
            <SectionLabel>principles</SectionLabel>
            <h2 className="mt-4 max-w-sm text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
              minimal rules that make teams actually continue.
            </h2>
          </div>
          <div className="space-y-6">
            <SimpleRule
              title="repo before improvisation"
              body="Důležitý záměr, omezení a další krok patří nejdřív do repa, ne do vzduchu."
            />
            <SimpleRule
              title="verify small"
              body="Každý významný posun co nejdřív uzamkněte důkazem. Menší jistota je lepší než velká improvizace."
            />
            <SimpleRule
              title="write for handoff"
              body="Další tým má bez ústního vysvětlování poznat, co funguje, co je křehké a co je bezpečný další krok."
            />
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] py-12" id="details">
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div>
            <SectionLabel>what it is</SectionLabel>
            <p className="mt-4 text-base leading-8 text-[var(--text-secondary)]">
              Harness Lab je praktický workshop o práci s AI agenty v reálném repozitáři. Důraz je na tom, co po
              týmu zůstane: kontext, pravidla, plán, testy a handoff.
            </p>
          </div>
          <div>
            <SectionLabel>for participants</SectionLabel>
            <p className="mt-4 text-base leading-8 text-[var(--text-secondary)]">
              Účastníci dostanou room-specific kontext až po event code. Veřejná stránka zůstává záměrně čistá a
              neobsahuje live stav workshop instance.
            </p>
          </div>
          <div>
            <SectionLabel>public boundary</SectionLabel>
            <p className="mt-4 text-base leading-8 text-[var(--text-secondary)]">
              Skutečná data o termínu, místnosti, rosters a facilitaci patří do privátní runtime vrstvy. Public repo
              a public homepage zůstávají bezpečné a přenositelné.
            </p>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-6 py-8 text-sm text-[var(--text-muted)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="lowercase">harness lab</p>
          <p className="mt-2 max-w-md leading-7">
            public front door for a workshop about context engineering, repository clarity and handoff for ai agents.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lowercase">
          <a className="transition hover:text-[var(--text-primary)]" href="#overview">
            top
          </a>
          <a className="transition hover:text-[var(--text-primary)]" href="#access">
            participant access
          </a>
          <a className="transition hover:text-[var(--text-primary)]" href="/admin">
            facilitator login
          </a>
        </div>
      </footer>
    </>
  );
}

function ParticipantView({
  currentAgendaItem,
  nextAgendaItem,
  participantSession,
  participantTeams,
  publicNotes,
  rotationRevealed,
}: {
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
          <SectionLabel>Participant room</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            {currentAgendaItem?.title ?? "Workshop running"}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            {rotationRevealed
              ? "Continuation shift je odemčený. Čtěte nejdřív repo a handoff předchozího týmu, pak teprve měňte kód."
              : "Soustřeďte se na kontext, plán a první reviewable output. Continuation shift se odemkne později."}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <MetricCard label="Current phase" value={currentAgendaItem?.title ?? "Workshop running"} />
            <MetricCard label="Next" value={nextAgendaItem?.title ?? "Reflection"} />
            <MetricCard label="Session until" value={formatDateTime(participantSession.expiresAt)} />
          </div>
        </div>

        <aside className="border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <SectionLabel>Session</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Přihlášení platí pro room-specific data. Facilitátor zůstává odděleně na <code className="text-[var(--text-muted)]">/admin</code>.
          </p>
          <form action={logoutEventCodeAction} className="mt-6">
            <button
              className="border border-[var(--border-strong)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
              type="submit"
            >
              Leave room context
            </button>
          </form>
        </aside>
      </section>

      <section className="grid gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div id="teams">
          <SectionLabel>Your room data</SectionLabel>
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
              Pro tuto session zatím nejsou dostupná žádná room-specific data.
            </p>
          )}
        </div>

        <div id="notes">
          <SectionLabel>Shared room notes</SectionLabel>
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatEventAccessError(value: string) {
  switch (value) {
    case "invalid_code":
      return "Event code nesedí. Použijte kód sdílený facilitátorem pro tuto místnost.";
    case "expired_code":
      return "Tento event code už expiroval. Facilitátor musí vydat nový nebo ho obnovit.";
    default:
      return "Private room context se nepodařilo odemknout.";
  }
}
