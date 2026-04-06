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
    <main className="min-h-screen bg-[#f5f1e8] text-stone-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[65ch] flex-col px-6 py-10">
        <header className="border-b border-stone-900/10 pb-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">Harness Lab</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-stone-950 sm:text-5xl">
            Kontext, workflow a handoff pro praci s AI agenty.
          </h1>
          <p className="mt-6 max-w-[58ch] text-base leading-8 text-stone-700">
            Veřejná homepage nemá předstírat, že jste uvnitř konkrétní workshop instance. Má jen vysvětlit, co je
            Harness Lab, proč existuje, a nabídnout vstup do room-specific contextu až ve chvíli, kdy ho opravdu
            potřebujete.
          </p>
        </header>

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

function PublicView({
  configuredEventCode,
  eventAccessError,
}: {
  configuredEventCode: Awaited<ReturnType<typeof getConfiguredEventCode>>;
  eventAccessError?: string;
}) {
  return (
    <>
      <section className="border-b border-stone-900/10 py-10">
        <div className="space-y-6 text-base leading-8 text-stone-700">
          <p>
            Harness Lab je celodenní workshop o harness engineeringu. Neučí jen promptování, ale hlavně to, jak
            navrhovat repozitářový kontext, pravidla, ověřování a handoff tak, aby s AI agenty šlo pracovat bezpečně a
            bez improvizace.
          </p>
          <p>
            To důležité má přežít v repu. `AGENTS.md`, plán, malé ověřitelné kroky, testy a čitelné operace jsou
            cennější než efektní, ale nepřenositelný výstup.
          </p>
        </div>
      </section>

      <section className="border-b border-stone-900/10 py-10">
        <div className="space-y-3">
          <SimpleRule
            title="Repo before improvisation"
            body="Nejdřív dostaňte záměr, omezení a další bezpečný krok do repa."
          />
          <SimpleRule
            title="Verify small"
            body="Každý významný posun co nejdřív uzamkněte důkazem, ne dojmem."
          />
          <SimpleRule
            title="Write for handoff"
            body="Další tým má bez ústního vysvětlování poznat, co funguje a co je risk."
          />
        </div>
      </section>

      <section className="py-10">
        <div className="border border-stone-900/10 bg-white/50 p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">Participant access</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-stone-950">Vstup do room contextu</h2>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            Pokud jste fyzicky v místnosti, facilitátor sdílí event code. Bez něj tato stránka zůstává jen jako
            veřejná vstupní vrstva k Harness Labu.
          </p>

          <form action={redeemEventCodeAction} className="mt-6 space-y-4">
            <label className="block text-[11px] uppercase tracking-[0.24em] text-stone-500" htmlFor="event-code">
              Event code
            </label>
            <input
              className="w-full border border-stone-900/15 bg-transparent px-4 py-3 text-base text-stone-950 outline-none placeholder:text-stone-400"
              defaultValue={configuredEventCode?.isSample ? configuredEventCode.sampleCode : ""}
              id="event-code"
              name="eventCode"
              placeholder="shared by facilitator"
            />
            <button
              className="w-full border border-stone-950 bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
              type="submit"
            >
              Enter room context
            </button>
          </form>

          {configuredEventCode?.isSample ? (
            <p className="mt-4 text-xs leading-5 text-stone-500">
              Lokální demo běží se sample kódem, proto je pole předvyplněné. V preview a produkci to tak být nemá.
            </p>
          ) : null}

          {eventAccessError ? (
            <p className="mt-4 border border-red-900/15 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
              {formatEventAccessError(eventAccessError)}
            </p>
          ) : null}
        </div>
      </section>
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
  return <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">{children}</p>;
}

function SimpleRule({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:gap-6">
      <p className="text-sm font-medium text-stone-950">{title}</p>
      <p className="text-sm leading-6 text-stone-600">{body}</p>
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
