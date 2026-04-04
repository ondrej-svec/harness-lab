import {
  agenda,
  briefs,
  challenges,
  getTeamName,
  monitoring,
  sprintUpdates,
  teams,
  ticker,
  rotation,
  workshopMeta,
} from "@/lib/workshop-data";

const toneClassName = {
  info: "border-white/15 bg-white/5 text-stone-100",
  signal: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  highlight: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
} as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,#171717_0%,#0c0a09_100%)] text-stone-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.5fr_0.9fr]">
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
                  Skill-first workshop dashboard pro telefon i projekci. Stav pracuje se seed daty, ale API kontrakty jsou
                  připravené na Vercel backend a jednoduchou databázi.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge label="Aktuální fáze" value={workshopMeta.currentPhaseLabel} />
                <Badge label="Týmy" value={`${teams.length}`} />
                <Badge label="Briefy" value={`${briefs.length}`} />
                <Badge label="Karty" value={`${challenges.length}`} />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-stone-950/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Live ticker</p>
              <div className="mt-4 space-y-3">
                {ticker.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClassName[item.tone]}`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-stone-500">{workshopMeta.adminHint}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <Card title="Agenda dne" eyebrow="Co se děje teď">
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

          <Card title="Sprint checkpoint feed" eyebrow="Co týmy právě změnily">
            <div className="space-y-3">
              {sprintUpdates.map((update) => (
                <div key={update.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
                      {getTeamName(update.teamId)}
                    </p>
                    <p className="text-xs text-stone-500">{update.at}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">{update.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card title="Týmy a repozitáře" eyebrow="Registrace">
            <div className="grid gap-3 md:grid-cols-2">
              {teams.map((team) => (
                <div key={team.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                      <p className="text-sm text-stone-400">{team.city}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-300">
                      {team.members.length} lidí
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-300">{team.checkpoint}</p>
                  <a
                    className="mt-4 inline-flex text-sm font-medium text-amber-200 underline decoration-amber-400/40 underline-offset-4"
                    href={team.repoUrl}
                  >
                    {team.repoUrl}
                  </a>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Monitoring snapshot" eyebrow="Manuální MVP fallback">
            <div className="space-y-3">
              {monitoring.map((item) => (
                <div key={item.teamId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{getTeamName(item.teamId)}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      {item.agentsFile ? "AGENTS.md ano" : "AGENTS.md chybí"}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-stone-300">
                    <Metric label="Commity / 30 min" value={`${item.commitsLast30Min}`} />
                    <Metric label="Skills" value={`${item.skillsCount}`} />
                    <Metric label="Testy" value={`${item.testsVisible}`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card title="Projektové briefy" eyebrow="Digitální zadání">
            <div className="space-y-4">
              {briefs.map((brief) => (
                <div key={brief.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="text-lg font-semibold text-white">{brief.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-300">{brief.problem}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">První prompt pro agenta</p>
                  <p className="mt-1 text-sm leading-6 text-amber-100">{brief.firstAgentPrompt}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Challenge cards" eyebrow="Semi-mandatory flow">
            <div className="grid gap-3 md:grid-cols-2">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{challenge.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                        {challenge.category} • {formatPhaseHint(challenge.phaseHint)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-stone-300">
                      {challenge.completedBy.length}x
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-300">{challenge.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card title="Rotace týmů" eyebrow="Zamčeno do odpoledního reveal">
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-white">
                  {rotation.revealed ? "Rotace odemčena" : "Rotace je zatím skrytá"}
                </p>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-400">
                  {rotation.scenario}
                </span>
              </div>
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
            </div>
          </Card>

          <Card title="Admin panel shell" eyebrow="Co bude Ondřej ovládat">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminTile
                title="Posunout agendu"
                description="API už má kontrakt pro live agenda state, UI teď ukazuje seedovaný current step."
              />
              <AdminTile
                title="Správa týmů"
                description="Repo URL, brief assignment a checkpoint copy jsou připravené ve seed datech."
              />
              <AdminTile
                title="Reveal rotace"
                description="Rotace má vlastní endpoint a boolean lock, takže později stačí přepnout storage adapter."
              />
              <AdminTile
                title="Challenge completion"
                description="POST endpoint vrací stejný shape jako budoucí perzistence, takže skill může integraci stavět hned."
              />
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function AdminTile({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-300">{description}</p>
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
