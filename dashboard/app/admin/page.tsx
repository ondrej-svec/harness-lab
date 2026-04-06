import { redirect } from "next/navigation";
import { requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { workshopTemplates } from "@/lib/workshop-data";
import {
  addSprintUpdate,
  completeChallenge,
  getWorkshopState,
  resetWorkshopState,
  setCurrentAgendaItem,
  setRotationReveal,
  updateCheckpoint,
  upsertTeam,
} from "@/lib/workshop-store";

export const dynamic = "force-dynamic";

async function setAgendaAction(formData: FormData) {
  "use server";
  await requireFacilitatorPageAccess();
  const agendaId = String(formData.get("agendaId") ?? "");
  if (agendaId) {
    await setCurrentAgendaItem(agendaId);
  }
  redirect("/admin");
}

async function toggleRotationAction(formData: FormData) {
  "use server";
  await requireFacilitatorPageAccess();
  await setRotationReveal(formData.get("revealed") === "true");
  redirect("/admin");
}

async function saveCheckpointAction(formData: FormData) {
  "use server";
  await requireFacilitatorPageAccess();
  const teamId = String(formData.get("teamId") ?? "");
  const checkpoint = String(formData.get("checkpoint") ?? "");
  if (teamId && checkpoint) {
    await updateCheckpoint(teamId, checkpoint);
  }
  redirect("/admin");
}

async function addCheckpointFeedAction(formData: FormData) {
  "use server";
  await requireFacilitatorPageAccess();
  const teamId = String(formData.get("teamId") ?? "");
  const text = String(formData.get("text") ?? "");
  const at = String(formData.get("at") ?? "");
  if (teamId && text && at) {
    await addSprintUpdate({
      id: `u-${Date.now()}`,
      teamId,
      text,
      at,
    });
  }
  redirect("/admin");
}

async function completeChallengeAction(formData: FormData) {
  "use server";
  await requireFacilitatorPageAccess();
  const teamId = String(formData.get("teamId") ?? "");
  const challengeId = String(formData.get("challengeId") ?? "");
  if (teamId && challengeId) {
    await completeChallenge(challengeId, teamId);
  }
  redirect("/admin");
}

async function registerTeamAction(formData: FormData) {
  "use server";
  await requireFacilitatorPageAccess();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "Studio A").trim();
  const repoUrl = String(formData.get("repoUrl") ?? "").trim();
  const projectBriefId = String(formData.get("projectBriefId") ?? "").trim();
  const checkpoint = String(formData.get("checkpoint") ?? "").trim();
  const membersRaw = String(formData.get("members") ?? "").trim();

  if (id && name && repoUrl && projectBriefId) {
    await upsertTeam({
      id,
      name,
      city,
      repoUrl,
      projectBriefId,
      checkpoint,
      members: membersRaw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    });
  }
  redirect("/admin");
}

async function resetWorkshopAction(formData: FormData) {
  "use server";
  await requireFacilitatorPageAccess();
  const templateId = String(formData.get("templateId") ?? "");
  if (templateId) {
    await resetWorkshopState(templateId);
  }
  redirect("/admin");
}

