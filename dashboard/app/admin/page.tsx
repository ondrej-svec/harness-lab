import { redirect } from "next/navigation";
import { workshopTemplates } from "@/lib/workshop-data";
import { addSprintUpdate, completeChallenge, getWorkshopState, resetWorkshopState, setCurrentAgendaItem, setRotationReveal, updateCheckpoint, upsertTeam } from "@/lib/workshop-store";

export const dynamic = "force-dynamic";

async function setAgendaAction(formData: FormData) {
  "use server";
  const agendaId = String(formData.get("agendaId") ?? "");
  if (agendaId) {
    await setCurrentAgendaItem(agendaId);
  }
  redirect("/admin");
}

async function toggleRotationAction(formData: FormData) {
  "use server";
  await setRotationReveal(formData.get("revealed") === "true");
  redirect("/admin");
}

async function saveCheckpointAction(formData: FormData) {
  "use server";
  const teamId = String(formData.get("teamId") ?? "");
  const checkpoint = String(formData.get("checkpoint") ?? "");
  if (teamId && checkpoint) {
    await updateCheckpoint(teamId, checkpoint);
  }
  redirect("/admin");
}

async function addCheckpointFeedAction(formData: FormData) {
  "use server";
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
  const teamId = String(formData.get("teamId") ?? "");
  const challengeId = String(formData.get("challengeId") ?? "");
  if (teamId && challengeId) {
    await completeChallenge(challengeId, teamId);
  }
  redirect("/admin");
}

async function registerTeamAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "Brno") as "Brno" | "Praha";
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
      members: membersRaw.split(",").map((value) => value.trim()).filter(Boolean),
    });
  }
  redirect("/admin");
}

async function resetWorkshopAction(formData: FormData) {
  "use server";
  const templateId = String(formData.get("templateId") ?? "");
  if (templateId) {
    await resetWorkshopState(templateId);
  }
  redirect("/admin");
}

export default async function AdminPage() {
  const state = await getWorkshopState();

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-6 text-stone-50 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">Řízení workshopu</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">
            Lokální operační panel pro Ondřeje. Tohle je MVP, které zapisuje do JSON store a umožňuje posouvat den bez seed-only hacků.
          </p>
          <p className="mt-2 text-sm text-cyan-100">Aktivní instance: {state.workshopId}</p>
        </header>

        <AdminCard title="Nový workshop / reset instance">
          <form action={resetWorkshopAction} className="flex flex-col gap-3 sm:flex-row">
            <select name="templateId" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2">
              {workshopTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label} • {template.room}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-rose-300 px-4 py-2 font-semibold text-stone-950" type="submit">
              Resetovat data
            </button>
          </form>
        </AdminCard>

        <section className="grid gap-4 lg:grid-cols-2">
          <AdminCard title="Posunout agendu">
            <form action={setAgendaAction} className="space-y-3">
              <select name="agendaId" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2">
                {state.agenda.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.time} • {item.title}
                  </option>
                ))}
              </select>
              <button className="rounded-xl bg-amber-300 px-4 py-2 font-semibold text-stone-950" type="submit">
                Nastavit current fázi
              </button>
            </form>
          </AdminCard>

          <AdminCard title="Reveal rotace">
            <form action={toggleRotationAction} className="flex gap-3">
              <button className="rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-stone-950" type="submit" name="revealed" value="true">
                Odemknout
              </button>
              <button className="rounded-xl border border-white/15 px-4 py-2 font-semibold" type="submit" name="revealed" value="false">
                Znovu skrýt
              </button>
            </form>
          </AdminCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <AdminCard title="Sprint checkpoint feed">
            <form action={addCheckpointFeedAction} className="space-y-3">
              <select name="teamId" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2">
                {state.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <input name="at" defaultValue="11:15" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2" />
              <textarea name="text" rows={4} className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2" />
              <button className="rounded-xl bg-amber-300 px-4 py-2 font-semibold text-stone-950" type="submit">
                Přidat update
              </button>
            </form>
          </AdminCard>

          <AdminCard title="Označit challenge jako splněnou">
            <form action={completeChallengeAction} className="space-y-3">
              <select name="teamId" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2">
                {state.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <select name="challengeId" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2">
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
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <AdminCard title="Upravit checkpoint týmu">
            <form action={saveCheckpointAction} className="space-y-3">
              <select name="teamId" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2">
                {state.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <textarea name="checkpoint" rows={4} className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2" />
              <button className="rounded-xl bg-amber-300 px-4 py-2 font-semibold text-stone-950" type="submit">
                Uložit checkpoint
              </button>
            </form>
          </AdminCard>

          <AdminCard title="Registrovat nebo upravit tým">
            <form action={registerTeamAction} className="space-y-3">
              <input name="id" placeholder="t5" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2" />
              <input name="name" placeholder="Tým 5" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2" />
              <select name="city" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2">
                <option value="Brno">Brno</option>
                <option value="Praha">Praha</option>
              </select>
              <input name="repoUrl" placeholder="https://github.com/..." className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2" />
              <input name="projectBriefId" placeholder="standup-bot" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2" />
              <input name="members" placeholder="Anna, David, Eva" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2" />
              <textarea name="checkpoint" rows={3} placeholder="Aktuální stav týmu" className="w-full rounded-xl border border-white/10 bg-stone-900 px-3 py-2" />
              <button className="rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-stone-950" type="submit">
                Uložit tým
              </button>
            </form>
          </AdminCard>
        </section>
      </div>
    </main>
  );
}

function AdminCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
