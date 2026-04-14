import { AdminRouteLink } from "@/app/admin/admin-route-link";
import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { buildAdminHref } from "@/lib/admin-page-view-model";
import { buildPresenterRouteHref } from "@/lib/presenter-view-model";
import { buildRepoBlobUrl } from "@/lib/repo-links";
import type { RotationSignal } from "@/lib/runtime-contracts";
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
  captureRotationSignalAction,
  setAgendaAction,
} from "../../_actions/agenda";
import {
  renameAgendaItemAction,
  updateAgendaFieldAction,
} from "../../_actions/operations";
import {
  movePresenterSceneAction,
  removePresenterSceneAction,
  setDefaultPresenterSceneAction,
  togglePresenterSceneEnabledAction,
  updateSceneFieldAction,
} from "../../_actions/scenes";
import { toggleRotationAction } from "../../_actions/settings";
import { AdminActionStateFields } from "../admin-action-state-fields";
import { AddAgendaItemRow } from "../agenda/add-agenda-item-row";
import { AddSceneRow } from "../agenda/add-scene-row";
import type {
  RichAgendaItem,
  RichPresenterScene,
  SourceRef,
} from "../agenda/types";
import { ControlRoomPersistentSummary } from "../control-room-summary";
import { InlineField } from "../inline-field";
import { ViewTransitionCard } from "../view-transition-card";

type Copy = (typeof adminCopy)[UiLanguage];

const SCENE_TYPE_OPTIONS = [
  { value: "briefing" },
  { value: "demo" },
  { value: "participant-view" },
  { value: "checkpoint" },
  { value: "reflection" },
  { value: "transition" },
  { value: "custom" },
] as const;

const SCENE_INTENT_OPTIONS = [
  { value: "framing" },
  { value: "teaching" },
  { value: "demo" },
  { value: "walkthrough" },
  { value: "checkpoint" },
  { value: "transition" },
  { value: "reflection" },
  { value: "custom" },
] as const;

const SCENE_CHROME_PRESET_OPTIONS = [
  { value: "minimal" },
  { value: "agenda" },
  { value: "checkpoint" },
  { value: "participant" },
  { value: "team-trail" },
] as const;

type OverviewStateLike = {
  liveNowTitle: string;
  liveNowDescription: string;
  participantState: string;
};

function buildRepoSourceHref(path: string) {
  return buildRepoBlobUrl(path);
}

