import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess, requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { workshopTemplates } from "@/lib/workshop-data";
import {
  addSprintUpdate,
  createWorkshopArchive,
  completeChallenge,
  getWorkshopState,
  getLatestWorkshopArchive,
  resetWorkshopState,
  setCurrentAgendaItem,
  setRotationReveal,
  updateCheckpoint,
  upsertTeam,
} from "@/lib/workshop-store";

export const dynamic = "force-dynamic";

async function setAgendaAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const agendaId = String(formData.get("agendaId") ?? "");
  if (agendaId) {
    await setCurrentAgendaItem(agendaId);
  }
  redirect("/admin");
}

async function toggleRotationAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  await setRotationReveal(formData.get("revealed") === "true");
  redirect("/admin");
}

async function saveCheckpointAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const teamId = String(formData.get("teamId") ?? "");
  const checkpoint = String(formData.get("checkpoint") ?? "");
  if (teamId && checkpoint) {
    await updateCheckpoint(teamId, checkpoint);
  }
  redirect("/admin");
}

async function addCheckpointFeedAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
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
  await requireFacilitatorActionAccess();
  const teamId = String(formData.get("teamId") ?? "");
  const challengeId = String(formData.get("challengeId") ?? "");
  if (teamId && challengeId) {
    await completeChallenge(challengeId, teamId);
  }
  redirect("/admin");
}

async function registerTeamAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
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
  await requireFacilitatorActionAccess();
  const templateId = String(formData.get("templateId") ?? "");
  if (templateId) {
    await resetWorkshopState(templateId);
  }
  redirect("/admin");
}

async function archiveWorkshopAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const notes = String(formData.get("notes") ?? "").trim();
  await createWorkshopArchive({ reason: "manual", notes: notes || null });
  redirect("/admin");
}

export default async function AdminPage() {
  await requireFacilitatorPageAccess();
  const [state, latestArchive] = await Promise.all([getWorkshopState(), getLatestWorkshopArchive()]);
  const currentAgendaItem = state.agenda.find((item) => item.status === "current") ?? state.agenda[0];

  return (
    <main className="min-h-screen bg-[var(--surface-admin)] px-4 py-8 text-[var(--text-primary)] sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Facilitator desk</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Řízení workshopu</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
            Chráněný operační panel pro facilitátora. Drží odděleně participant orientaci a live zásahy do workshop
            instance, aby veřejná plocha zůstala čistá a mobile-first.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <StatusPill label="Aktivní instance" value={state.workshopId} />
            <StatusPill label="Aktuální fáze" value={currentAgendaItem?.title ?? state.workshopMeta.currentPhaseLabel} />
            <StatusPill label="Rotace" value={state.rotation.revealed ? "odemčeno" : "skryto"} />
            <StatusPill label="Týmy" value={`${state.teams.length}`} />
          </div>
          {latestArchive ? (
            <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">
              Poslední archiv: {latestArchive.createdAt} • retention do {latestArchive.retentionUntil ?? "nenastaveno"}.
            </p>
          ) : null}
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
                  <p className="text-xs leading-5 text-[var(--text-muted)]">
                    Přepíše lokální workshop state seedovanou ukázkovou instancí.
                  </p>
                  <button className={dangerButtonClassName} type="submit">
                    Resetovat data
                  </button>
                </form>
              </AdminCard>

              <AdminCard title="Archivovat aktuální instance" tone="default">
                <form action={archiveWorkshopAction} className="space-y-3">
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Volitelné poznámky k archivaci"
                    className={inputClassName}
                  />
                  <p className="text-xs leading-5 text-[var(--text-muted)]">
                    Uloží snapshot runtime stavu před closeoutem nebo před ručním resetem.
                  </p>
                  <button className={primaryButtonClassName} type="submit">
                    Vytvořit archiv
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
                      className="border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-4 py-2 font-semibold text-[var(--accent-text)]"
                      type="submit"
                      name="revealed"
                      value="true"
                    >
                      Odemknout
                    </button>
                    <button
                      className="border border-[var(--border-strong)] px-4 py-2 font-semibold text-[var(--text-secondary)]"
                      type="submit"
                      name="revealed"
                      value="false"
                    >
                      Znovu skrýt
                    </button>
                  </div>
                  <p className="text-xs leading-5 text-[var(--text-muted)]">
                    Stav na participant ploše: {state.rotation.revealed ? "předání je odemčeno" : "předání je skryté"}.
                  </p>
                </form>
              </AdminCard>

              <AdminCard title="Aktivní rozpis rotace" tone="default">
                <div className="space-y-3">
                  {state.rotation.slots.map((slot) => (
                    <div key={`${slot.fromTeam}-${slot.toTeam}`} className="border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                      <p className="font-semibold text-[var(--text-primary)]">
                        {slot.fromTeam} → {slot.toTeam}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{slot.note}</p>
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
                  <button className={primaryButtonClassName} type="submit">
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
    <section className="border border-[var(--border)] bg-[var(--surface-elevated)] p-5 sm:p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
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
      ? "border-[var(--danger-border)] bg-[var(--danger-surface)]"
      : tone === "highlight"
        ? "border-[var(--highlight-border)] bg-[var(--highlight-surface)]"
        : "border-[var(--border)] bg-[var(--surface)]";

  return (
    <section className={`border p-5 ${toneClassName}`}>
      <h3 className="text-lg font-medium text-[var(--text-primary)]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

const inputClassName =
  "w-full border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]";

const primaryButtonClassName =
  "border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-4 py-2 font-semibold text-[var(--accent-text)]";

const dangerButtonClassName =
  "border border-[var(--danger)] bg-[var(--danger)] px-4 py-2 font-semibold text-white";
