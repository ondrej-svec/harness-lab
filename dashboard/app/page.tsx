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

const toneClassName = {
  info: "border-white/15 bg-white/5 text-stone-100",
  signal: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  highlight: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
} as const;

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
  const { agenda, briefs, challenges, rotation, setupPaths, ticker, workshopMeta } = state;
  const currentAgendaItem = agenda.find((item) => item.status === "current") ?? agenda[0];
  const nextAgendaItem = agenda.find((item) => item.status === "upcoming");
  const activeBrief = briefs[0];
  const currentChallengeSet = challenges.filter((challenge) => {
    if (currentAgendaItem?.id === "rotation" || currentAgendaItem?.id === "reveal") {
      return challenge.phaseHint !== "before-lunch";
    }

    return challenge.phaseHint !== "after-rotation";
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,#171717_0%,#0c0a09_100%)] text-stone-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-5">
              <p className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
                {workshopMeta.city} • {workshopMeta.dateRange}
              </p>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
                  {workshopMeta.title}
                </h1>
                <p className="max-w-2xl text-lg text-stone-300">{workshopMeta.subtitle}</p>
                <p className="max-w-2xl text-sm leading-6 text-stone-400">
                  Veřejná participant plocha pro orientaci během dne. Operační zásahy a live facilitace zůstávají v
                  chráněném admin rozhraní mimo tuto stránku.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Badge label="Aktuální fáze" value={workshopMeta.currentPhaseLabel} />
                <Badge label="Další milník" value={nextAgendaItem?.title ?? "Reveal a reflexe"} />
                <Badge label="Challenge focus" value={formatChallengeCount(currentChallengeSet.length)} />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-amber-300/20 bg-stone-950/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Co dělat teď</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{currentAgendaItem?.title}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-300">{currentAgendaItem?.description}</p>
              <div className="mt-5 space-y-3">
                {getCurrentActions(currentAgendaItem?.id, rotation.revealed).map((action) => (
                  <div key={action.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">{action.title}</p>
                    <p className="mt-2 text-sm leading-6 text-stone-300">{action.description}</p>
                  </div>
                ))}
              </div>
              {nextAgendaItem ? (
                <p className="mt-5 text-xs leading-5 text-stone-500">
                  Další blok: {nextAgendaItem.time} • {nextAgendaItem.title}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <Card title="Dnešní workflow" eyebrow="Safe by default">
            <div className="grid gap-3 md:grid-cols-3">
              <WorkflowTile
                title="1. Agent exploration"
                description="Nechte agenta projít UI, screenshoty a konzoli v izolovaném lokálním prostředí."
              />
              <WorkflowTile
                title="2. Playwright regression"
                description="Kritický flow převeďte do opakovatelného testu dřív, než půjdete dál."
              />
              <WorkflowTile
                title="3. Human review"
                description="Před potvrzením změny zkontrolujte, že výsledek odpovídá záměru i rizikům."
              />
            </div>
          </Card>

          <Card title="Live ticker" eyebrow="Co se právě děje v místnosti">
            <div className="space-y-3">
              {ticker.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClassName[item.tone]}`}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Card title="Event access" eyebrow="Soukromý workshop context">
            {participantSession ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">Live mode je aktivní</p>
                  <p className="mt-2 text-sm leading-6 text-stone-100">
                    Dashboard teď může ukazovat workshop-private participant data ze stejného systému jako `workshop-skill`.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-stone-300">
                    Session vyprší: {formatDateTime(participantSession.expiresAt)}
                  </p>
                </div>
                <form action={logoutEventCodeAction}>
                  <button className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-stone-100" type="submit">
                    Odhlásit event session
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-100">Public mode</p>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    Veřejná participant plocha zůstává otevřená. Soukromý event context se odemyká až ve chvíli, kdy ho opravdu potřebujete.
                  </p>
                </div>
                <form action={redeemEventCodeAction} className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-400" htmlFor="event-code">
                    Event code
                  </label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-stone-50 placeholder:text-stone-500"
                    defaultValue={configuredEventCode?.isSample ? configuredEventCode.sampleCode : ""}
                    id="event-code"
                    name="eventCode"
                    placeholder="lantern8-context4-handoff2"
                  />
                  <button className="rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-stone-950" type="submit">
                    Odemknout private context
                  </button>
                </form>
                <p className="text-xs leading-5 text-stone-500">
                  Primární skill flow: spusťte `/workshop login`. Když se pokusíte o private lookup bez session, skill má na login navést.
                </p>
                {params?.eventAccess ? (
                  <p className="rounded-xl border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">
                    {formatEventAccessError(params.eventAccess)}
                  </p>
                ) : null}
              </div>
            )}
          </Card>

          <Card title="Private participant context" eyebrow="Odemknuté až po přihlášení">
            {participantTeams ? (
              <div className="space-y-3">
                {participantTeams.items.map((team) => (
                  <div key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{team.name}</p>
                        <p className="text-sm text-stone-400">{team.city}</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-300">
                        {team.id.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-stone-300">{team.checkpoint}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Repo URL</p>
                    <p className="mt-1 break-all text-sm leading-6 text-cyan-100">{team.repoUrl}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5">
                <p className="text-base font-semibold text-white">Ještě bez private event session</p>
                <p className="mt-3 text-sm leading-6 text-stone-400">
                  Tady se po odemknutí ukážou participant-authenticated data, například týmové repo URL a checkpoint stav.
                </p>
              </div>
            )}
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card title="Agenda dne" eyebrow="Kde jsme v průběhu dne">
            <div className="space-y-3">
              {agenda.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    item.status === "current"
                      ? "border-amber-300/50 bg-amber-300/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-stone-400">{item.description}</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-stone-200">
                      {item.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Participant-safe announcements" eyebrow="Co je veřejně vidět bez přihlášení">
            <div className="space-y-3">
              {ticker.map((item) => (
                <div
                  key={`announcement-${item.id}`}
                  className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClassName[item.tone]}`}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card title="Projektový brief právě teď" eyebrow="Na co má tým mířit">
            {activeBrief ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="text-lg font-semibold text-white">{activeBrief.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-300">{activeBrief.problem}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoListCard title="User stories" items={activeBrief.userStories} />
                  <InfoListCard title="Architecture notes" items={activeBrief.architectureNotes} />
                </div>
                <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">První prompt pro agenta</p>
                  <p className="mt-2 text-sm leading-6 text-amber-50">{activeBrief.firstAgentPrompt}</p>
                </div>
              </div>
            ) : null}
          </Card>

          <Card title="Challenge focus" eyebrow="Co má smysl řešit v této fázi">
            <div className="grid gap-3">
              {currentChallengeSet.map((challenge) => (
                <div key={challenge.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{challenge.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                        {challenge.category} • {formatPhaseHint(challenge.phaseHint)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-stone-300">
                      {formatCompletionCount(challenge.completedBy.length)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-300">{challenge.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <Card title="Setup a reference" eyebrow="Když se tým zasekne">
            <div className="grid gap-3 md:grid-cols-3">
              {setupPaths.map((path) => (
                <div key={path.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">{path.label}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-stone-500">{path.audience}</p>
                  <p className="mt-3 text-sm leading-6 text-stone-300">{path.summary}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Předávací okno" eyebrow="Continuation shift">
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-white">
                  {rotation.revealed ? "Předání je odemčeno" : "Předání je zatím skryté"}
                </p>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-400">
                  {rotation.scenario}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-400">
                {rotation.revealed
                  ? "Nejdřív čtěte repo a teprve potom upravujte kód. Handoff bez čtení je přesně ten typ chaosu, kterému se tento workshop snaží zabránit."
                  : "Rozpis rotací se ukáže až ve chvíli, kdy facilitátor spustí continuation shift. Do té doby se soustřeďte na kontext, plan a první reviewable output."}
              </p>
              {rotation.revealed ? (
                <div className="mt-4 space-y-3">
                  {rotation.slots.map((slot) => (
                    <div key={`${slot.fromTeam}-${slot.toTeam}`} className="rounded-2xl border border-white/10 p-4">
                      <p className="font-semibold text-white">
                        {slot.fromTeam} → {slot.toTeam}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-400">{slot.note}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function Card({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function WorkflowTile({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">{title}</p>
      <p className="mt-3 text-sm leading-6 text-stone-300">{description}</p>
    </div>
  );
}

function InfoListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-200">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-300">
        {items.map((item) => (
          <li key={item} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatPhaseHint(value: "before-lunch" | "after-rotation" | "anytime") {
  switch (value) {
    case "before-lunch":
      return "před obědem";
    case "after-rotation":
      return "po rotaci";
    case "anytime":
      return "kdykoliv";
  }
}

function formatCompletionCount(count: number) {
  if (count === 0) {
    return "zatím 0x";
  }

  return `${count}x splněno`;
}

function formatChallengeCount(count: number) {
  if (count === 1) {
    return "1 karta";
  }

  if (count >= 2 && count <= 4) {
    return `${count} karty`;
  }

  return `${count} karet`;
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
      return "Event code nesedí. Zkontrolujte, že používáte správný kód z room instrukcí.";
    case "expired_code":
      return "Tento event code už expiroval. Facilitátor musí vydat nový nebo ho obnovit.";
    default:
      return "Private event context se nepodařilo odemknout.";
  }
}

function getCurrentActions(agendaId: string | undefined, rotationRevealed: boolean) {
  switch (agendaId) {
    case "opening":
      return [
        {
          title: "Spusťte setup",
          description: "Ověřte, že tým umí otevřít repo, dashboard a workshop skill bez improvizace.",
        },
        {
          title: "Domluvte společný cíl",
          description: "Vyjasněte si, co chce tým do oběda opravdu odevzdat a podle čeho pozná hotovo.",
        },
      ];
    case "talk":
      return [
        {
          title: "Sledujte workflow pointu",
          description: "Nevnímejte prompt jako trik. Sledujte, jak kontext, omezení a Done When mění výsledek.",
        },
        {
          title: "Připravte první prompt",
          description: "Sepište cíl, kontext, omezení a hotovo když ještě před první implementací.",
        },
      ];
    case "rotation":
      return [
        {
          title: "Prvních 10 minut jen čtěte",
          description: "Začněte README, AGENTS.md a planem. Úpravy počkají, dokud nemáte mapu repa.",
        },
        {
          title: "Hledejte bezpečný další krok",
          description: "Pokračujte od nejmenšího ověřitelného tasku, ne od nejlákavějšího souboru.",
        },
      ];
    case "reveal":
      return [
        {
          title: "Sbírejte důkazy",
          description: "Zaznamenejte, které signály v repu vám pomohly pokračovat a kde vznikala nejistota.",
        },
        {
          title: "Připravte W3",
          description: "Ujasněte si Co, A co, A teď pro příští týden práce s AI agenty.",
        },
      ];
    default:
      return [
        {
          title: "Založte kontext v repu",
          description: "Dostaňte do repa AGENTS.md, plan a první ověřitelný cíl ještě před větší implementací.",
        },
        {
          title: "Ověřujte po malých krocích",
          description:
            "Použijte agent exploration na rychlou kontrolu a kritické flow uzamkněte testem dřív, než přidáte další složitost.",
        },
        {
          title: rotationRevealed ? "Připravte handoff" : "Myslete na handoff",
          description:
            "Pište tak, aby další tým bez ústního vysvětlování poznal, co funguje, co je rizikové a co je další bezpečný krok.",
        },
      ];
  }
}