export function AgendaSection({
  lang,
  copy,
  instanceId,
  state,
  selectedAgendaItem,
  currentAgendaItem,
  nextAgendaItem,
  roomScenes,
  participantScenes,
  selectedRoomScene,
  selectedParticipantScene,
  selectedDefaultScene,
  showAgendaDetail,
  overviewState,
  rotationSignals,
  contextualHandoffItem,
  handoffIsLive,
  selectedAgendaOwnsHandoffControls,
  handoffAgendaHref,
  agendaIndexHref,
  liveAgendaHref,
  selectedAgendaProjectionHref,
  selectedAgendaParticipantMirrorHref,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  state: Pick<WorkshopState, "agenda" | "teams" | "rotation" | "workshopMeta">;
  selectedAgendaItem: RichAgendaItem | null | undefined;
  currentAgendaItem: RichAgendaItem | null | undefined;
  nextAgendaItem: RichAgendaItem | null | undefined;
  roomScenes: RichPresenterScene[];
  participantScenes: RichPresenterScene[];
  selectedRoomScene: RichPresenterScene | null;
  selectedParticipantScene: RichPresenterScene | null;
  selectedDefaultScene: RichPresenterScene | null;
  showAgendaDetail: boolean;
  overviewState: OverviewStateLike;
  rotationSignals: RotationSignal[];
  contextualHandoffItem: RichAgendaItem | null;
  handoffIsLive: boolean;
  selectedAgendaOwnsHandoffControls: boolean;
  handoffAgendaHref: string | null;
  agendaIndexHref: string;
  liveAgendaHref: string;
  selectedAgendaProjectionHref: string | null;
  selectedAgendaParticipantMirrorHref: string;
}) {
  return (
    <AdminPanel
      eyebrow={copy.workshopStateEyebrow}
      title={copy.agendaSectionTitle}
      description={copy.agendaSectionDescription}
    >
      <div className="space-y-6">
        {showAgendaDetail && selectedAgendaItem ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
                <span>{copy.agendaSectionTitle}</span>
                <span aria-hidden="true">/</span>
                <AdminRouteLink className="text-sm font-medium text-[var(--text-primary)] transition hover:text-[var(--text-secondary)]" href={agendaIndexHref}>
                  {copy.agendaTimelineTitle}
                </AdminRouteLink>
                <span aria-hidden="true">/</span>
                <span className="text-sm text-[var(--text-primary)]">
                  {selectedAgendaItem.time} • {selectedAgendaItem.title}
                </span>
              </nav>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{copy.phaseControlHint}</p>
            </div>

            <div className={`${adminHeroPanelClassName} p-5 sm:p-6`}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  label={
                    selectedAgendaItem.status === "current"
                      ? copy.liveNow
                      : selectedAgendaItem.status === "done"
                        ? copy.agendaStatusDone
                        : copy.agendaStatusUpcoming
                  }
                  tone={selectedAgendaItem.status === "current" ? "live" : "neutral"}
                />
                <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-xs text-[var(--hero-secondary)]">
                  {copy.runtimeCopyBadge}
                </span>
                <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-xs text-[var(--hero-secondary)]">
                  {selectedAgendaItem.kind === "custom" ? copy.customItemBadge : copy.blueprintItemBadge}
                </span>
              </div>
              <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-[var(--hero-muted)]">{copy.agendaCurrentTitle}</p>
              <h2 className="mt-3 flex flex-wrap items-baseline gap-x-3 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--hero-text)] sm:text-[2.4rem]">
                <InlineField
                  value={selectedAgendaItem.time}
                  fieldName="time"
                  label={copy.agendaFieldTime}
                  action={updateAgendaFieldAction}
                  hiddenFields={{
                    instanceId,
                    agendaId: selectedAgendaItem.id,
                    fieldName: "time",
                  }}
                />
                <span aria-hidden="true">•</span>
                <InlineField
                  value={selectedAgendaItem.title}
                  fieldName="title"
                  label={copy.agendaCurrentTitle}
                  action={renameAgendaItemAction}
                  hiddenFields={{
                    instanceId,
                    agendaId: selectedAgendaItem.id,
                  }}
                />
              </h2>
              <div className="mt-3 max-w-3xl text-sm leading-6 text-[var(--hero-secondary)]">
                <InlineField
                  value={selectedAgendaItem.roomSummary || selectedAgendaItem.description}
                  fieldName="roomSummary"
                  label={copy.agendaDetailRoomSummaryTitle}
                  mode="textarea"
                  action={updateAgendaFieldAction}
                  hiddenFields={{
                    instanceId,
                    agendaId: selectedAgendaItem.id,
                    fieldName: "roomSummary",
                  }}
                />
              </div>
              <div className="mt-3 max-w-3xl text-sm leading-6 text-[var(--hero-muted)]">
                <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[var(--hero-muted)]">
                  {copy.agendaDetailGoalTitle}
                </p>
                <InlineField
                  value={selectedAgendaItem.goal ?? ""}
                  fieldName="goal"
                  label={copy.agendaDetailGoalTitle}
                  mode="textarea"
                  action={updateAgendaFieldAction}
                  hiddenFields={{
                    instanceId,
                    agendaId: selectedAgendaItem.id,
                    fieldName: "goal",
                  }}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {selectedAgendaItem.id !== currentAgendaItem?.id ? (
                  <form action={setAgendaAction}>
                    <AdminActionStateFields lang={lang} section="agenda" instanceId={instanceId} />
                    <input name="agendaId" type="hidden" value={selectedAgendaItem.id} />
                    <input name="returnTo" type="hidden" value="detail" />
                    <AdminSubmitButton className={adminPrimaryButtonClassName}>{copy.agendaMoveLiveHereButton}</AdminSubmitButton>
                  </form>
                ) : selectedAgendaProjectionHref ? (
                  <a
                    className={`${adminPrimaryButtonClassName} inline-flex`}
                    href={selectedAgendaProjectionHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {copy.presenterOpenCurrentButton}
                  </a>
                ) : null}
                {selectedAgendaProjectionHref && selectedAgendaItem.id !== currentAgendaItem?.id ? (
                  <a
                    className={`${adminGhostButtonClassName} inline-flex`}
                    href={selectedAgendaProjectionHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {copy.presenterOpenCurrentButton}
                  </a>
                ) : null}
                <a
                  className={`${adminSecondaryButtonClassName} inline-flex`}
                  href={selectedAgendaParticipantMirrorHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.presenterOpenParticipantSurfaceButton}
                </a>
              </div>

              {currentAgendaItem && selectedAgendaItem.id !== currentAgendaItem.id ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  <AdminRouteLink className={adminGhostButtonClassName} href={liveAgendaHref}>
                    {copy.agendaJumpToLiveButton}
                  </AdminRouteLink>
                </div>
              ) : null}

              <div className="mt-5 rounded-[20px] border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--hero-muted)]">{copy.presenterCurrentSceneLabel}</p>
                <p className="mt-2 text-sm font-semibold text-[var(--hero-text)]">
                  {selectedDefaultScene?.label ?? copy.presenterNoSceneTitle}
                </p>
              </div>
            </div>

            {selectedAgendaOwnsHandoffControls ? (
              <HandoffMomentCard
                copy={copy}
                lang={lang}
                instanceId={instanceId}
                description={handoffIsLive ? copy.handoffMomentLiveDescription : copy.handoffMomentNextDescription}
                participantState={overviewState.participantState}
                slots={state.rotation.slots}
                rotationSignals={rotationSignals}
                teamChoices={state.teams.map((team) => ({ id: team.id, label: team.name }))}
              />
            ) : null}

            <AgendaItemDetail
              item={selectedAgendaItem}
              lang={lang}
              copy={copy}
              instanceId={instanceId}
            />

            <section className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-4 shadow-[0_14px_30px_rgba(28,25,23,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.agendaPresenterGroupTitle}</p>
                  <h3 className="mt-2 text-lg font-medium text-[var(--text-primary)]">
                    {selectedDefaultScene?.label ?? copy.presenterNoSceneTitle}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy.presenterCardDescription}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {roomScenes.length > 0 ? (
                  roomScenes.map((scene) => (
                    <PresenterSceneSummaryCard
                      key={scene.id}
                      scene={scene}
                      agendaItemId={selectedAgendaItem.id}
                      activeInstanceId={instanceId}
                      lang={lang}
                      copy={copy}
                      isDefault={selectedAgendaItem.defaultPresenterSceneId === scene.id}
                      isSelected={selectedRoomScene?.id === scene.id}
                    />
                  ))
                ) : (
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{copy.presenterNoSceneBody}</p>
                )}
                <AddSceneRow
                  lang={lang}
                  instanceId={instanceId}
                  agendaItemId={selectedAgendaItem.id}
                  addLabel={copy.presenterAddSceneButton}
                />
              </div>
            </section>

            <section className="rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-top),var(--card-bottom))] p-4 shadow-[0_14px_30px_rgba(28,25,23,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.participantSurfaceCardTitle}</p>
                  <h3 className="mt-2 text-lg font-medium text-[var(--text-primary)]">
                    {selectedParticipantScene?.label ?? copy.participantSurfaceCardDescription}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy.participantSurfaceCardDescription}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={selectedAgendaParticipantMirrorHref}
                    target="_blank"
                    className={adminSecondaryButtonClassName}
                    rel="noreferrer"
                  >
                    {copy.presenterOpenParticipantSurfaceButton}
                  </a>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {participantScenes.length > 0 ? (
                  participantScenes.map((scene) => (
                    <PresenterSceneSummaryCard
                      key={scene.id}
                      scene={scene}
                      agendaItemId={selectedAgendaItem.id}
                      activeInstanceId={instanceId}
                      lang={lang}
                      copy={copy}
                      isDefault={false}
                      isSelected={selectedParticipantScene?.id === scene.id}
                      participantOnly
                    />
                  ))
                ) : (
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{copy.participantSurfaceRecoveryHint}</p>
                )}
                <AddSceneRow
                  lang={lang}
                  instanceId={instanceId}
                  agendaItemId={selectedAgendaItem.id}
                  addLabel={copy.presenterAddSceneButton}
                />
              </div>
            </section>

            <details className="rounded-[22px] border border-[var(--border)] bg-[var(--card-top)] p-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-[var(--text-primary)]">
                {copy.agendaStorageGroupTitle}
              </summary>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
                <p>{copy.agendaSourceBody}</p>
                <p>
                  Repo seed: <code>dashboard/lib/workshop-data.ts</code>
                </p>
                <p>
                  File-mode runtime copy: <code>dashboard/data/&lt;instance&gt;/workshop-state.json</code>
                </p>
                <p>
                  Neon-mode runtime copy: <code>workshop_instances.workshop_state</code>
                </p>
              </div>
            </details>
          </>
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
              <div className={`${adminHeroPanelClassName} p-5 sm:p-6`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--hero-muted)]">
                    {copy.liveNow}
                  </span>
                  <span className="rounded-full border border-[var(--hero-border)] bg-[var(--hero-tile-bg)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--hero-secondary)]">
                    {state.workshopMeta.currentPhaseLabel}
                  </span>
                </div>
                <h2 className="mt-4 text-[1.85rem] font-semibold tracking-[-0.05em] text-[var(--hero-text)] sm:text-3xl">
                  {overviewState.liveNowTitle}
                </h2>
                <p className="mt-3 max-w-3xl text-[15px] leading-6 text-[var(--hero-secondary)]">{overviewState.liveNowDescription}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <ControlRoomPersistentSummary
                  label={copy.currentPhase}
                  value={currentAgendaItem ? `${currentAgendaItem.time} • ${currentAgendaItem.title}` : copy.presenterNoSceneTitle}
                />
                <ControlRoomPersistentSummary
                  label={copy.nextUp}
                  value={nextAgendaItem ? `${nextAgendaItem.time} • ${nextAgendaItem.title}` : copy.presenterNoSceneTitle}
                />
                <ControlRoomPersistentSummary label={copy.workspaceSignalLabel} value={overviewState.participantState} hint={state.rotation.scenario} />
              </div>
            </div>

            {contextualHandoffItem ? (
              <HandoffMomentCard
                copy={copy}
                lang={lang}
                instanceId={instanceId}
                description={handoffIsLive ? copy.handoffMomentLiveDescription : copy.handoffMomentNextDescription}
                participantState={overviewState.participantState}
                slots={state.rotation.slots}
                jumpHref={handoffAgendaHref}
                rotationSignals={rotationSignals}
                teamChoices={state.teams.map((team) => ({ id: team.id, label: team.name }))}
              />
            ) : null}

            <section className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-medium text-[var(--text-primary)]">{copy.agendaTimelineTitle}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy.agendaIndexDescription}</p>
                </div>
              </div>
              <div className="space-y-3">
                {state.agenda.map((item) => {
                  const detailHref = buildAdminHref({
                    lang,
                    section: "agenda",
                    instanceId,
                    agendaItemId: item.id,
                  });

                  return (
                    <TimelineRow
                      key={item.id}
                      item={item}
                      copy={copy}
                      detailed
                      detailHref={detailHref}
                      lang={lang}
                      instanceId={instanceId}
                    />
                  );
                })}
                <AddAgendaItemRow
                  lang={lang}
                  instanceId={instanceId}
                  afterItemId={state.agenda[state.agenda.length - 1]?.id ?? null}
                  addLabel={copy.addAgendaItemTitle}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </AdminPanel>
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
            <AdminRouteLink className={adminGhostButtonClassName} href={jumpHref}>
              {copy.handoffMomentJumpButton}
            </AdminRouteLink>
          </div>
        ) : null}

        <form action={toggleRotationAction} className="space-y-4">
          <AdminActionStateFields lang={lang} section="agenda" instanceId={instanceId} />
          <div className="grid grid-cols-2 gap-3">
            <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`} name="revealed" value="true">
              {copy.unlockButton}
            </AdminSubmitButton>
            <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`} name="revealed" value="false">
              {copy.hideAgainButton}
            </AdminSubmitButton>
          </div>
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
            {copy.participantStatePrefix} {participantState}.
          </div>
        </form>

        <div className="space-y-2 border-t border-[var(--border)] pt-4">
          {slots.map((slot) => (
            <div key={`${slot.fromTeam}-${slot.toTeam}`} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
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
            <AdminActionStateFields lang={lang} section="agenda" instanceId={instanceId} />
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
                      className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6"
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

function AgendaItemDetail({
  item,
  lang,
  copy,
  instanceId,
  compact = false,
}: {
  item: RichAgendaItem;
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  compact?: boolean;
}) {
  const listSections: Array<{ title: string; fieldName: "facilitatorPrompts" | "watchFors" | "checkpointQuestions"; items: string[] }> = [
    { title: copy.agendaFieldFacilitatorPrompts, fieldName: "facilitatorPrompts", items: item.facilitatorPrompts ?? [] },
    { title: copy.agendaFieldWatchFors, fieldName: "watchFors", items: item.watchFors ?? [] },
    { title: copy.agendaFieldCheckpointQuestions, fieldName: "checkpointQuestions", items: item.checkpointQuestions ?? [] },
  ];
  const runnerSections: Array<{ title: string; items: string[] }> = [
    { title: copy.agendaRunnerSayTitle, items: item.facilitatorRunner.say ?? [] },
    { title: copy.agendaRunnerShowTitle, items: item.facilitatorRunner.show ?? [] },
    { title: copy.agendaRunnerDoTitle, items: item.facilitatorRunner.do ?? [] },
    { title: copy.agendaRunnerWatchTitle, items: item.facilitatorRunner.watch ?? [] },
    { title: copy.agendaRunnerFallbackTitle, items: item.facilitatorRunner.fallback ?? [] },
  ].filter((section) => section.items.length > 0);

  // Progressive disclosure: the facilitator runner block, the editable
  // prompt / watch-for / checkpoint-question lists, and the source
  // materials block all collapse by default. The goal + room summary
  // duplicate content that already lives inline on the detail hero, so
  // they're gone from the detail body entirely — the hero is the
  // canonical surface. Each details element stays `open` if the user
  // explicitly clicks to expand it.
  return (
    <div className={`${compact ? "mt-4 space-y-3" : "space-y-3"}`}>
      <details className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
        <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]">
          {copy.agendaRunnerTitle}
        </summary>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy.agendaRunnerDescription}</p>
        <div className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.agendaRunnerGoalTitle}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{item.facilitatorRunner.goal}</p>
        </div>
        {runnerSections.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {runnerSections.map((section) => (
              <div key={section.title} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{section.title}</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-primary)]">
                  {section.items.map((value) => (
                    <li key={value}>• {value}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </details>

      <details className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
        <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]">
          {copy.agendaFieldFacilitatorPrompts} · {copy.agendaFieldWatchFors} · {copy.agendaFieldCheckpointQuestions}
        </summary>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {listSections.map((section) => (
            <div key={section.fieldName} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{section.title}</p>
              <div className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">
                <InlineField
                  value={section.items.join("\n")}
                  fieldName={section.fieldName}
                  label={section.title}
                  mode="textarea"
                  placeholder={section.title}
                  action={updateAgendaFieldAction}
                  hiddenFields={{
                    instanceId,
                    agendaId: item.id,
                    fieldName: section.fieldName,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </details>

      {(item.sourceRefs ?? []).length > 0 ? (
        <details className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
          <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]">
            {copy.agendaDetailSourceMaterialTitle}
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(item.sourceRefs ?? []).map((ref) => {
              const href = buildRepoSourceHref(ref.path);
              const className =
                "flex items-center justify-between rounded-[16px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]";

              if (!href) {
                return (
                  <div key={`${ref.path}-${ref.label}`} className={className}>
                    <span className="font-medium">{ref.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">{ref.path}</span>
                  </div>
                );
              }

              return (
                <a key={`${ref.path}-${ref.label}`} href={href} target="_blank" rel="noreferrer" className={className}>
                  <span className="font-medium">{ref.label}</span>
                  <span className="text-xs text-[var(--text-muted)]">{copy.openRepoLabel}</span>
                </a>
              );
            })}
          </div>
          {!compact ? (
            <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
              {lang === "cs" ? "Dashboard a zdrojové materiály mají sdílet stejný agenda backbone." : "Dashboard and source materials should share the same agenda backbone."}
            </p>
          ) : null}
        </details>
      ) : null}
    </div>
  );
}

function PresenterSceneSummaryCard({
  scene,
  agendaItemId,
  activeInstanceId,
  lang,
  copy,
  isDefault,
  isSelected,
  participantOnly = false,
}: {
  scene: RichPresenterScene;
  agendaItemId: string;
  activeInstanceId: string;
  lang: UiLanguage;
  copy: Copy;
  isDefault: boolean;
  isSelected: boolean;
  participantOnly?: boolean;
}) {
  const sceneBlocks = scene.blocks ?? [];
  const surfaceLabel = participantOnly ? copy.participantSurfaceCardTitle : copy.presenterCardTitle;
  const sceneEditorHref = buildAdminHref({
    lang,
    section: "agenda",
    instanceId: activeInstanceId,
    agendaItemId,
    sceneId: scene.id,
    overlay: "scene-edit",
  });

  const presenterHref = buildPresenterRouteHref({
    lang,
    instanceId: activeInstanceId,
    agendaItemId,
    sceneId: scene.id,
  });
  const morphName = `scene-${agendaItemId}-${scene.id}`;

  return (
    <ViewTransitionCard name={morphName}>
    <div
      data-agenda-scene-card={scene.id}
      className={`rounded-[20px] border p-4 ${
        isSelected ? "border-[var(--text-primary)] bg-[var(--surface)] shadow-[0_14px_28px_rgba(28,25,23,0.08)]" : "border-[var(--border)] bg-[var(--surface-soft)]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[var(--text-primary)]">
            <InlineField
              value={scene.label}
              fieldName="label"
              label={copy.sceneFieldLabel}
              action={updateSceneFieldAction}
              hiddenFields={{
                instanceId: activeInstanceId,
                agendaItemId,
                sceneId: scene.id,
                fieldName: "label",
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 text-sm leading-6 text-[var(--text-secondary)]">
            <span>{surfaceLabel}</span>
            <span aria-hidden="true">•</span>
            <InlineField
              value={scene.sceneType}
              fieldName="sceneType"
              label={copy.sceneFieldType}
              mode="select"
              options={SCENE_TYPE_OPTIONS}
              action={updateSceneFieldAction}
              hiddenFields={{
                instanceId: activeInstanceId,
                agendaItemId,
                sceneId: scene.id,
                fieldName: "sceneType",
              }}
            />
            {scene.intent ? (
              <>
                <span aria-hidden="true">•</span>
                <InlineField
                  value={scene.intent}
                  fieldName="intent"
                  label={copy.sceneFieldIntent}
                  mode="select"
                  options={SCENE_INTENT_OPTIONS}
                  action={updateSceneFieldAction}
                  hiddenFields={{
                    instanceId: activeInstanceId,
                    agendaItemId,
                    sceneId: scene.id,
                    fieldName: "intent",
                  }}
                />
              </>
            ) : null}
            {scene.chromePreset ? (
              <>
                <span aria-hidden="true">•</span>
                <InlineField
                  value={scene.chromePreset}
                  fieldName="chromePreset"
                  label={copy.sceneFieldChromePreset}
                  mode="select"
                  options={SCENE_CHROME_PRESET_OPTIONS}
                  action={updateSceneFieldAction}
                  hiddenFields={{
                    instanceId: activeInstanceId,
                    agendaItemId,
                    sceneId: scene.id,
                    fieldName: "chromePreset",
                  }}
                />
              </>
            ) : null}
            {isDefault ? <span>• {copy.presenterCurrentSceneLabel}</span> : null}
            {!scene.enabled ? <span>• {copy.presenterSceneDisabled}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminRouteLink href={presenterHref} className={adminGhostButtonClassName}>
            {participantOnly ? copy.presenterOpenParticipantButton : copy.presenterOpenSelectedScene}
          </AdminRouteLink>
          <a
            href={presenterHref}
            target="_blank"
            rel="noreferrer"
            aria-label="otevřít v novém okně"
            className={`${adminGhostButtonClassName} px-2`}
          >
            ↗
          </a>
          <details className="group relative">
            <summary className="inline-flex cursor-pointer list-none items-center rounded-[10px] px-2 py-1 text-xs lowercase text-[var(--text-muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]">
              více
            </summary>
            <div className="absolute right-0 z-10 mt-2 flex w-56 flex-col gap-1 rounded-[18px] border border-[var(--border-strong)] bg-[var(--surface)] p-2 shadow-[0_18px_36px_rgba(28,25,23,0.12)]">
              <form action={movePresenterSceneAction}>
                <AdminActionStateFields lang={lang} section="agenda" instanceId={activeInstanceId} />
                <input name="agendaItemId" type="hidden" value={agendaItemId} />
                <input name="sceneId" type="hidden" value={scene.id} />
                <input name="direction" type="hidden" value="up" />
                <AdminSubmitButton className={`${adminGhostButtonClassName} w-full justify-start`}>
                  ↑ {copy.presenterMoveSceneUpButton}
                </AdminSubmitButton>
              </form>
              <form action={movePresenterSceneAction}>
                <AdminActionStateFields lang={lang} section="agenda" instanceId={activeInstanceId} />
                <input name="agendaItemId" type="hidden" value={agendaItemId} />
                <input name="sceneId" type="hidden" value={scene.id} />
                <input name="direction" type="hidden" value="down" />
                <AdminSubmitButton className={`${adminGhostButtonClassName} w-full justify-start`}>
                  ↓ {copy.presenterMoveSceneDownButton}
                </AdminSubmitButton>
              </form>
              {!isDefault ? (
                <form action={setDefaultPresenterSceneAction}>
                  <AdminActionStateFields lang={lang} section="agenda" instanceId={activeInstanceId} />
                  <input name="agendaItemId" type="hidden" value={agendaItemId} />
                  <input name="sceneId" type="hidden" value={scene.id} />
                  <AdminSubmitButton className={`${adminGhostButtonClassName} w-full justify-start`}>
                    {copy.presenterSetDefaultSceneButton}
                  </AdminSubmitButton>
                </form>
              ) : null}
              <form action={togglePresenterSceneEnabledAction}>
                <AdminActionStateFields lang={lang} section="agenda" instanceId={activeInstanceId} />
                <input name="agendaItemId" type="hidden" value={agendaItemId} />
                <input name="sceneId" type="hidden" value={scene.id} />
                <input name="enabled" type="hidden" value={scene.enabled ? "false" : "true"} />
                <AdminSubmitButton className={`${adminGhostButtonClassName} w-full justify-start`}>
                  {scene.enabled ? copy.presenterHideSceneButton : copy.presenterShowSceneButton}
                </AdminSubmitButton>
              </form>
              <AdminRouteLink
                href={sceneEditorHref}
                className={`${adminGhostButtonClassName} w-full justify-start`}
              >
                blocks / sources →
              </AdminRouteLink>
              <form action={removePresenterSceneAction}>
                <AdminActionStateFields lang={lang} section="agenda" instanceId={activeInstanceId} />
                <input name="agendaItemId" type="hidden" value={agendaItemId} />
                <input name="sceneId" type="hidden" value={scene.id} />
                <AdminSubmitButton className={`${adminGhostButtonClassName} w-full justify-start text-[var(--border-strong)]`}>
                  {copy.presenterRemoveSceneButton}
                </AdminSubmitButton>
              </form>
            </div>
          </details>
        </div>
      </div>
      <div className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        <InlineField
          value={scene.body ?? ""}
          fieldName="body"
          label={copy.sceneFieldBody}
          mode="textarea"
          action={updateSceneFieldAction}
          hiddenFields={{
            instanceId: activeInstanceId,
            agendaItemId,
            sceneId: scene.id,
            fieldName: "body",
          }}
        />
      </div>
      {sceneBlocks.length > 0 ? (
        <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.presenterRoomBlocksTitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sceneBlocks.map((block) => (
              <span
                key={block.id}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]"
              >
                {block.type}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.presenterFacilitatorNotesTitle}</p>
        <div className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">
          <InlineField
            value={(scene.facilitatorNotes ?? []).join("\n")}
            fieldName="facilitatorNotes"
            label={copy.presenterFacilitatorNotesTitle}
            mode="textarea"
            placeholder={copy.presenterFacilitatorNotesTitle}
            action={updateSceneFieldAction}
            hiddenFields={{
              instanceId: activeInstanceId,
              agendaItemId,
              sceneId: scene.id,
              fieldName: "facilitatorNotes",
            }}
          />
        </div>
      </div>
      {(scene.sourceRefs ?? []).length > 0 ? (
        <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.agendaDetailSourceMaterialTitle}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(scene.sourceRefs ?? []).map((ref: SourceRef) => {
            const href = buildRepoSourceHref(ref.path);
            const className =
              "flex items-center justify-between rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--card-top)]";

            if (!href) {
              return (
                <div key={`${ref.path}-${ref.label}`} className={className}>
                  <span className="font-medium">{ref.label}</span>
                  <span className="text-xs text-[var(--text-muted)]">{ref.path}</span>
                </div>
              );
            }

            return (
              <a key={`${ref.path}-${ref.label}`} href={href} target="_blank" rel="noreferrer" className={className}>
                <span className="font-medium">{ref.label}</span>
                <span className="text-xs text-[var(--text-muted)]">{copy.openLinkLabel}</span>
              </a>
            );
          })}
          </div>
        </div>
      ) : null}
    </div>
    </ViewTransitionCard>
  );
}

function TimelineRow({
  item,
  copy,
  lang,
  instanceId,
  detailHref,
  detailed = false,
}: {
  item: WorkshopState["agenda"][number];
  copy: Copy;
  lang: UiLanguage;
  instanceId: string;
  detailHref: string;
  detailed?: boolean;
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
              {detailed || item.status === "current" ? (
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{detailItem.roomSummary || item.description}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{statusLabel}</span>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {item.status !== "current" ? (
                  <form action={setAgendaAction}>
                    <AdminActionStateFields lang={lang} section="agenda" instanceId={instanceId} />
                    <input name="agendaId" type="hidden" value={item.id} />
                    <input name="returnTo" type="hidden" value="index" />
                    <AdminSubmitButton className={adminSecondaryButtonClassName}>{copy.agendaMoveLiveHereButton}</AdminSubmitButton>
                  </form>
                ) : null}
                <AdminRouteLink className={adminGhostButtonClassName} href={detailHref}>
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

