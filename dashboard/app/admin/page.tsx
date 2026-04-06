import { redirect } from "next/navigation";
import { requireFacilitatorActionAccess, requireFacilitatorPageAccess } from "@/lib/facilitator-access";
import { auth } from "@/lib/auth/server";
import { getInstanceGrantRepository } from "@/lib/instance-grant-repository";
import { getFacilitatorSession } from "@/lib/facilitator-session";
import { getCurrentWorkshopInstanceId } from "@/lib/instance-context";
import { getRuntimeStorageMode } from "@/lib/runtime-storage";
import { getNeonSql } from "@/lib/neon-db";
import { getAuditLogRepository } from "@/lib/audit-log-repository";
import { adminCopy, resolveUiLanguage, type UiLanguage, withLang } from "@/lib/ui-language";
import { ThemeSwitcher } from "../components/theme-switcher";
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

async function signOutAction(formData: FormData) {
  "use server";
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  if (auth) {
    await auth.signOut();
  }
  redirect(withLang("/admin/sign-in", lang));
}

async function setAgendaAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const agendaId = String(formData.get("agendaId") ?? "");
  if (agendaId) {
    await setCurrentAgendaItem(agendaId);
  }
  redirect(withLang("/admin", lang));
}

async function toggleRotationAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  await setRotationReveal(formData.get("revealed") === "true");
  redirect(withLang("/admin", lang));
}

async function saveCheckpointAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const teamId = String(formData.get("teamId") ?? "");
  const checkpoint = String(formData.get("checkpoint") ?? "");
  if (teamId && checkpoint) {
    await updateCheckpoint(teamId, checkpoint);
  }
  redirect(withLang("/admin", lang));
}

async function addCheckpointFeedAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
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
  redirect(withLang("/admin", lang));
}

async function completeChallengeAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const teamId = String(formData.get("teamId") ?? "");
  const challengeId = String(formData.get("challengeId") ?? "");
  if (teamId && challengeId) {
    await completeChallenge(challengeId, teamId);
  }
  redirect(withLang("/admin", lang));
}

async function registerTeamAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
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
  redirect(withLang("/admin", lang));
}

async function resetWorkshopAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const templateId = String(formData.get("templateId") ?? "");
  if (templateId) {
    await resetWorkshopState(templateId);
  }
  redirect(withLang("/admin", lang));
}

async function archiveWorkshopAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim();
  await createWorkshopArchive({ reason: "manual", notes: notes || null });
  redirect(withLang("/admin", lang));
}

async function addFacilitatorAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "operator") as "owner" | "operator" | "observer";

  if (email && ["owner", "operator", "observer"].includes(role)) {
    const facilitator = await getFacilitatorSession();
    if (facilitator?.grant.role === "owner") {
      const instanceId = getCurrentWorkshopInstanceId();
      const sql = getNeonSql();
      const users = (await sql.query(
        `SELECT id::text, name, email FROM neon_auth."user" WHERE email = $1 LIMIT 1`,
        [email],
      )) as { id: string; name: string; email: string }[];

      if (users.length > 0) {
        const repo = getInstanceGrantRepository();
        const existing = await repo.getActiveGrantByNeonUserId(instanceId, users[0].id);
        if (!existing) {
          await repo.createGrant(instanceId, users[0].id, role);
          await getAuditLogRepository().append({
            id: `audit-${Date.now()}`,
            instanceId,
            actorKind: "facilitator",
            action: "facilitator_grant_created",
            result: "success",
            createdAt: new Date().toISOString(),
            metadata: { grantedToEmail: email, role },
          });
        }
      }
    }
  }
  redirect(withLang("/admin", lang));
}

