import type { ReactNode } from "react";
import {
  buildParticipantCheckpointFeed,
  buildParticipantHomeState,
  buildParticipantPanelState,
  buildSharedRoomNotes,
  type ParticipantReferenceGroup,
} from "@/lib/public-page-view-model";
import type { ParticipantTeamLookup } from "@/lib/event-access";
import type { ParticipantRecord, ParticipantSession } from "@/lib/runtime-contracts";
import { publicCopy, type UiLanguage } from "@/lib/ui-language";
import type { Challenge, PresenterBlock, ProjectBrief, Team, WorkshopState } from "@/lib/workshop-data";
import { CopyActionButton } from "./copy-action-button";
import { ParticipantCheckpointFeed } from "./participant-checkpoint-feed";
import { ParticipantCheckInForm } from "./participant-check-in-form";
import { ParticipantFeedbackForm } from "./participant-feedback-form";
import { SubmitButton } from "./submit-button";
import { ParticipantPollForm } from "./participant-poll-form";

type AgendaItem = WorkshopState["agenda"][number];
type PublicNote = WorkshopState["ticker"][number];
type LiveMoment = WorkshopState["liveMoment"];

export function ParticipantRoomSurface({
  copy,
  lang,
  workshopContextLine,
  currentAgendaItem,
  nextAgendaItem,
  liveMoment,
  agenda,
  participantSession,
  participantTeams,
  activeParticipantTeam,
  activeParticipant,
  briefs,
  challenges,
  publicNotes,
  referenceGroups,
  rotationRevealed,
  logoutAction,
  checkInEnabled = true,
}: {
  copy: (typeof publicCopy)[UiLanguage];
  lang: UiLanguage;
  workshopContextLine: string;
  currentAgendaItem: AgendaItem | undefined;
  nextAgendaItem: AgendaItem | undefined;
  liveMoment: LiveMoment;
  agenda: WorkshopState["agenda"];
  participantSession: ParticipantSession;
  participantTeams: ParticipantTeamLookup | null;
  activeParticipantTeam: Team | null;
  activeParticipant: ParticipantRecord | null;
  briefs: ProjectBrief[];
  challenges: Challenge[];
  publicNotes: PublicNote[];
  referenceGroups: ParticipantReferenceGroup[];
  rotationRevealed: boolean;
  logoutAction?: ((formData: FormData) => Promise<void>) | undefined;
  checkInEnabled?: boolean;
}) {
  const sectionCopy = getParticipantSurfaceCopy(lang);
  const participantPanel = buildParticipantPanelState({
    copy,
    lang,
    currentAgendaItem,
    nextAgendaItem,
    liveMoment,
    participantSession,
    rotationRevealed,
  });
  const homeState = buildParticipantHomeState({
    lang,
    currentAgendaItem,
    participantTeams,
    activeParticipantTeam,
    activeParticipantName: activeParticipant?.displayName ?? null,
    briefs,
    challenges,
  });
  const sharedNotes = buildSharedRoomNotes(publicNotes);
  const checkpointFeed = buildParticipantCheckpointFeed({
    agenda,
    lang,
    participantTeams,
    activeParticipantTeam,
    activeParticipantId: activeParticipant?.id ?? null,
    activeParticipantName: activeParticipant?.displayName ?? null,
    currentPhaseId: currentAgendaItem?.id ?? null,
  });
  const defaultFeedScope = activeParticipantTeam ? "team" : "phase";
  const activeTeamCards = activeParticipantTeam
    ? homeState.teamCards.filter((team) => team.id === activeParticipantTeam.id)
    : homeState.teamCards;
  const visibleRoomNotes = sharedNotes.slice(0, 2);

  return (
    <>
      {workshopContextLine ? (
        <p className="border-b border-[var(--border)] py-3 text-sm lowercase text-[var(--text-muted)]">
          {workshopContextLine}
        </p>
      ) : null}

      <section className="border-b border-[var(--border)] py-10" id="next">
        <div
          className="dashboard-motion-card relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-soft)] backdrop-blur sm:p-7"
          style={{ viewTransitionName: "room-access" }}
        >
          {/* copy-editor: ignore decorative gradient class values */}
          <div className="pointer-events-none absolute -left-10 top-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,var(--ambient-left),transparent_72%)] blur-3xl dashboard-drift" />
          {/* copy-editor: ignore decorative gradient class values */}
          <div className="pointer-events-none absolute right-[-3rem] top-8 h-44 w-44 rounded-full bg-[radial-gradient(circle,var(--accent-surface),transparent_74%)] opacity-[0.08] blur-3xl dashboard-drift-reverse" />
          {/* copy-editor: ignore decorative gradient class values */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,var(--surface-soft),transparent_62%)] dashboard-sheen" />

          <SectionLabel>{copy.participantEyebrow}</SectionLabel>
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)]">
            <div className="dashboard-motion-card rounded-[22px] border border-[var(--border-strong)] bg-[var(--surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{sectionCopy.nextEyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                {homeState.showBuildPhaseOneProofSlice ? sectionCopy.buildPhaseOneTitle : participantPanel.currentPhaseTitle}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
                {homeState.showBuildPhaseOneProofSlice
                  ? sectionCopy.buildPhaseOneBody
                  : participantPanel.currentPhaseDescription ?? participantPanel.body}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {homeState.primaryActions.map((action, index) => (
                  <a
                    key={action.href}
                    className={`dashboard-motion-button rounded-full px-4 py-2 text-sm font-medium transition ${
                      index === 0
                        ? "border border-[var(--border-strong)] bg-[var(--surface-panel)] text-[var(--text-primary)] hover:border-[var(--text-primary)]"
                        : "border border-[var(--border)] bg-[var(--surface-panel)] text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                    }`}
                    href={action.href}
                  >
                    {action.label}
                  </a>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MiniMetric label={participantPanel.currentPhaseLabel} value={participantPanel.currentPhaseTitle} />
                <MiniMetric label={copy.metricNext} value={participantPanel.nextPhaseTitle ?? copy.metricReflection} />
                <MiniMetric label={participantPanel.sessionUntilLabel} value={participantPanel.sessionUntilValue} />
              </div>
            </div>

            <div className="space-y-4">
              <ParticipantBlockCard title={sectionCopy.contextTitle}>
                <div className="grid gap-3">
                  <KeyValuePair label={homeState.workingContext.modeLabel} value={homeState.workingContext.modeValue} />
                  {homeState.workingContext.teamLabel ? (
                    <KeyValuePair label={sectionCopy.teamLabel} value={homeState.workingContext.teamLabel} />
                  ) : null}
                  {homeState.workingContext.participantLabel ? (
                    <KeyValuePair label={sectionCopy.participantLabel} value={homeState.workingContext.participantLabel} />
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{homeState.workingContext.note}</p>
              </ParticipantBlockCard>

              <ParticipantBlockCard title={copy.sharedRoomNotes}>
                {visibleRoomNotes.length > 0 ? (
                  <div className="space-y-3">
                    {visibleRoomNotes.map((note) => (
                      <div
                        key={note}
                        className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-3 text-sm leading-6 text-[var(--text-secondary)] whitespace-pre-line"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{copy.noRoomData}</p>
                )}
              </ParticipantBlockCard>
            </div>
          </div>

          {!homeState.showBuildPhaseOneProofSlice && participantPanel.guidanceBlocks.length > 0 ? (
            <div className="mt-6 space-y-4">
              <SectionLabel>{participantPanel.guidanceLabel ?? sectionCopy.nextEyebrow}</SectionLabel>
              <ParticipantGuidanceBlocks blocks={participantPanel.guidanceBlocks} copy={copy} participantPanel={participantPanel} />
            </div>
          ) : null}
          {!homeState.showBuildPhaseOneProofSlice && participantPanel.guidanceCtaLabel ? (
            <GuidanceCta href={participantPanel.guidanceCtaHref} label={participantPanel.guidanceCtaLabel} openLabel={copy.openLinkLabel} />
          ) : null}

          {!homeState.showBuildPhaseOneProofSlice &&
          (participantPanel.activePoll || participantPanel.feedbackEnabled) ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {participantPanel.activePoll ? (
                <ParticipantPollForm
                  poll={participantPanel.activePoll}
                  labels={{
                    title: sectionCopy.pollTitle,
                    body: sectionCopy.pollBody,
                    submitLabel: sectionCopy.pollSubmit,
                    missingOption: sectionCopy.pollMissingOption,
                    successMessage: sectionCopy.pollSuccess,
                    genericError: sectionCopy.pollGenericError,
                  }}
                />
              ) : null}
              {participantPanel.feedbackEnabled ? (
                <ParticipantFeedbackForm
                  labels={{
                    title: sectionCopy.feedbackTitle,
                    body: sectionCopy.feedbackBody,
                    kindLabel: sectionCopy.feedbackKindLabel,
                    blockerLabel: sectionCopy.feedbackBlockerLabel,
                    questionLabel: sectionCopy.feedbackQuestionLabel,
                    messageLabel: sectionCopy.feedbackMessageLabel,
                    messagePlaceholder: sectionCopy.feedbackMessagePlaceholder,
                    submitLabel: sectionCopy.feedbackSubmit,
                    missingMessage: sectionCopy.feedbackMissingMessage,
                    successMessage: sectionCopy.feedbackSuccess,
                    genericError: sectionCopy.feedbackGenericError,
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-b border-[var(--border)] py-10" id="build">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(19rem,0.94fr)]">
          <div className="space-y-4">
            <ParticipantBlockCard title={sectionCopy.buildTitle}>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">{sectionCopy.buildBody}</p>
            </ParticipantBlockCard>

            <ParticipantBlockCard title={homeState.highlightedBrief ? sectionCopy.briefTitleActive : sectionCopy.briefTitleRoom}>
              <div id="build-briefs">
                <p className="text-sm leading-7 text-[var(--text-secondary)]">
                  {homeState.highlightedBrief ? sectionCopy.briefBodyActive : sectionCopy.briefBodyRoom}
                </p>
                <div className="mt-4 space-y-3">
                  {homeState.visibleBriefs.map((brief) => (
                    <div key={brief.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{brief.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{brief.problem}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ParticipantBlockCard>

            <ParticipantBlockCard title={sectionCopy.materialsTitle}>
              <div id="build-materials">
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{sectionCopy.materialsBody}</p>
                {activeTeamCards.length > 0 ? (
                  <div className="mt-4 grid gap-4">
                    {activeTeamCards.map((team) => (
                      <article
                        key={team.id}
                        className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-panel)] p-4"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <div>
                            <h3 className="text-base font-medium text-[var(--text-primary)]">{team.name}</h3>
                            <p className="text-sm text-[var(--text-muted)]">
                              {resolveBriefTitle(briefs, team.projectBriefId)}
                              {team.anchor ? ` · ${team.anchor}` : ""}
                            </p>
                          </div>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{team.id}</span>
                        </div>
                        {team.members.length > 0 ? (
                          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{team.members.join(", ")}</p>
                        ) : null}
                        {team.repoUrl ? (
                          <>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <a
                                className="dashboard-motion-button inline-flex items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--text-primary)] hover:bg-[var(--surface-panel)]"
                                href={team.repoUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {sectionCopy.openRepo}
                              </a>
                              <CopyActionButton
                                className="dashboard-motion-button rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)]"
                                value={team.repoUrl}
                                label={sectionCopy.copyRepoUrl}
                                copiedLabel={sectionCopy.copied}
                              />
                              <CopyActionButton
                                className="dashboard-motion-button rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)]"
                                value={`git clone ${team.repoUrl}`}
                                label={sectionCopy.copyCloneCommand}
                                copiedLabel={sectionCopy.copied}
                              />
                            </div>
                            <a
                              className="dashboard-motion-card dashboard-motion-link mt-3 block break-all rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                              href={team.repoUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {team.repoUrl}
                            </a>
                          </>
                        ) : (
                          <p className="mt-4 rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-muted)]">
                            {copy.noRoomData}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{copy.noRoomData}</p>
                )}
              </div>
            </ParticipantBlockCard>
          </div>

          <div className="space-y-4">
            <ParticipantBlockCard title={sectionCopy.roomToolsTitle}>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">{sectionCopy.roomToolsBody}</p>
            </ParticipantBlockCard>

            {homeState.teamCards.length > 0 ? (
              <div id="checkpoint-capture">
                <ParticipantCheckInForm
                  initialTeamId={activeParticipantTeam?.id ?? null}
                  teamOptions={homeState.teamCards.map((team) => ({
                    id: team.id,
                    label: team.name,
                  }))}
                  currentPhaseId={currentAgendaItem?.id ?? null}
                  activeParticipantName={activeParticipant?.displayName ?? null}
                  disabled={!checkInEnabled}
                  labels={{
                    title: sectionCopy.captureTitle,
                    body: sectionCopy.captureBody,
                    changedLabel: sectionCopy.captureChangedLabel,
                    changedPlaceholder: sectionCopy.captureChangedPlaceholder,
                    verifiedLabel: sectionCopy.captureVerifiedLabel,
                    verifiedPlaceholder: sectionCopy.captureVerifiedPlaceholder,
                    nextStepLabel: sectionCopy.captureNextStepLabel,
                    nextStepPlaceholder: sectionCopy.captureNextStepPlaceholder,
                    participantPrefix: sectionCopy.participantLabel,
                    teamLabel: sectionCopy.teamLabel,
                    submitLabel: sectionCopy.captureSubmit,
                    successMessage: sectionCopy.captureSuccess,
                    missingTeam: sectionCopy.captureMissingTeam,
                    missingStructuredFields: sectionCopy.captureMissing,
                    missingPhase: copy.teamCheckInMissingPhase,
                    genericError: copy.teamCheckInGenericError,
                  }}
                />
              </div>
            ) : (
              <ParticipantBlockCard title={sectionCopy.captureTitle}>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{sectionCopy.captureNeedsTeam}</p>
              </ParticipantBlockCard>
            )}

            <ParticipantCheckpointFeed
              items={checkpointFeed}
              defaultScope={defaultFeedScope}
              showMineFilter={Boolean(activeParticipant)}
              labels={{
                title: sectionCopy.feedTitle,
                body: sectionCopy.feedBody,
                room: sectionCopy.feedRoom,
                phase: sectionCopy.feedPhase,
                team: sectionCopy.feedTeam,
                mine: sectionCopy.feedMine,
                empty: sectionCopy.feedEmpty,
                emptyMine: sectionCopy.feedEmptyMine,
                changed: sectionCopy.captureChangedLabel,
                verified: sectionCopy.captureVerifiedLabel,
                nextStep: sectionCopy.captureNextStepLabel,
                legacy: sectionCopy.feedLegacy,
              }}
            />
          </div>
        </div>
      </section>

      <section className="py-10" id="reference">
        <div className="space-y-4">
          <ParticipantBlockCard title={sectionCopy.referenceTitle}>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">{sectionCopy.referenceBody}</p>
          </ParticipantBlockCard>

          <div className="grid gap-4 lg:grid-cols-3">
            {referenceGroups.map((group) => (
              <ParticipantBlockCard key={group.id} title={group.title}>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{group.description}</p>
                <div className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <ActionablePanelLink
                      key={item.id}
                      href={item.href}
                      label={item.label}
                      description={item.description}
                      openLabel={copy.openLinkLabel}
                    />
                  ))}
                </div>
              </ParticipantBlockCard>
            ))}
          </div>
        </div>
      </section>

      {logoutAction ? (
        <footer className="flex items-center justify-between gap-4 border-t border-[var(--border)] py-6">
          <p className="text-sm text-[var(--text-muted)]">
            {participantPanel.sessionUntilLabel}: {participantPanel.sessionUntilValue}
          </p>
          <form action={logoutAction}>
            <input name="lang" type="hidden" value={lang} />
            <SubmitButton
              className="dashboard-motion-button rounded-full border border-[var(--border-strong)] px-5 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {copy.leaveRoomContext}
            </SubmitButton>
          </form>
        </footer>
      ) : null}
    </>
  );
}

function getParticipantSurfaceCopy(lang: UiLanguage) {
  if (lang === "en") {
    return {
      nextEyebrow: "next",
      buildPhaseOneTitle: "Agree on the brief. Open the repo. Draft the first map.",
      buildPhaseOneBody:
        "The browser path is enough to start. If your local agent setup is ready, use the skill as the faster path, not the required one.",
      contextTitle: "compact working context",
      teamLabel: "team",
      participantLabel: "participant",
      buildTitle: "materials",
      buildBody:
        "Keep the participant surface narrow: brief, repo, materials, and the smallest room signal you need right now.",
      briefTitleActive: "your brief",
      briefTitleRoom: "prepared briefs in this room",
      briefBodyActive: "Your assigned brief is visible here so the workshop does not depend on the skill path first.",
      briefBodyRoom: "Prepared briefs stay visible here so teams can confirm direction before local setup is perfect.",
      materialsTitle: "team materials",
      materialsBody: "Open the repo, copy what you need, and keep the repo move secondary to the brief and first verification step.",
      openRepo: "Open repo",
      copyRepoUrl: "Copy repo URL",
      copyCloneCommand: "Copy clone command",
      copied: "Copied",
      roomToolsTitle: "room signal tools",
      roomToolsBody:
        "Keep these available, but secondary. Use them only when you need to leave a short structured trail for the room or the next team.",
      captureTitle: "structured checkpoint",
      captureBody: "Write one short evidence item the room can reuse: what changed, what verifies it, and the next safe move.",
      captureChangedLabel: "what changed",
      captureChangedPlaceholder: "Name the concrete change your team made.",
      captureVerifiedLabel: "what verifies it",
      captureVerifiedPlaceholder: "Say what evidence or check makes this credible.",
      captureNextStepLabel: "next safe move",
      captureNextStepPlaceholder: "Tell the next person what to do first.",
      captureSubmit: "Record checkpoint",
      captureSuccess: "Checkpoint saved.",
      captureMissingTeam: "Choose a team first.",
      captureMissing: "Fill all three checkpoint fields.",
      captureNeedsTeam: "Bind the participant to a team first, then write the checkpoint from that team context.",
      feedTitle: "live checkpoint feed",
      feedBody: "Chronological, attributable residue only. This is for short structured evidence, not room chat.",
      feedRoom: "room",
      feedPhase: "current phase",
      feedTeam: "my team",
      feedMine: "mine",
      feedEmpty: "No checkpoints match this scope yet.",
      feedEmptyMine: "You have not written a structured checkpoint yet.",
      feedLegacy: "legacy note",
      referenceTitle: "reference",
      referenceBody: "This is the main reference shelf: workshop materials first, then setup and plugins, then the external reads and published HTMLs.",
      pollTitle: "room signal",
      pollBody: "Pick one option only. The facilitator sees room-safe aggregate only.",
      pollSubmit: "Send signal",
      pollMissingOption: "Choose one option first.",
      pollSuccess: "Signal sent.",
      pollGenericError: "Could not send the room signal.",
      feedbackTitle: "facilitator lane",
      feedbackBody: "Use this for a blocker or a facilitator question. It stays private unless the facilitator explicitly promotes it.",
      feedbackKindLabel: "kind",
      feedbackBlockerLabel: "blocker",
      feedbackQuestionLabel: "question",
      feedbackMessageLabel: "message",
      feedbackMessagePlaceholder: "What is blocked or what does the facilitator need to answer?",
      feedbackSubmit: "Send privately",
      feedbackMissingMessage: "Write the message first.",
      feedbackSuccess: "Private note sent.",
      feedbackGenericError: "Could not send the private note.",
    };
  }

  return {
    nextEyebrow: "další krok",
    buildPhaseOneTitle: "Ujasněte si zadání. Otevřete repo. Sepište první mapu.",
    buildPhaseOneBody:
      "Na rozjezd stačí prohlížeč. Když máte agenta připraveného lokálně, skill vám práci urychlí, ale nepotřebujete ho, abyste mohli začít.",
    contextTitle: "pracovní kontext",
    teamLabel: "tým",
    participantLabel: "účastník",
    buildTitle: "materiály",
    buildBody:
      "Držte participant surface úzký: zadání, repo, materiály a jen takový room signal, který právě potřebujete.",
    briefTitleActive: "vaše zadání",
    briefTitleRoom: "připravená zadání pro tuto místnost",
    briefBodyActive: "Vaše přiřazené zadání je vidět tady, aby se nezačínalo až po cestě přes skill.",
    briefBodyRoom: "Připravená zadání zůstávají vidět tady, takže si tým potvrdí směr ještě dřív, než bude lokální setup dokonalý.",
    materialsTitle: "materiály týmu",
    materialsBody: "Otevřete repo, vezměte si potřebné odkazy a do práce v repu se pusťte až po zadání a prvním ověření.",
    openRepo: "Otevřít repo",
    copyRepoUrl: "Kopírovat adresu repa",
    copyCloneCommand: "Kopírovat git clone",
    copied: "Zkopírováno",
    roomToolsTitle: "nástroje pro signál z místnosti",
    roomToolsBody:
      "Mějte je po ruce, ale až jako druhý krok. Použijte je ve chvíli, kdy potřebujete zanechat krátkou strukturovanou stopu pro místnost nebo další tým.",
    captureTitle: "strukturovaný checkpoint",
    captureBody: "Zapište stručně to, k čemu se má místnost vrátit: co jste změnili, čím jste to ověřili a co má přijít dál.",
    captureChangedLabel: "co se změnilo",
    captureChangedPlaceholder: "Pojmenujte konkrétní změnu, kterou váš tým udělal.",
    captureVerifiedLabel: "čím jste to ověřili",
    captureVerifiedPlaceholder: "Napište, jaký důkaz nebo kontrola potvrzuje, že změna drží.",
    captureNextStepLabel: "další bezpečný krok",
    captureNextStepPlaceholder: "Napište, co má další člověk udělat jako první.",
    captureSubmit: "Zapsat checkpoint",
    captureSuccess: "Checkpoint uložen.",
    captureMissingTeam: "Nejdřív vyberte tým.",
    captureMissing: "Vyplňte všechna tři pole.",
    captureNeedsTeam: "Nejdřív si vyberte tým. Pak můžete zapsat checkpoint z jeho kontextu.",
    feedTitle: "živý přehled checkpointů",
    feedBody: "Jen krátké a dohledatelné záznamy. Není to chat pro celou místnost.",
    feedRoom: "celá místnost",
    feedPhase: "aktuální fáze",
    feedTeam: "můj tým",
    feedMine: "jen moje",
    feedEmpty: "V tomhle zobrazení zatím nic není.",
    feedEmptyMine: "Ještě jste nezapsali žádný checkpoint.",
    feedLegacy: "starší poznámka",
    referenceTitle: "podklady",
    referenceBody: "Tady je hlavní police s podklady: nejdřív workshopové materiály, potom setup a pluginy a nakonec externí čtení a publikované HTML artefakty.",
    pollTitle: "signál z místnosti",
    pollBody: "Vyberte jednu možnost. Facilitátor uvidí jen souhrn za místnost, ne jednotlivé odpovědi.",
    pollSubmit: "Odeslat signál",
    pollMissingOption: "Nejdřív vyberte jednu možnost.",
    pollSuccess: "Signál odeslán.",
    pollGenericError: "Signál se nepodařilo odeslat.",
    feedbackTitle: "soukromá linka pro facilitátora",
    feedbackBody: "Použijte ji pro blocker nebo otázku na facilitátora. Zůstává soukromá, dokud ji facilitátor vědomě nepovýší do poznámky pro místnost.",
    feedbackKindLabel: "typ",
    feedbackBlockerLabel: "blocker",
    feedbackQuestionLabel: "otázka",
    feedbackMessageLabel: "zpráva",
    feedbackMessagePlaceholder: "Co vás blokuje nebo na co potřebujete odpověď od facilitátora?",
    feedbackSubmit: "Odeslat soukromě",
    feedbackMissingMessage: "Nejdřív napište zprávu.",
    feedbackSuccess: "Soukromá zpráva odeslána.",
    feedbackGenericError: "Soukromou zprávu se nepodařilo odeslat.",
  };
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--text-muted)]">{children}</p>;
}

function KeyValuePair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function resolveBriefTitle(briefs: ProjectBrief[], projectBriefId: string) {
  return briefs.find((brief) => brief.id === projectBriefId)?.title ?? projectBriefId;
}

function ParticipantGuidanceBlocks({
  blocks,
  copy,
  participantPanel,
}: {
  blocks: PresenterBlock[];
  copy: (typeof publicCopy)[UiLanguage];
  participantPanel: ReturnType<typeof buildParticipantPanelState>;
}) {
  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        if (block.type === "hero") {
          return (
            <div key={block.id} className="dashboard-motion-card rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {block.eyebrow ?? participantPanel.guidanceLabel ?? copy.participantEyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{block.title}</h3>
              {block.body ? <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{block.body}</p> : null}
            </div>
          );
        }

        if (block.type === "participant-preview") {
          return (
            <div key={block.id} className="dashboard-motion-card rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5">
              {block.body ? <p className="text-sm leading-7 text-[var(--text-secondary)]">{block.body}</p> : null}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MiniMetric label={participantPanel.currentPhaseLabel} value={participantPanel.currentPhaseTitle} />
                <MiniMetric label={copy.metricNext} value={participantPanel.nextPhaseTitle ?? copy.metricReflection} />
                <MiniMetric label={participantPanel.sessionUntilLabel} value={participantPanel.sessionUntilValue} />
              </div>
            </div>
          );
        }

        if (block.type === "bullet-list") {
          return (
            <ParticipantBlockCard key={block.id} title={block.title}>
              <ul className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
                {block.items.map((item) => (
                  <li key={item}>{"\u2022"} {item}</li>
                ))}
              </ul>
            </ParticipantBlockCard>
          );
        }

        if (block.type === "checklist") {
          return (
            <ParticipantBlockCard key={block.id} title={block.title}>
              <div className="space-y-3">
                {block.items.map((item) => (
                  <div key={item} className="flex gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3">
                    <span className="mt-1 h-3 w-3 rounded-full border border-[var(--border-strong)]" />
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">{item}</p>
                  </div>
                ))}
              </div>
            </ParticipantBlockCard>
          );
        }

        if (block.type === "steps") {
          return (
            <ParticipantBlockCard key={block.id} title={block.title}>
              <div className="space-y-4">
                {block.items.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="grid gap-3 sm:grid-cols-[2rem_minmax(0,1fr)]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-sm text-[var(--text-primary)]">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                      {item.body ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.body}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </ParticipantBlockCard>
          );
        }

        if (block.type === "callout") {
          const toneClass =
            block.tone === "warning"
              ? "border-[var(--border-strong)] bg-[var(--surface-panel)]"
              : "border-[var(--border)] bg-[var(--surface)]";
          return (
            <div key={block.id} className={`rounded-[22px] border p-5 ${toneClass}`}>
              {block.title ? <p className="text-sm font-medium text-[var(--text-primary)]">{block.title}</p> : null}
              <p className={block.title ? "mt-2 text-sm leading-7 text-[var(--text-secondary)]" : "text-sm leading-7 text-[var(--text-secondary)]"}>
                {block.body}
              </p>
            </div>
          );
        }

        if (block.type === "rich-text") {
          return (
            <div
              key={block.id}
              className="px-1 text-base leading-8 text-[var(--text-secondary)] whitespace-pre-line"
            >
              {block.content}
            </div>
          );
        }

        if (block.type === "quote") {
          const attribution = block.attribution?.trim() || copy.quoteSourceUnknown;
          return (
            <figure
              key={block.id}
              className="border-l-[3px] border-[var(--text-primary)] py-1 pl-5"
            >
              <blockquote className="text-lg italic leading-8 text-[var(--text-primary)]">
                &ldquo;{block.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-sm text-[var(--text-muted)]">- {attribution}</figcaption>
            </figure>
          );
        }

        if (block.type === "link-list") {
          return (
            <ParticipantBlockCard key={block.id} title={block.title}>
              <div className="space-y-3">
                {block.items.map((item) => (
                  <ActionablePanelLink
                    key={`${item.label}-${item.href ?? ""}`}
                    href={item.href ?? null}
                    label={item.label}
                    description={item.description}
                    openLabel={copy.openLinkLabel}
                  />
                ))}
              </div>
            </ParticipantBlockCard>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={block.id} className="dashboard-motion-card rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.src} alt={block.alt} className="w-full rounded-[20px] object-cover" />
              {block.caption ? <figcaption className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{block.caption}</figcaption> : null}
            </figure>
          );
        }

        return null;
      })}
    </div>
  );
}

function ParticipantBlockCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="dashboard-motion-card rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5">
      {title ? <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{title}</p> : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

function GuidanceCta({ href, label, openLabel }: { href: string | null; label: string; openLabel: string }) {
  return (
    <div className="mt-5">
      <ActionablePrimaryLink href={href} label={label} openLabel={openLabel} />
    </div>
  );
}

function ActionablePrimaryLink({ href, label, openLabel }: { href: string | null; label: string; openLabel: string }) {
  if (!href) {
    return (
      <div className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--text-primary)]">
        {label}
      </div>
    );
  }

  return (
    <a
      className="dashboard-motion-button inline-flex w-full items-center justify-between rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--text-primary)] hover:bg-[var(--surface-panel)]"
      href={href}
      rel={isExternalHref(href) ? "noreferrer" : undefined}
      target={isExternalHref(href) ? "_blank" : undefined}
    >
      <span>{label}</span>
      <span className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{openLabel}</span>
    </a>
  );
}

function ActionablePanelLink({
  href,
  label,
  description,
  openLabel,
}: {
  href: string | null;
  label: string;
  description?: string;
  openLabel: string;
}) {
  const className =
    "dashboard-motion-card dashboard-motion-link rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface)]";
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        {href ? <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{openLabel}</span> : null}
      </div>
      {description ? <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
    </>
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <a
      className={`block ${className}`}
      href={href}
      rel={isExternalHref(href) ? "noreferrer" : undefined}
      target={isExternalHref(href) ? "_blank" : undefined}
    >
      {content}
    </a>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-motion-card rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}
