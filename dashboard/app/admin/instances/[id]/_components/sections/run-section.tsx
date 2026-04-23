import { AdminRouteLink } from "@/app/admin/admin-route-link";
import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { ExternalOpenButton } from "@/app/admin/external-open-button";
import { buildAdminHref } from "@/lib/admin-page-view-model";
import type { ParticipantFeedbackRecord, RotationSignal } from "@/lib/runtime-contracts";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import type { RotationPlan, WorkshopState } from "@/lib/workshop-data";
import {
  AdminPanel,
  ControlCard,
  FieldLabel,
  StatusPill,
  adminGhostButtonClassName,
  adminHeroPanelClassName,
  adminInputClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "../../../../admin-ui";
import {
  clearParticipantMomentOverrideAction,
  captureRotationSignalAction,
  promoteParticipantFeedbackAction,
  resetActivePollAction,
  setAgendaAction,
  setParticipantMomentOverrideAction,
} from "../../_actions/agenda";
import {
  addCheckpointFeedAction,
  completeChallengeAction,
} from "../../_actions/signals";
import { toggleRotationAction } from "../../_actions/settings";
import { AdminActionStateFields } from "../admin-action-state-fields";
import type { RichAgendaItem, RichPresenterScene } from "../agenda/types";
import { RunAccessStrip } from "../run-access-strip";
import { ScenePreviewRail } from "../scene-preview-rail";
import type { ActivePollSummary } from "@/lib/workshop-store";

type Copy = (typeof adminCopy)[UiLanguage];

type OverviewStateLike = {
  liveNowTitle: string;
  liveNowDescription: string;
  participantState: string;
};

export function RunSection({
  lang,
  copy,
  instanceId,
  state,
  selectedAgendaItem,
  selectedScene,
  currentAgendaItem,
  nextAgendaItem,
  participantAccess,
  participantAccessExpiresValue,
  allowWalkIns,
  overviewState,
  rotationSignals,
  pollSummary,
  participantFeedback,
  handoffIsLive,
  selectedAgendaOwnsHandoffControls,
  handoffAgendaHref,
  liveAgendaHref,
  selectedAgendaProjectionHref,
  selectedAgendaParticipantMirrorHref,
  teamModeEnabled = true,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  state: Pick<
    WorkshopState,
    "agenda" | "teams" | "rotation" | "workshopMeta" | "challenges" | "liveMoment"
  >;
  selectedAgendaItem: RichAgendaItem | null | undefined;
  selectedScene?: RichPresenterScene | null;
  currentAgendaItem: RichAgendaItem | null | undefined;
  nextAgendaItem: RichAgendaItem | null | undefined;
  participantAccess?: {
    active: boolean;
    codeId: string | null;
    currentCode: string | null;
    canRevealCurrent: boolean;
  } | null;
  participantAccessExpiresValue?: string;
  allowWalkIns?: boolean;
  overviewState: OverviewStateLike;
  rotationSignals: RotationSignal[];
  pollSummary: ActivePollSummary | null;
  participantFeedback: ParticipantFeedbackRecord[];
  handoffIsLive: boolean;
  selectedAgendaOwnsHandoffControls: boolean;
  handoffAgendaHref: string | null;
  liveAgendaHref: string;
  selectedAgendaProjectionHref: string | null;
  selectedAgendaParticipantMirrorHref: string;
  teamModeEnabled?: boolean;
}) {
  const focusItem = selectedAgendaItem ?? currentAgendaItem ?? null;
  const focusStatusLabel =
    focusItem?.status === "current"
      ? copy.liveNow
      : focusItem?.status === "done"
      ? copy.agendaStatusDone
      : copy.agendaStatusUpcoming;
  const activeParticipantMoment =
    focusItem?.id === state.liveMoment.agendaItemId && state.liveMoment.participantMomentId
      ? focusItem.participantMoments.find((moment) => moment.id === state.liveMoment.participantMomentId) ?? null
      : null;
  const liveCopy =
    lang === "en"
      ? {
          liveMomentTitle: "live participant contract",
          liveMomentDescription: "Projection now drives the room, participant moments follow automatically, and manual override stays as a safety path only.",
          roomSceneLabel: "room scene",
          participantMomentLabel: "participant moment",
          participantModeLabel: "mode",
          participantModeAuto: "auto",
          participantModeManual: "manual override",
          noParticipantMoments: "No explicit participant moments are authored for this moment yet.",
          setAutoButton: "return to auto",
          activePollTitle: "active room signal poll",
          activePollEmpty: "No active poll is attached to the live participant moment.",
          activePollResponses: "responses",
          resetPollButton: "reset poll",
          feedbackTitle: "participant feedback",
          feedbackDescription: "Private blocker/question lane. Nothing reaches the room until you explicitly promote it.",
          feedbackEmpty: "No private participant notes yet.",
          promoteButton: "promote to room note",
          promotedLabel: "promoted",
          blockerLabel: "blocker",
          questionLabel: "question",
          unknownTeam: "room",
        }
      : {
          liveMomentTitle: "živý kontrakt pro účastníky",
          liveMomentDescription: "Projekce teď řídí sál, participant momenty ji následují automaticky a ruční override zůstává jen jako pojistka.",
          roomSceneLabel: "scéna pro sál",
          participantMomentLabel: "participant moment",
          participantModeLabel: "režim",
          participantModeAuto: "auto",
          participantModeManual: "ruční override",
          noParticipantMoments: "Pro tenhle moment zatím nejsou explicitní participant momenty.",
          setAutoButton: "vrátit auto režim",
          activePollTitle: "aktivní room-signal poll",
          activePollEmpty: "Na živý participant moment teď není navázaný žádný poll.",
          activePollResponses: "odpovědí",
          resetPollButton: "resetovat poll",
          feedbackTitle: "participant feedback",
          feedbackDescription: "Soukromá linka pro blocker nebo otázku. Do místnosti se nic nedostane bez vědomého promote kroku.",
          feedbackEmpty: "Zatím žádné soukromé participant poznámky.",
          promoteButton: "povýšit do poznámky pro místnost",
          promotedLabel: "promováno",
          blockerLabel: "blocker",
          questionLabel: "otázka",
          unknownTeam: "místnost",
        };

  return (
    // The Run tab being active is signal enough; the eyebrow + "run"
    // title + description here duplicated what the nav already says.
    // Retired in the 2026-04-23 cleanup; surface chrome preserved.
    <section className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] shadow-[var(--shadow-soft)] backdrop-blur p-5 sm:p-6">
      <div className="relative space-y-5">
        {participantAccess ? (
          <RunAccessStrip
            lang={lang}
            copy={copy}
            instanceId={instanceId}
            participantAccess={participantAccess}
            participantAccessExpiresValue={participantAccessExpiresValue ?? ""}
            allowWalkIns={allowWalkIns ?? true}
          />
        ) : null}

        <div className={`${adminHeroPanelClassName} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={focusStatusLabel} tone={focusItem?.status === "current" ? "live" : "neutral"} />
            <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--hero-secondary)]">
              {state.workshopMeta.currentPhaseLabel}
            </span>
            {focusItem?.id === nextAgendaItem?.id && focusItem?.id !== currentAgendaItem?.id ? (
              <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--hero-muted)]">
                {copy.nextUp}
              </span>
            ) : null}
            <span className="text-xs text-[var(--hero-muted)]">
              {copy.liveNow}: {currentAgendaItem ? `${currentAgendaItem.time} • ${currentAgendaItem.title}` : copy.presenterNoSceneTitle}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--hero-text)] sm:text-2xl lg:text-[26px] xl:text-[28px]">
            {focusItem ? `${focusItem.time} • ${focusItem.title}` : overviewState.liveNowTitle}
          </h2>
          {focusItem?.roomSummary || focusItem?.description || overviewState.liveNowDescription ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--hero-secondary)]">
              {focusItem?.roomSummary || focusItem?.description || overviewState.liveNowDescription}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            {focusItem && focusItem.id !== currentAgendaItem?.id ? (
              <form action={setAgendaAction}>
                <AdminActionStateFields lang={lang} section="run" instanceId={instanceId} />
                <input name="agendaId" type="hidden" value={focusItem.id} />
                <input name="returnTo" type="hidden" value="detail" />
                <AdminSubmitButton className={adminPrimaryButtonClassName}>
                  {copy.agendaMoveLiveHereButton}
                </AdminSubmitButton>
              </form>
            ) : null}
            {selectedAgendaProjectionHref ? (
              <ExternalOpenButton
                className={
                  focusItem && focusItem.id !== currentAgendaItem?.id
                    ? `${adminSecondaryButtonClassName} inline-flex`
                    : `${adminPrimaryButtonClassName} inline-flex`
                }
                href={selectedAgendaProjectionHref}
              >
                {copy.presenterOpenCurrentButton}
              </ExternalOpenButton>
            ) : null}
            <ExternalOpenButton
              className={`${adminGhostButtonClassName} inline-flex`}
              href={selectedAgendaParticipantMirrorHref}
            >
              {copy.presenterOpenParticipantSurfaceButton}
            </ExternalOpenButton>
            {currentAgendaItem && focusItem && focusItem.id !== currentAgendaItem.id ? (
              <AdminRouteLink
                className={adminGhostButtonClassName}
                href={liveAgendaHref}
                scroll={false}
              >
                {copy.agendaJumpToLiveButton}
              </AdminRouteLink>
            ) : null}
          </div>
        </div>

        {focusItem ? (
          <MomentGuideCard item={focusItem} copy={copy} />
        ) : null}

        {focusItem && focusItem.presenterScenes.length > 0 ? (
          <ScenePreviewRail
            item={focusItem}
            scenes={focusItem.presenterScenes as RichPresenterScene[]}
            selectedScene={
              (selectedScene as RichPresenterScene | null | undefined) ??
              (focusItem.presenterScenes.find(
                (scene) => scene.id === focusItem.defaultPresenterSceneId,
              ) as RichPresenterScene | undefined) ??
              (focusItem.presenterScenes[0] as RichPresenterScene | undefined) ??
              null
            }
            defaultSceneId={focusItem.defaultPresenterSceneId ?? null}
            lang={lang}
            copy={copy}
            instanceId={instanceId}
          />
        ) : null}

        {focusItem ? (
          <ControlCard title={liveCopy.liveMomentTitle} description={liveCopy.liveMomentDescription}>
            <div className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{liveCopy.roomSceneLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                    {focusItem.presenterScenes.find((scene) => scene.id === state.liveMoment.roomSceneId)?.label ?? "—"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{liveCopy.participantMomentLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{activeParticipantMoment?.label ?? "—"}</p>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{liveCopy.participantModeLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                    {state.liveMoment.participantMode === "manual"
                      ? liveCopy.participantModeManual
                      : liveCopy.participantModeAuto}
                  </p>
                </div>
              </div>

              {focusItem.participantMoments.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-2">
                  {focusItem.participantMoments
                    .filter((moment) => moment.enabled)
                    .map((moment) => {
                      const isActive = state.liveMoment.participantMomentId === moment.id;
                      const isManual = isActive && state.liveMoment.participantMode === "manual";
                      return (
                        <div
                          key={moment.id}
                          className={`rounded-[20px] border p-4 ${
                            isActive
                              ? "border-[var(--border-strong)] bg-[var(--surface-panel)]"
                              : "border-[var(--border)] bg-[var(--surface-soft)]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[var(--text-primary)]">{moment.label}</p>
                              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{moment.body}</p>
                            </div>
                            {moment.poll ? <StatusPill label="poll" tone="neutral" /> : null}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {isManual ? (
                              <StatusPill label={liveCopy.participantModeManual} tone="live" />
                            ) : null}
                            {!isManual ? (
                              <form action={setParticipantMomentOverrideAction}>
                                <AdminActionStateFields lang={lang} section="run" instanceId={instanceId} />
                                <input name="agendaId" type="hidden" value={focusItem.id} />
                                <input name="participantMomentId" type="hidden" value={moment.id} />
                                <AdminSubmitButton className={adminSecondaryButtonClassName}>
                                  {copy.presenterShowSceneButton}
                                </AdminSubmitButton>
                              </form>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm leading-6 text-[var(--text-secondary)]">{liveCopy.noParticipantMoments}</p>
              )}

              {state.liveMoment.participantMode === "manual" ? (
                <div className="flex justify-end">
                  <form action={clearParticipantMomentOverrideAction}>
                    <AdminActionStateFields lang={lang} section="run" instanceId={instanceId} />
                    <input name="agendaId" type="hidden" value={focusItem.id} />
                    <AdminSubmitButton className={adminGhostButtonClassName}>
                      {liveCopy.setAutoButton}
                    </AdminSubmitButton>
                  </form>
                </div>
              ) : null}
            </div>
          </ControlCard>
        ) : null}

        {teamModeEnabled && selectedAgendaOwnsHandoffControls ? (
          <HandoffMomentCard
            copy={copy}
            lang={lang}
            instanceId={instanceId}
            description={
              handoffIsLive ? copy.handoffMomentLiveDescription : copy.handoffMomentNextDescription
            }
            participantState={overviewState.participantState}
            slots={state.rotation.slots}
            jumpHref={handoffAgendaHref}
            rotationSignals={rotationSignals}
            teamChoices={state.teams.map((team) => ({ id: team.id, label: team.name }))}
          />
        ) : null}

        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-[var(--text-primary)]">{copy.agendaTimelineTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {copy.agendaIndexDescription}
            </p>
          </div>
          <div className="space-y-3">
            {state.agenda.map((item) => {
              const detailHref = buildAdminHref({
                lang,
                section: "run",
                instanceId,
                agendaItemId: item.id,
              });

              return (
                <TimelineRow
                  key={item.id}
                  item={item}
                  copy={copy}
                  lang={lang}
                  instanceId={instanceId}
                  detailHref={detailHref}
                />
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <ControlCard title={copy.signalTitle} description={copy.signalDescription}>
            <form action={addCheckpointFeedAction} className="grid gap-3 lg:grid-cols-2">
              <input name="lang" type="hidden" value={lang} />
              <input name="section" type="hidden" value="run" />
              <input name="instanceId" type="hidden" value={instanceId} />
              <select name="teamId" className={adminInputClassName}>
                {state.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <div>
                <FieldLabel htmlFor="signal-at">{copy.checkpointAtLabel}</FieldLabel>
                <input id="signal-at" name="at" defaultValue="11:15" className={`${adminInputClassName} mt-2`} />
              </div>
              <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)] lg:col-span-2">
                {copy.checkpointFormHint}
              </div>
              <div className="lg:col-span-2">
                <FieldLabel htmlFor="signal-changed">{copy.checkpointChangedLabel}</FieldLabel>
                <textarea id="signal-changed" name="checkpointChanged" rows={3} className={`${adminInputClassName} mt-2`} />
              </div>
              <div className="lg:col-span-2">
                <FieldLabel htmlFor="signal-verified">{copy.checkpointVerifiedLabel}</FieldLabel>
                <textarea id="signal-verified" name="checkpointVerified" rows={3} className={`${adminInputClassName} mt-2`} />
              </div>
              <div className="lg:col-span-2">
                <FieldLabel htmlFor="signal-next-step">{copy.checkpointNextStepLabel}</FieldLabel>
                <textarea id="signal-next-step" name="checkpointNextStep" rows={3} className={`${adminInputClassName} mt-2`} />
              </div>
              <AdminSubmitButton className={`${adminSecondaryButtonClassName} lg:col-span-2`}>
                {copy.addUpdateButton}
              </AdminSubmitButton>
            </form>
          </ControlCard>

          <ControlCard title={copy.completeChallengeTitle} description={copy.signalDescription}>
            <form action={completeChallengeAction} className="space-y-3">
              <input name="lang" type="hidden" value={lang} />
              <input name="section" type="hidden" value="run" />
              <input name="instanceId" type="hidden" value={instanceId} />
              <select name="teamId" className={adminInputClassName}>
                {state.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <select name="challengeId" className={adminInputClassName}>
                {state.challenges.map((challenge) => (
                  <option key={challenge.id} value={challenge.id}>
                    {challenge.title}
                  </option>
                ))}
              </select>
              <AdminSubmitButton className={adminSecondaryButtonClassName}>
                {copy.recordCompletionButton}
              </AdminSubmitButton>
            </form>
          </ControlCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ControlCard title={liveCopy.activePollTitle} description={pollSummary?.prompt ?? liveCopy.activePollEmpty}>
            {pollSummary ? (
              <div className="space-y-4">
                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                  {pollSummary.totalResponses} {liveCopy.activePollResponses}
                </div>
                <div className="space-y-3">
                  {pollSummary.options.map((option) => {
                    const width = pollSummary.totalResponses > 0 ? (option.count / pollSummary.totalResponses) * 100 : 0;
                    return (
                      <div key={option.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-primary)]">
                          <span>{option.label}</span>
                          <span className="text-[var(--text-muted)]">{option.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                          <div className="h-full rounded-full bg-[var(--text-primary)]" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end">
                  <form action={resetActivePollAction}>
                    <AdminActionStateFields lang={lang} section="run" instanceId={instanceId} />
                    <input name="agendaId" type="hidden" value={focusItem?.id ?? ""} />
                    <AdminSubmitButton className={adminGhostButtonClassName}>
                      {liveCopy.resetPollButton}
                    </AdminSubmitButton>
                  </form>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{liveCopy.activePollEmpty}</p>
            )}
          </ControlCard>

          <ControlCard title={liveCopy.feedbackTitle} description={liveCopy.feedbackDescription}>
            {participantFeedback.length > 0 ? (
              <div className="space-y-3">
                {participantFeedback.slice(0, 8).map((feedback) => {
                  const teamLabel =
                    feedback.teamId ? state.teams.find((team) => team.id === feedback.teamId)?.name ?? feedback.teamId : liveCopy.unknownTeam;
                  const kindLabel =
                    feedback.kind === "blocker" ? liveCopy.blockerLabel : liveCopy.questionLabel;
                  return (
                    <div key={feedback.id} className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            <span>{kindLabel}</span>
                            <span>·</span>
                            <span>{teamLabel}</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{feedback.message}</p>
                        </div>
                        <time className="shrink-0 text-xs text-[var(--text-muted)]" dateTime={feedback.createdAt}>
                          {new Date(feedback.createdAt).toLocaleTimeString(lang === "cs" ? "cs-CZ" : "en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {feedback.promotedTickerId ? (
                          <StatusPill label={liveCopy.promotedLabel} tone="live" />
                        ) : (
                          <form action={promoteParticipantFeedbackAction}>
                            <AdminActionStateFields lang={lang} section="run" instanceId={instanceId} />
                            <input name="agendaId" type="hidden" value={focusItem?.id ?? ""} />
                            <input name="feedbackId" type="hidden" value={feedback.id} />
                            <AdminSubmitButton className={adminSecondaryButtonClassName}>
                              {liveCopy.promoteButton}
                            </AdminSubmitButton>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{liveCopy.feedbackEmpty}</p>
            )}
          </ControlCard>
        </div>
      </div>
    </section>
  );
}

function MomentGuideCard({ item, copy }: { item: RichAgendaItem; copy: Copy }) {
  const runnerSections: Array<{ title: string; items: string[] }> = [
    { title: copy.agendaRunnerSayTitle, items: item.facilitatorRunner.say ?? [] },
    { title: copy.agendaRunnerShowTitle, items: item.facilitatorRunner.show ?? [] },
    { title: copy.agendaRunnerDoTitle, items: item.facilitatorRunner.do ?? [] },
    { title: copy.agendaRunnerWatchTitle, items: item.facilitatorRunner.watch ?? [] },
    { title: copy.agendaRunnerFallbackTitle, items: item.facilitatorRunner.fallback ?? [] },
  ].filter((section) => section.items.length > 0);

  if (
    !item.goal &&
    runnerSections.length === 0 &&
    (item.facilitatorPrompts?.length ?? 0) === 0 &&
    (item.watchFors?.length ?? 0) === 0 &&
    (item.checkpointQuestions?.length ?? 0) === 0
  ) {
    return null;
  }

  return (
    <ControlCard title={copy.agendaRunnerTitle} description={copy.agendaRunnerDescription}>
      <div className="space-y-5">
        {item.goal ? (
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {copy.agendaDetailGoalTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{item.goal}</p>
          </div>
        ) : null}

        {runnerSections.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {runnerSections.map((section) => (
              <div
                key={section.title}
                className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {section.title}
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-primary)]">
                  {section.items.map((entry) => (
                    <li key={entry}>• {entry}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </ControlCard>
  );
}

function HandoffMomentCard({
  copy,
  lang,
  instanceId,
  description,
  participantState,
  slots,
  jumpHref,
  rotationSignals,
  teamChoices,
}: {
  copy: Copy;
  lang: UiLanguage;
  instanceId: string;
  description: string;
  participantState: string;
  slots: RotationPlan["slots"];
  jumpHref?: string | null;
  rotationSignals: RotationSignal[];
  teamChoices: Array<{ id: string; label: string }>;
}) {
  const recentSignals = [...rotationSignals]
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt))
    .slice(0, 3);

  return (
    <ControlCard title={copy.handoffMomentTitle} description={description}>
      <div className="space-y-4">
        {jumpHref ? (
          <div className="flex flex-wrap justify-end gap-3">
            <AdminRouteLink className={adminGhostButtonClassName} href={jumpHref} scroll={false}>
              {copy.handoffMomentJumpButton}
            </AdminRouteLink>
          </div>
        ) : null}

        <form action={toggleRotationAction} className="space-y-4">
          <AdminActionStateFields lang={lang} section="run" instanceId={instanceId} />
          <div className="grid grid-cols-2 gap-3">
            <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`} name="revealed" value="true">
              {copy.unlockButton}
            </AdminSubmitButton>
            <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`} name="revealed" value="false">
              {copy.hideAgainButton}
            </AdminSubmitButton>
          </div>
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
            {copy.participantStatePrefix} {participantState}.
          </div>
        </form>

        <div className="space-y-2 border-t border-[var(--border)] pt-4">
          {slots.map((slot) => (
            <div key={`${slot.fromTeam}-${slot.toTeam}`} className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
              <p className="font-medium text-[var(--text-primary)]">
                {slot.fromTeam} → {slot.toTeam}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{slot.note}</p>
            </div>
          ))}
        </div>

        <details className="group space-y-3 border-t border-[var(--border)] pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {copy.rotationSignalTitle}
                <span className="ml-2 inline-flex min-w-[1.75rem] justify-center rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                  {rotationSignals.length}
                </span>
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{copy.rotationSignalDescription}</p>
            </div>
            <span
              aria-hidden="true"
              className="text-lg text-[var(--text-muted)] transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>

          <form action={captureRotationSignalAction} className="space-y-3 pt-1">
            <AdminActionStateFields lang={lang} section="run" instanceId={instanceId} />
            <div>
              <FieldLabel htmlFor="rotation-signal-free-text">{copy.rotationSignalFreeTextLabel}</FieldLabel>
              <textarea
                id="rotation-signal-free-text"
                name="freeText"
                required
                rows={4}
                placeholder={copy.rotationSignalFreeTextPlaceholder}
                className={`${adminInputClassName} mt-2`}
              />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <FieldLabel htmlFor="rotation-signal-tags">{copy.rotationSignalTagsLabel}</FieldLabel>
                <input
                  id="rotation-signal-tags"
                  name="tags"
                  placeholder={copy.rotationSignalTagsPlaceholder}
                  className={`${adminInputClassName} mt-2`}
                />
              </div>
              <div>
                <FieldLabel htmlFor="rotation-signal-team">{copy.rotationSignalTeamLabel}</FieldLabel>
                <select
                  id="rotation-signal-team"
                  name="teamId"
                  defaultValue=""
                  className={`${adminInputClassName} mt-2`}
                >
                  <option value="">{copy.rotationSignalTeamNone}</option>
                  {teamChoices.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <AdminSubmitButton className={adminPrimaryButtonClassName}>
                {copy.rotationSignalSubmit}
              </AdminSubmitButton>
            </div>
          </form>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {copy.rotationSignalListTitle}
            </p>
            {recentSignals.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">{copy.rotationSignalListEmpty}</p>
            ) : (
              <ul className="space-y-2">
                {recentSignals.map((signal) => {
                  const teamLabel = signal.teamId
                    ? teamChoices.find((team) => team.id === signal.teamId)?.label ?? signal.teamId
                    : null;
                  const preview =
                    signal.freeText.length > 140 ? `${signal.freeText.slice(0, 137)}…` : signal.freeText;
                  return (
                    <li
                      key={signal.id}
                      className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[var(--text-primary)]">{preview}</p>
                        <time className="shrink-0 text-xs text-[var(--text-muted)]" dateTime={signal.capturedAt}>
                          {new Date(signal.capturedAt).toLocaleTimeString(lang === "cs" ? "cs-CZ" : "en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                      {(teamLabel || signal.tags.length > 0) && (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                          {teamLabel ? <span>{teamLabel}</span> : null}
                          {signal.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--text-secondary)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </details>
      </div>
    </ControlCard>
  );
}

function TimelineRow({
  item,
  copy,
  lang,
  instanceId,
  detailHref,
}: {
  item: WorkshopState["agenda"][number];
  copy: Copy;
  lang: UiLanguage;
  instanceId: string;
  detailHref: string;
}) {
  const detailItem = item as RichAgendaItem;
  const statusLabel =
    item.status === "done"
      ? copy.agendaStatusDone
      : item.status === "current"
        ? copy.agendaStatusCurrent
        : copy.agendaStatusUpcoming;
  const markerClassName =
    item.status === "current"
      ? "bg-[var(--text-primary)]"
      : item.status === "done"
        ? "bg-[var(--text-muted)]"
        : "bg-transparent border border-[var(--border-strong)]";
  const rowClassName =
    item.status === "current"
      ? "border-[var(--highlight-border)] bg-[var(--highlight-surface)] shadow-[0_14px_28px_rgba(28,25,23,0.08)]"
      : item.status === "done"
        ? "border-[var(--border)] bg-[var(--surface-soft)]"
        : "border-[var(--border)] bg-transparent";

  return (
    <div
      data-agenda-item={item.id}
      className={`rounded-[22px] border px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] ${rowClassName}`}
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <span className={`mt-1 h-3 w-3 rounded-full ${markerClassName}`} />
          <span className="mt-2 h-full w-px bg-[var(--border)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--text-primary)]">
                {item.time} • {item.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {detailItem.roomSummary || item.description}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{statusLabel}</span>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {item.status !== "current" ? (
                  <form action={setAgendaAction}>
                    <AdminActionStateFields lang={lang} section="run" instanceId={instanceId} />
                    <input name="agendaId" type="hidden" value={item.id} />
                    <input name="returnTo" type="hidden" value="index" />
                    <AdminSubmitButton className={adminSecondaryButtonClassName}>
                      {copy.agendaMoveLiveHereButton}
                    </AdminSubmitButton>
                  </form>
                ) : null}
                <AdminRouteLink className={adminGhostButtonClassName} href={detailHref} scroll={false}>
                  {copy.openAgendaDetailButton}
                </AdminRouteLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