async function revokeFacilitatorAction(formData: FormData) {
  "use server";
  await requireFacilitatorActionAccess();
  const lang = resolveUiLanguage(String(formData.get("lang") ?? ""));
  const grantId = String(formData.get("grantId") ?? "");

  if (grantId) {
    const facilitator = await getFacilitatorSession();
    if (facilitator?.grant.role === "owner" && grantId !== facilitator.grant.id) {
      await getInstanceGrantRepository().revokeGrant(grantId);
      await getAuditLogRepository().append({
        id: `audit-${Date.now()}`,
        instanceId: getCurrentWorkshopInstanceId(),
        actorKind: "facilitator",
        action: "facilitator_grant_revoked",
        result: "success",
        createdAt: new Date().toISOString(),
        metadata: { revokedGrantId: grantId },
      });
    }
  }
  redirect(withLang("/admin", lang));
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  await requireFacilitatorPageAccess();
  const params = await searchParams;
  const lang = resolveUiLanguage(params?.lang);
  const copy = adminCopy[lang];
  const isNeonMode = getRuntimeStorageMode() === "neon";
  const [state, latestArchive, facilitatorGrants, currentFacilitator] = await Promise.all([
    getWorkshopState(),
    getLatestWorkshopArchive(),
    isNeonMode ? getInstanceGrantRepository().listActiveGrants(getCurrentWorkshopInstanceId()) : Promise.resolve([]),
    isNeonMode ? getFacilitatorSession() : Promise.resolve(null),
  ]);
  const currentAgendaItem = state.agenda.find((item) => item.status === "current") ?? state.agenda[0];
  const isOwner = currentFacilitator?.grant.role === "owner";

  return (
    <main className="min-h-screen bg-[var(--surface-admin)] px-4 py-8 text-[var(--text-primary)] sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{copy.deskEyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{copy.pageTitle}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{copy.pageBody}</p>
            </div>
            <div className="flex items-center gap-3">
              <AdminLanguageSwitcher lang={lang} />
              <span className="text-[var(--text-muted)]">/</span>
              <ThemeSwitcher />
              <span className="text-[var(--text-muted)]">/</span>
              <form action={signOutAction}>
                <input name="lang" type="hidden" value={lang} />
                <button
                  type="submit"
                  className="text-xs lowercase text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                >
                  {copy.signOutButton}
                </button>
              </form>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <StatusPill label={copy.activeInstance} value={state.workshopId} />
            <StatusPill label={copy.currentPhase} value={currentAgendaItem?.title ?? state.workshopMeta.currentPhaseLabel} />
            <StatusPill label={copy.rotation} value={state.rotation.revealed ? copy.rotationUnlocked : copy.rotationHidden} />
            <StatusPill label={copy.teams} value={`${state.teams.length}`} />
          </div>
          {latestArchive ? (
            <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">
              {copy.latestArchivePrefix} {latestArchive.createdAt} • {copy.retentionUntil} {latestArchive.retentionUntil ?? copy.retentionUnset}.
            </p>
          ) : null}
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <AdminGroup
            title={copy.workshopStateTitle}
            eyebrow={copy.workshopStateEyebrow}
            description={copy.workshopStateDescription}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <AdminCard title={copy.moveAgendaTitle} tone="default">
                <form action={setAgendaAction} className="space-y-3">
                  <input name="lang" type="hidden" value={lang} />
                  <select name="agendaId" className={inputClassName}>
                    {state.agenda.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.time} • {item.title}
                      </option>
                    ))}
                  </select>
                  <button className={primaryButtonClassName} type="submit">
                    {copy.setCurrentPhase}
                  </button>
                </form>
              </AdminCard>

              <AdminCard title={copy.resetInstanceTitle} tone="danger">
                <form action={resetWorkshopAction} className="space-y-3">
                  <input name="lang" type="hidden" value={lang} />
                  <select name="templateId" className={inputClassName}>
                    {workshopTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.label} • {template.room}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.resetHint}</p>
                  <button className={dangerButtonClassName} type="submit">
                    {copy.resetButton}
                  </button>
                </form>
              </AdminCard>

              <AdminCard title={copy.archiveTitle} tone="default">
                <form action={archiveWorkshopAction} className="space-y-3">
                  <input name="lang" type="hidden" value={lang} />
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder={copy.archivePlaceholder}
                    className={inputClassName}
                  />
                  <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.archiveHint}</p>
                  <button className={primaryButtonClassName} type="submit">
                    {copy.archiveButton}
                  </button>
                </form>
              </AdminCard>
            </div>
          </AdminGroup>

          <AdminGroup
            title={copy.continuationTitle}
            eyebrow={copy.continuationEyebrow}
            description={copy.continuationDescription}
          >
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <AdminCard title={copy.revealTitle} tone="highlight">
                <form action={toggleRotationAction} className="space-y-3">
                  <input name="lang" type="hidden" value={lang} />
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="border border-[var(--accent-surface)] bg-[var(--accent-surface)] px-4 py-2 font-semibold text-[var(--accent-text)]"
                      type="submit"
                      name="revealed"
                      value="true"
                    >
                      {copy.unlockButton}
                    </button>
                    <button
                      className="border border-[var(--border-strong)] px-4 py-2 font-semibold text-[var(--text-secondary)]"
                      type="submit"
                      name="revealed"
                      value="false"
                    >
                      {copy.hideAgainButton}
                    </button>
                  </div>
                  <p className="text-xs leading-5 text-[var(--text-muted)]">
                    {copy.participantStatePrefix} {state.rotation.revealed ? copy.participantStateUnlocked : copy.participantStateHidden}.
                  </p>
                </form>
              </AdminCard>

              <AdminCard title={copy.activeRotationTitle} tone="default">
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
            title={copy.teamOpsTitle}
            eyebrow={copy.teamOpsEyebrow}
            description={copy.teamOpsDescription}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <AdminCard title={copy.registerTeamTitle} tone="default">
                <form action={registerTeamAction} className="space-y-3">
                  <input name="lang" type="hidden" value={lang} />
                  <input name="id" placeholder="t5" className={inputClassName} />
                  <input name="name" placeholder={copy.teamNamePlaceholder} className={inputClassName} />
                  <input name="city" placeholder="Studio A" className={inputClassName} />
                  <input name="repoUrl" placeholder="https://github.com/..." className={inputClassName} />
                  <input name="projectBriefId" placeholder="standup-bot" className={inputClassName} />
                  <input name="members" placeholder="Anna, David, Eva" className={inputClassName} />
                  <textarea
                    name="checkpoint"
                    rows={3}
                    placeholder={copy.teamCheckpointPlaceholder}
                    className={inputClassName}
                  />
                  <button className={primaryButtonClassName} type="submit">
                    {copy.saveTeamButton}
                  </button>
                </form>
              </AdminCard>

              <AdminCard title={copy.editCheckpointTitle} tone="default">
                <form action={saveCheckpointAction} className="space-y-3">
                  <input name="lang" type="hidden" value={lang} />
                  <select name="teamId" className={inputClassName}>
                    {state.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <textarea name="checkpoint" rows={5} className={inputClassName} />
                  <button className={primaryButtonClassName} type="submit">
                    {copy.saveCheckpointButton}
                  </button>
                </form>
              </AdminCard>
            </div>
          </AdminGroup>

          <AdminGroup
            title={copy.signalTitle}
            eyebrow={copy.signalEyebrow}
            description={copy.signalDescription}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <AdminCard title={copy.sprintFeedTitle} tone="default">
                <form action={addCheckpointFeedAction} className="space-y-3">
                  <input name="lang" type="hidden" value={lang} />
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
                    {copy.addUpdateButton}
                  </button>
                </form>
              </AdminCard>

              <AdminCard title={copy.completeChallengeTitle} tone="default">
                <form action={completeChallengeAction} className="space-y-3">
                  <input name="lang" type="hidden" value={lang} />
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
                    {copy.recordCompletionButton}
                  </button>
                </form>
              </AdminCard>
            </div>
          </AdminGroup>
        </section>

        <section>
          <AdminGroup
            eyebrow={copy.facilitatorsEyebrow}
            title={copy.facilitatorsTitle}
            description={copy.facilitatorsDescription}
          >
            {!isNeonMode ? (
              <AdminCard title="" tone="default">
                <p className="text-sm text-[var(--text-muted)]">{copy.fileModeFacilitators}</p>
              </AdminCard>
            ) : (
              <div className="space-y-4">
                {facilitatorGrants.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">{copy.facilitatorListEmpty}</p>
                ) : (
                  <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
                    {facilitatorGrants.map((grant) => (
                      <div key={grant.id} className="flex items-center justify-between gap-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {grant.userName ?? grant.userEmail ?? grant.neonUserId}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {grant.userEmail ? `${grant.userEmail} · ` : ""}{grant.role}
                          </p>
                        </div>
                        {isOwner && grant.id !== currentFacilitator?.grant.id ? (
                          <form action={revokeFacilitatorAction}>
                            <input name="lang" type="hidden" value={lang} />
                            <input name="grantId" type="hidden" value={grant.id} />
                            <button
                              type="submit"
                              className="text-xs text-[var(--danger)] transition hover:text-[var(--text-primary)]"
                            >
                              {copy.revokeButton}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                {isOwner ? (
                  <AdminCard title={copy.addFacilitatorTitle} tone="default">
                    <form action={addFacilitatorAction} className="flex flex-wrap items-end gap-3">
                      <input name="lang" type="hidden" value={lang} />
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder={copy.facilitatorEmailPlaceholder}
                        className={inputClassName}
                      />
                      <select name="role" className={inputClassName}>
                        <option value="operator">operator</option>
                        <option value="owner">owner</option>
                        <option value="observer">observer</option>
                      </select>
                      <button className={primaryButtonClassName} type="submit">
                        {copy.addFacilitatorButton}
                      </button>
                    </form>
                  </AdminCard>
                ) : null}
              </div>
            )}
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

function AdminLanguageSwitcher({ lang }: { lang: UiLanguage }) {
  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
      <a className={lang === "cs" ? "text-[var(--text-primary)]" : "transition hover:text-[var(--text-primary)]"} href={withLang("/admin", "cs")}>
        CZ
      </a>
      <span>/</span>
      <a className={lang === "en" ? "text-[var(--text-primary)]" : "transition hover:text-[var(--text-primary)]"} href={withLang("/admin", "en")}>
        EN
      </a>
    </div>
  );
}
