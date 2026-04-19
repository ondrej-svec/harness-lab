import type { ReactNode } from "react";
import {
  buildParticipantPanelState,
  buildParticipantTeamCards,
  buildSharedRoomNotes,
} from "@/lib/public-page-view-model";
import type { ParticipantTeamLookup } from "@/lib/event-access";
import type { ParticipantSession } from "@/lib/runtime-contracts";
import { publicCopy, type UiLanguage } from "@/lib/ui-language";
import type { Challenge, PresenterBlock, ProjectBrief, Team, WorkshopState } from "@/lib/workshop-data";
import { CopyActionButton } from "./copy-action-button";
import { SubmitButton } from "./submit-button";
import { ParticipantCheckInForm } from "./participant-check-in-form";

type AgendaItem = WorkshopState["agenda"][number];
type PublicNote = WorkshopState["ticker"][number];

export function ParticipantRoomSurface({
  copy,
  lang,
  workshopContextLine,
  currentAgendaItem,
  nextAgendaItem,
  participantSession,
  participantTeams,
  activeParticipantTeam,
  briefs,
  challenges,
  publicNotes,
  rotationRevealed,
  logoutAction,
}: {
  copy: (typeof publicCopy)[UiLanguage];
  lang: UiLanguage;
  workshopContextLine: string;
  currentAgendaItem: AgendaItem | undefined;
  nextAgendaItem: AgendaItem | undefined;
  participantSession: ParticipantSession;
  participantTeams: ParticipantTeamLookup | null;
  activeParticipantTeam: Team | null;
  briefs: ProjectBrief[];
  challenges: Challenge[];
  publicNotes: PublicNote[];
  rotationRevealed: boolean;
  logoutAction?: ((formData: FormData) => Promise<void>) | undefined;
}) {
  const participantPanel = buildParticipantPanelState({
    copy,
    lang,
    currentAgendaItem,
    nextAgendaItem,
    participantSession,
    rotationRevealed,
  });
  const teamCards = buildParticipantTeamCards(participantTeams);
  const sharedNotes = buildSharedRoomNotes(publicNotes);
  const roomNotesSummary = sharedNotes.length > 0 ? `${sharedNotes.length}` : "0";
  const showBuildPhaseOneProofSlice = currentAgendaItem?.id === "build-1";

  return (
    <>
      {workshopContextLine ? (
        <p className="border-b border-[var(--border)] py-3 text-sm lowercase text-[var(--text-muted)]">
          {workshopContextLine}
        </p>
      ) : null}

      <section className="border-b border-[var(--border)] py-10" id="room">
        <div
          className="dashboard-motion-card relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-soft)] backdrop-blur sm:p-7"
          style={{ viewTransitionName: "room-access" }}
        >
          <div className="pointer-events-none absolute -left-10 top-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,var(--ambient-left),transparent_72%)] blur-3xl dashboard-drift" />
          <div className="pointer-events-none absolute right-[-3rem] top-8 h-44 w-44 rounded-full bg-[radial-gradient(circle,var(--accent-surface),transparent_74%)] opacity-[0.08] blur-3xl dashboard-drift-reverse" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,var(--surface-soft),transparent_62%)] dashboard-sheen" />
          <SectionLabel>{copy.participantEyebrow}</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            {participantPanel.title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">{participantPanel.body}</p>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
            <div className="dashboard-motion-card rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{participantPanel.currentPhaseLabel}</p>
              <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{participantPanel.currentPhaseTitle}</p>
              {participantPanel.currentPhaseDescription ? (
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{participantPanel.currentPhaseDescription}</p>
              ) : null}
              {participantPanel.nextPhaseLabel ? (
                <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{participantPanel.nextPhaseLabel}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard label={copy.metricNext} value={participantPanel.nextPhaseTitle ?? copy.metricReflection} />
              <a
                href="#notes"
                className="dashboard-motion-card dashboard-motion-link rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--border-strong)]"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{copy.sharedRoomNotes}</p>
                <p className="mt-3 text-base font-medium leading-6 text-[var(--text-primary)]">{roomNotesSummary}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy.navNotes}</p>
              </a>
            </div>
          </div>

          {showBuildPhaseOneProofSlice ? (
            <BuildPhaseOneProofSlice
              lang={lang}
              activeTeam={activeParticipantTeam}
              teamCards={teamCards}
              briefs={briefs}
              challenges={challenges}
            />
          ) : null}

          {participantPanel.guidanceBlocks.length > 0 ? (
            <div className="mt-6 space-y-4">
              <SectionLabel>{participantPanel.guidanceLabel ?? copy.participantEyebrow}</SectionLabel>
              <ParticipantGuidanceBlocks blocks={participantPanel.guidanceBlocks} copy={copy} participantPanel={participantPanel} />
            </div>
          ) : null}
          {participantPanel.guidanceCtaLabel ? (
            <GuidanceCta href={participantPanel.guidanceCtaHref} label={participantPanel.guidanceCtaLabel} openLabel={copy.openLinkLabel} />
          ) : null}
        </div>
      </section>

      <section className="grid gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div id="teams">
          <SectionLabel>{copy.roomData}</SectionLabel>
          {teamCards.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {teamCards.map((team) => (
                <article
                  key={team.id}
                  className="dashboard-motion-card rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] backdrop-blur"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-[var(--text-primary)]">{team.name}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{team.city}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">{team.id}</span>
                  </div>
                  {"projectBriefId" in team ? (
                    <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                      {resolveBriefTitle(briefs, team.projectBriefId)}
                      {"anchor" in team && team.anchor ? ` · ${team.anchor}` : ""}
                    </p>
                  ) : null}
                  {"members" in team && Array.isArray(team.members) && team.members.length > 0 ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{team.members.join(", ")}</p>
                  ) : null}
                  <div className="mt-4 space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      {copy.teamCheckInsLabel}
                    </p>
                    {Array.isArray(team.checkIns) && team.checkIns.length > 0 ? (
                      <ul className="space-y-2">
                        {team.checkIns.map((entry) => (
                          <li
                            key={`${entry.phaseId}-${entry.writtenAt}`}
                            className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--text-secondary)]"
                          >
                            <p className="whitespace-pre-line">{entry.content}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                              {entry.phaseId}
                              {entry.writtenBy ? ` · ${entry.writtenBy}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm leading-6 text-[var(--text-muted)]">{copy.teamCheckInsEmpty}</p>
                    )}
                  </div>
                  <ParticipantCheckInForm
                    teamId={team.id}
                    currentPhaseId={currentAgendaItem?.id ?? null}
                    labels={{
                      contentPlaceholder: copy.teamCheckInContentPlaceholder,
                      authorPlaceholder: copy.teamCheckInAuthorPlaceholder,
                      submitLabel: copy.teamCheckInSubmit,
                      successMessage: copy.teamCheckInSuccess,
                      missingContent: copy.teamCheckInMissingContent,
                      missingPhase: copy.teamCheckInMissingPhase,
                      genericError: copy.teamCheckInGenericError,
                    }}
                  />
                  {team.repoUrl ? (
                    <>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a
                          className="dashboard-motion-button inline-flex items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--text-primary)] hover:bg-[var(--surface-panel)]"
                          href={team.repoUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {lang === "en" ? "Open repo" : "Otevřít repo"}
                        </a>
                        <CopyActionButton
                          className="dashboard-motion-button rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)]"
                          value={team.repoUrl}
                          label={lang === "en" ? "Copy repo URL" : "Kopírovat URL repa"}
                          copiedLabel={lang === "en" ? "Copied" : "Zkopírováno"}
                        />
                        <CopyActionButton
                          className="dashboard-motion-button rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)]"
                          value={`git clone ${team.repoUrl}`}
                          label={lang === "en" ? "Copy clone command" : "Kopírovat clone command"}
                          copiedLabel={lang === "en" ? "Copied" : "Zkopírováno"}
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

        <div id="notes">
          <SectionLabel>{copy.sharedRoomNotes}</SectionLabel>
          {sharedNotes.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {sharedNotes.map((note) => (
                <div
                  key={note}
                  className="dashboard-motion-card rounded-[22px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-4 text-sm leading-6 text-[var(--text-secondary)] shadow-[var(--shadow-soft)] backdrop-blur whitespace-pre-line"
                >
                  {note}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{copy.noRoomData}</p>
          )}
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

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] lowercase tracking-[0.22em] text-[var(--text-muted)]">{children}</p>;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-motion-card rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-base font-medium leading-6 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function BuildPhaseOneProofSlice({
  lang,
  activeTeam,
  teamCards,
  briefs,
  challenges,
}: {
  lang: UiLanguage;
  activeTeam: Team | null;
  teamCards: Array<ParticipantTeamLookup["items"][number]>;
  briefs: ProjectBrief[];
  challenges: Challenge[];
}) {
  const copy =
    lang === "en"
      ? {
          eyebrow: "build phase 1",
          title: "Agree on the brief. Open the repo. Draft the first map.",
          body:
            "The participant surface is enough to start. If your local agent setup is ready, the workshop skill is the faster path — not the required one.",
          primaryBrief: "Open your brief",
          primaryRepo: "Get team materials",
          primaryFallback: "Blocked? Use fallback",
          roomBriefsTitle: activeTeam ? "Your brief" : "Prepared briefs in this room",
          roomBriefsBody: activeTeam
            ? "Your team's brief is visible here so Build Phase 1 does not depend on the skill path."
            : "Every prepared brief for this room is visible here so teams can confirm direction without local setup first.",
          roomChallengesTitle: "Challenge cards, without the skill dependency",
          roomChallengesBody:
            "Required and optional prompts stay visible here so the room can keep moving even when local tooling is uneven.",
          fallbackTitle: "Fallback is normal, not failure.",
          fallbackBody:
            "Keep moving from this page. Confirm the brief, open the repo, write the first map in the repo, and only then decide whether local setup is worth more time.",
          fallbackNow: "0–5 minutes blocked",
          fallbackNowBody: "Stay with the participant surface. Align on goal, scope, and the first verification step.",
          fallbackHelp: "Still blocked after that?",
          fallbackHelpBody: "Raise a hand. A facilitator helps you choose between browser path, starter package, or local-tool fallback.",
          fallbackFast: "If setup is ready",
          fallbackFastBody: "Use the workshop skill as the faster path for coaching and repo-native prompts.",
          anchorTeams: "Jump to team cards",
        }
      : {
          eyebrow: "build fáze 1",
          title: "Srovnejte si zadání. Otevřete repo. Sepište první mapu.",
          body:
            "Participant plocha na start stačí. Když máte připravený lokální setup pro agenta, workshop skill je rychlejší cesta — ne povinná podmínka.",
          primaryBrief: "Otevřít zadání",
          primaryRepo: "Dostat se k materiálům týmu",
          primaryFallback: "Zasekli jste se? Použijte fallback",
          roomBriefsTitle: activeTeam ? "Vaše zadání" : "Připravená zadání pro tuto místnost",
          roomBriefsBody: activeTeam
            ? "Zadání vašeho týmu je vidět přímo tady, aby Build fáze 1 nezávisela na cestě přes skill."
            : "Všechna připravená zadání pro tuto místnost jsou vidět tady, takže si tým může potvrdit směr i bez lokálního setupu.",
          roomChallengesTitle: "Challenge cards i bez závislosti na skillu",
          roomChallengesBody:
            "Povinné i volitelné prompty zůstávají viditelné tady, aby se místnost hýbala dál i při nerovnoměrném toolingu.",
          fallbackTitle: "Fallback není selhání.",
          fallbackBody:
            "Pokračujte z téhle stránky. Potvrďte si zadání, otevřete repo, napište první mapu do repa a teprve potom řešte, jestli má lokální setup cenu dál ladit.",
          fallbackNow: "0–5 minut blok",
          fallbackNowBody: "Zůstaňte na participant ploše. Srovnejte si cíl, scope a první ověřovací krok.",
          fallbackHelp: "Pořád jste zaseklí?",
          fallbackHelpBody: "Zvedněte ruku. Facilitátor pomůže vybrat browser cestu, starter balíček nebo lokální fallback.",
          fallbackFast: "Když je setup připravený",
          fallbackFastBody: "Použijte workshop skill jako rychlejší cestu ke coachingu a repo-native promptům.",
          anchorTeams: "Skočit na karty týmů",
        };

  const highlightedBrief = activeTeam ? briefs.find((brief) => brief.id === activeTeam.projectBriefId) ?? null : null;
  const visibleBriefs = highlightedBrief ? [highlightedBrief] : briefs.slice(0, 3);
  const visibleChallenges = challenges.filter((challenge) => challenge.phaseHint === "before-lunch" || challenge.phaseHint === "anytime").slice(0, 3);

  return (
    <div className="mt-6 space-y-4" id="build-proof-slice">
      <SectionLabel>{copy.eyebrow}</SectionLabel>
      <div className="dashboard-motion-card rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface)] p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.eyebrow}</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{copy.title}</h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">{copy.body}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="dashboard-motion-button rounded-full border border-[var(--border-strong)] bg-[var(--surface-panel)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--text-primary)]" href="#build-briefs">{copy.primaryBrief}</a>
          <a className="dashboard-motion-button rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)]" href="#teams">{copy.primaryRepo}</a>
          <a className="dashboard-motion-button rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--border-strong)]" href="#build-fallback">{copy.primaryFallback}</a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div className="space-y-4">
          <ParticipantBlockCard title={copy.roomBriefsTitle}>
            <div id="build-briefs">
              <p className="text-sm leading-7 text-[var(--text-secondary)]">{copy.roomBriefsBody}</p>
              <div className="mt-4 space-y-3">
                {visibleBriefs.map((brief) => (
                  <div key={brief.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{brief.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{brief.problem}</p>
                  </div>
                ))}
              </div>
              {!highlightedBrief && teamCards.length > 0 ? (
                <div className="mt-4 rounded-[16px] border border-dashed border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                  {lang === "en"
                    ? "If you're looking at the shared board rather than a bound participant session, use your team card below to open the matching repo."
                    : "Pokud se díváte na sdílenou plochu a ne na přiřazenou participant session, otevřete si odpovídající repo přes kartu svého týmu níže."}
                </div>
              ) : null}
            </div>
          </ParticipantBlockCard>

          <ParticipantBlockCard title={copy.roomChallengesTitle}>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">{copy.roomChallengesBody}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {visibleChallenges.map((challenge) => (
                <span key={challenge.id} className="rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
                  {challenge.title}
                </span>
              ))}
            </div>
            <div className="mt-4">
              <a className="dashboard-motion-link text-sm font-medium text-[var(--text-primary)] transition hover:text-[var(--text-secondary)]" href="#teams">{copy.anchorTeams}</a>
            </div>
          </ParticipantBlockCard>
        </div>

        <div className="space-y-4" id="build-fallback">
          <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface)] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{lang === "en" ? "setup fallback" : "fallback při setupu"}</p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{copy.fallbackTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{copy.fallbackBody}</p>
            <div className="mt-4 space-y-3">
              <FallbackStep title={copy.fallbackNow} body={copy.fallbackNowBody} />
              <FallbackStep title={copy.fallbackHelp} body={copy.fallbackHelpBody} />
              <FallbackStep title={copy.fallbackFast} body={copy.fallbackFastBody} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FallbackStep({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3">
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
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
            <div key={block.id} className="dashboard-motion-card rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
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
            <div key={block.id} className="dashboard-motion-card rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
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
            <div key={block.id} className={`rounded-[24px] border p-5 ${toneClass}`}>
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
              className="border-l-[3px] border-[var(--text-primary)] pl-5 py-1"
            >
              <blockquote className="text-lg italic leading-8 text-[var(--text-primary)]">
                &ldquo;{block.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-sm text-[var(--text-muted)]">— {attribution}</figcaption>
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
            <figure key={block.id} className="dashboard-motion-card rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.src} alt={block.alt} className="w-full rounded-[18px] object-cover" />
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
    <div className="dashboard-motion-card rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
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
