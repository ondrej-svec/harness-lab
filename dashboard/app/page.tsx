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
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 sm:py-8">
        <SiteHeader />

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

function SiteHeader() {
  return (
    <header className="border-b border-black/10 pb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link className="text-sm font-medium lowercase tracking-[0.12em] text-black" href="/">
          harness lab
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm lowercase text-black/65">
          <a className="transition hover:text-black" href="#overview">
            overview
          </a>
          <a className="transition hover:text-black" href="#principles">
            principles
          </a>
          <a className="transition hover:text-black" href="#details">
            details
          </a>
          <a className="transition hover:text-black" href="#access">
            participant access
          </a>
          <a className="transition hover:text-black" href="/admin">
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
        className="grid gap-12 border-b border-black/10 py-12 lg:min-h-[72vh] lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.8fr)] lg:items-end lg:gap-16"
        id="overview"
      >
        <div className="max-w-3xl">
          <p className="text-sm lowercase text-black/45">workshop operating system for teams using ai agents</p>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.06em] text-black sm:text-6xl lg:text-8xl">
            harness
            <br />
            lab
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-black/72 sm:text-xl">
            Celodenní workshop o kontextu, workflow a handoffu pro práci s AI coding agenty.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-8 text-black/62">
            Ne dashboard. Ne demo místnost. Veřejná vrstva má vysvětlit, proč Harness Lab existuje, co učí, a teprve
            potom otevřít vstup do room contextu pro lidi, kteří už sedí uvnitř workshopu.
          </p>
        </div>

        <aside id="access" className="border border-black bg-black p-6 text-white sm:p-8">
          <p className="text-[11px] lowercase tracking-[0.22em] text-white/60">participant access</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">enter room context</h2>
          <p className="mt-4 text-sm leading-7 text-white/72">
            Pokud jste fyzicky v místnosti, facilitátor sdílí event code. Bez něj tato stránka zůstává veřejným
            přehledem Harness Labu.
          </p>

          <form action={redeemEventCodeAction} className="mt-8 space-y-4">
            <label className="block text-[11px] lowercase tracking-[0.18em] text-white/60" htmlFor="event-code">
              event code
            </label>
            <input
              className="w-full border border-white/20 bg-transparent px-4 py-3 text-base text-white outline-none placeholder:text-white/35"
              defaultValue={configuredEventCode?.isSample ? configuredEventCode.sampleCode : ""}
              id="event-code"
              name="eventCode"
              placeholder="shared by facilitator"
            />
            <button
              className="w-full border border-white bg-white px-4 py-3 text-sm font-medium lowercase text-black transition hover:bg-transparent hover:text-white"
              type="submit"
            >
              open participant view
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm lowercase">
            <a className="text-white/78 transition hover:text-white" href="/admin">
              facilitator login
            </a>
            <span className="text-white/28">/</span>
            <a className="text-white/78 transition hover:text-white" href="#details">
              public details
            </a>
          </div>

          {configuredEventCode?.isSample ? (
            <p className="mt-6 text-xs leading-6 text-white/58">
              Lokální demo běží se sample kódem, proto je pole předvyplněné. V preview a produkci to tak být nemá.
            </p>
          ) : null}

          {eventAccessError ? (
            <p className="mt-6 border border-white/20 bg-white/8 px-4 py-3 text-sm leading-6 text-white">
              {formatEventAccessError(eventAccessError)}
            </p>
          ) : null}
        </aside>
      </section>

      <section className="border-b border-black/10 py-12" id="principles">
        <div className="grid gap-10 lg:grid-cols-[0.48fr_1fr] lg:gap-16">
          <div>
            <SectionLabel>principles</SectionLabel>
            <h2 className="mt-4 max-w-sm text-3xl font-semibold tracking-[-0.04em] text-black sm:text-4xl">
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

      <section className="border-b border-black/10 py-12" id="details">
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div>
            <SectionLabel>what it is</SectionLabel>
            <p className="mt-4 text-base leading-8 text-black/68">
              Harness Lab je praktický workshop o práci s AI agenty v reálném repozitáři. Důraz je na tom, co po
              týmu zůstane: kontext, pravidla, plán, testy a handoff.
            </p>
          </div>
          <div>
            <SectionLabel>for participants</SectionLabel>
            <p className="mt-4 text-base leading-8 text-black/68">
              Účastníci dostanou room-specific kontext až po event code. Veřejná stránka zůstává záměrně čistá a
              neobsahuje live stav workshop instance.
            </p>
          </div>
          <div>
            <SectionLabel>public boundary</SectionLabel>
            <p className="mt-4 text-base leading-8 text-black/68">
              Skutečná data o termínu, místnosti, rosters a facilitaci patří do privátní runtime vrstvy. Public repo
              a public homepage zůstávají bezpečné a přenositelné.
            </p>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-6 py-8 text-sm text-black/58 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="lowercase">harness lab</p>
          <p className="mt-2 max-w-md leading-7">
            public front door for a workshop about context engineering, repository clarity and handoff for ai agents.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lowercase">
          <a className="transition hover:text-black" href="#overview">
            top
          </a>
          <a className="transition hover:text-black" href="#access">
            participant access
          </a>
          <a className="transition hover:text-black" href="/admin">
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
      <section className="grid gap-8 border-b border-stone-900/10 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <SectionLabel>Participant room</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-stone-950">Room context unlocked.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
            Tohle je už užší pracovní vrstva pro účastníky v místnosti. Pořád ne facilitátorský control room, ale
            už ani ne veřejná landing page.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <MetricCard label="Current phase" value={currentAgendaItem?.title ?? "Workshop running"} />
            <MetricCard label="Next" value={nextAgendaItem?.title ?? "Reflection"} />
            <MetricCard label="Session until" value={formatDateTime(participantSession.expiresAt)} />
          </div>
        </div>

        <aside className="border border-stone-900/10 bg-white/60 p-6">
          <SectionLabel>Session</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Přihlášení se používá jen pro room-specific data. Facilitátor zůstává odděleně na `/admin`.
          </p>
          <p className="mt-4 text-sm leading-6 text-stone-700">
            {rotationRevealed
              ? "Continuation shift je odemčený. Čtěte nejdřív repo a handoff, pak teprve měňte kód."
              : "Continuation shift je zatím skrytý. Soustřeďte se na kontext, plán a první reviewable output."}
          </p>
          <form action={logoutEventCodeAction} className="mt-6">
            <button
              className="border border-stone-900/15 px-4 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-900/30 hover:text-stone-950"
              type="submit"
            >
              Leave room context
            </button>
          </form>
        </aside>
      </section>

      <section className="grid gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <SectionLabel>Your room data</SectionLabel>
          {participantTeams ? (
            <div className="mt-4 space-y-4">
              {participantTeams.items.map((team) => (
                <article key={team.id} className="border-b border-stone-900/10 pb-5 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-stone-950">{team.name}</h3>
                      <p className="text-sm text-stone-500">{team.city}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-400">{team.id}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-stone-700">{team.checkpoint}</p>
                  <p className="mt-4 break-all text-sm text-stone-500">{team.repoUrl}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-stone-600">
              Pro tuto session zatím nejsou dostupná žádná room-specific data.
            </p>
          )}
        </div>

        <div>
          <SectionLabel>Shared room notes</SectionLabel>
          <div className="mt-4 divide-y divide-stone-900/10 border-y border-stone-900/10">
            {publicNotes.map((item) => (
              <div key={item.id} className="py-4 text-sm leading-6 text-stone-700">
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
  return <p className="text-[11px] lowercase tracking-[0.22em] text-black/45">{children}</p>;
}

function SimpleRule({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="grid gap-3 border-t border-black/10 pt-5 sm:grid-cols-[220px_1fr] sm:gap-8">
      <p className="text-sm font-medium lowercase text-black">{title}</p>
      <p className="text-sm leading-7 text-black/64">{body}</p>
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
    <div className="border border-stone-900/10 bg-white/60 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">{label}</p>
      <p className="mt-3 text-base font-medium leading-6 text-stone-950">{value}</p>
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
      return "Event code nesedí. Pouzijte kod sdileny facilitátorem pro tuto místnost.";
    case "expired_code":
      return "Tento event code uz expiroval. Facilitátor musi vydat novy nebo ho obnovit.";
    default:
      return "Private room context se nepodarilo odemknout.";
  }
}