export default async function AdminPage() {
  const state = await getWorkshopState();
  const currentAgendaItem = state.agenda.find((item) => item.status === "current") ?? state.agenda[0];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#0c0a09_0%,#111827_100%)] px-4 py-6 text-stone-50 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Admin</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Řízení workshopu</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">
            Chráněný operační panel pro facilitátora. Drží odděleně participant orientaci a live zásahy do workshop
            instance, aby veřejná plocha zůstala čistá a mobile-first.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <StatusPill label="Aktivní instance" value={state.workshopId} />
            <StatusPill label="Aktuální fáze" value={currentAgendaItem?.title ?? state.workshopMeta.currentPhaseLabel} />
            <StatusPill label="Rotace" value={state.rotation.revealed ? "odemčeno" : "skryto"} />
            <StatusPill label="Týmy" value={`${state.teams.length}`} />
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <AdminGroup
            title="Workshop state"
            eyebrow="Rychlé zásahy do průběhu dne"
            description="Použijte na změnu fáze a reset instance. Reset je high-impact operace."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <AdminCard title="Posunout agendu" tone="default">
                <form action={setAgendaAction} className="space-y-3">
                  <select name="agendaId" className={inputClassName}>
                    {state.agenda.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.time} • {item.title}
                      </option>
                    ))}
                  </select>
                  <button className={primaryButtonClassName} type="submit">
                    Nastavit current fázi
                  </button>
                </form>
              </AdminCard>

              <AdminCard title="Reset workshop instance" tone="danger">
                <form action={resetWorkshopAction} className="space-y-3">
                  <select name="templateId" className={inputClassName}>
                    {workshopTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.label} • {template.room}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs leading-5 text-stone-400">
                    Přepíše lokální workshop state seedovanou ukázkovou instancí.
                  </p>
                  <button className={dangerButtonClassName} type="submit">
                    Resetovat data
                  </button>
                </form>
              </AdminCard>
            </div>
          </AdminGroup>

          <AdminGroup
            title="Continuation controls"
            eyebrow="Odemknutí handoff momentu"
            description="Jasně oddělené high-impact ovládání pro reveal/hide continuation shift."
          >
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <AdminCard title="Reveal rotace" tone="highlight">
                <form action={toggleRotationAction} className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-stone-950"
                      type="submit"
                      name="revealed"
                      value="true"
                    >
                      Odemknout
                    </button>
                    <button
                      className="rounded-xl border border-white/15 px-4 py-2 font-semibold"
                      type="submit"
                      name="revealed"
                      value="false"
                    >
                      Znovu skrýt
                    </button>
                  </div>
                  <p className="text-xs leading-5 text-stone-400">
                    Stav na participant ploše: {state.rotation.revealed ? "předání je odemčeno" : "předání je skryté"}.
                  </p>
                </form>
              </AdminCard>

              <AdminCard title="Aktivní rozpis rotace" tone="default">
                <div className="space-y-3">
                  {state.rotation.slots.map((slot) => (
                    <div key={`${slot.fromTeam}-${slot.toTeam}`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <p className="font-semibold text-white">
                        {slot.fromTeam} → {slot.toTeam}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-400">{slot.note}</p>
                    </div>
                  ))}
                </div>
              </AdminCard>
            </div>
          </AdminGroup>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <AdminGroup
            title="Team operations"
            eyebrow="Repo a checkpoint management"
            description="Formuláře pro registraci týmů a údržbu jejich aktuálního checkpointu."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <AdminCard title="Registrovat nebo upravit tým" tone="default">
                <form action={registerTeamAction} className="space-y-3">
                  <input name="id" placeholder="t5" className={inputClassName} />
                  <input name="name" placeholder="Tým 5" className={inputClassName} />
                  <input name="city" placeholder="Studio A" className={inputClassName} />
                  <input name="repoUrl" placeholder="https://github.com/..." className={inputClassName} />
                  <input name="projectBriefId" placeholder="standup-bot" className={inputClassName} />
                  <input name="members" placeholder="Anna, David, Eva" className={inputClassName} />
                  <textarea
                    name="checkpoint"
                    rows={3}
                    placeholder="Aktuální stav týmu"
                    className={inputClassName}
                  />
                  <button className={primaryButtonClassName} type="submit">
                    Uložit tým
                  </button>
                </form>
              </AdminCard>

              <AdminCard title="Upravit checkpoint týmu" tone="default">
                <form action={saveCheckpointAction} className="space-y-3">
                  <select name="teamId" className={inputClassName}>
                    {state.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <textarea name="checkpoint" rows={5} className={inputClassName} />
                  <button className={primaryButtonClassName} type="submit">
                    Uložit checkpoint
                  </button>
                </form>
              </AdminCard>
            </div>
          </AdminGroup>

          <AdminGroup
            title="Signal capture"
            eyebrow="Intermezzo a progress evidence"
            description="Krátké zápisy do feedu a challenge completion, které se pak promítají do workshop rytmu."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <AdminCard title="Sprint checkpoint feed" tone="default">
                <form action={addCheckpointFeedAction} className="space-y-3">
                  <select name="teamId" className={inputClassName}>
                    {state.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <input name="at" defaultValue="11:15" className={inputClassName} />
                  <textarea name="text" rows={4} className={inputClassName} />
                  <button className={primaryButtonClassName} type="submit">
                    Přidat update
                  </button>
                </form>
              </AdminCard>

              <AdminCard title="Označit challenge jako splněnou" tone="default">
                <form action={completeChallengeAction} className="space-y-3">
                  <select name="teamId" className={inputClassName}>
                    {state.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <select name="challengeId" className={inputClassName}>
                    {state.challenges.map((challenge) => (
                      <option key={challenge.id} value={challenge.id}>
                        {challenge.title}
                      </option>
                    ))}
                  </select>
                  <button className="rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-stone-950" type="submit">
                    Zapsat completion
                  </button>
                </form>
              </AdminCard>
            </div>
          </AdminGroup>
        </section>
      </div>
    </main>
  );
}

function AdminGroup({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function AdminCard({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "default" | "highlight" | "danger";
  children: React.ReactNode;
}) {
  const toneClassName =
    tone === "danger"
      ? "border-rose-300/30 bg-rose-300/10"
      : tone === "highlight"
        ? "border-cyan-300/30 bg-cyan-300/10"
        : "border-white/10 bg-black/20";

  return (
    <section className={`rounded-[1.5rem] border p-5 ${toneClassName}`}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2 text-stone-50 placeholder:text-stone-500";

const primaryButtonClassName = "rounded-xl bg-amber-300 px-4 py-2 font-semibold text-stone-950";

const dangerButtonClassName = "rounded-xl bg-rose-300 px-4 py-2 font-semibold text-stone-950";
