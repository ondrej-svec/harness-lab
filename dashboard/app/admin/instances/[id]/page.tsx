import { auth } from "@/lib/auth/server";
import { buildWorkspaceStatusLabel, getWorkshopDisplayTitle } from "@/lib/admin-page-view-model";
import { getFeedbackSubmissionRepository } from "@/lib/feedback-submission-repository";
import { buildFeedbackSummaryAggregate } from "@/lib/feedback-summary";
import { getParticipantEventAccessRepository } from "@/lib/participant-event-access-repository";
import { resolveEffectiveFeedbackTemplate } from "@/lib/workshop-data";
import { ControlRoomCockpit } from "./_components/control-room-cockpit";
import { OutlineRail } from "./_components/outline-rail";
import { AccessSection } from "./_components/sections/access-section";
import { PeopleSection } from "./_components/sections/people-section";
import { RunSection } from "./_components/sections/run-section";
import { SettingsSection } from "./_components/sections/settings-section";
import { SummarySection } from "./_components/sections/summary-section";
import { loadAdminPageViewModel, type AdminPageSearchParams } from "./_lib/admin-page-loader";
import { getActivePollSummary, listParticipantFeedback } from "@/lib/workshop-store";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<AdminPageSearchParams>;
}) {
  const { id: instanceId } = await params;
  const query = await searchParams;
  // Parallelize the independent reads — each is a DB round trip on
  // Neon and sequential awaits pay the sum of their latencies.
  const [vm, pollSummary, participantFeedback, feedbackSubmissions] = await Promise.all([
    loadAdminPageViewModel({ instanceId, query }),
    getActivePollSummary(instanceId),
    listParticipantFeedback(instanceId),
    getFeedbackSubmissionRepository().list(instanceId),
  ]);

  const feedbackTemplate = vm.selectedInstance
    ? resolveEffectiveFeedbackTemplate(vm.selectedInstance)
    : null;
  const feedbackAggregate = feedbackTemplate
    ? buildFeedbackSummaryAggregate(feedbackTemplate, feedbackSubmissions)
    : { totalResponses: 0, perQuestion: [] };
  // v1: the denominator in the "X of Y" counter is just the submission
  // count (honest — we don't yet compute roster size here). Phase 7 can
  // add a participants-list fetch if the leadership report needs it.
  const participantsWithAccessCount = feedbackSubmissions.length;

  return (
    <main className="min-h-screen bg-[var(--surface-admin)] bg-[radial-gradient(circle_at_top_left,var(--ambient-right),transparent_34%),radial-gradient(circle_at_top_right,var(--ambient-left),transparent_24%),linear-gradient(180deg,var(--surface-admin),var(--surface-elevated))] px-4 py-5 text-[var(--text-primary)] sm:px-6 sm:py-6 print:bg-white print:px-0 print:py-0 print:text-black">
      <div className="mx-auto flex max-w-[112rem] flex-col gap-4 sm:gap-5">
        <div className="print:hidden">
        <ControlRoomCockpit
          lang={vm.lang}
          copy={vm.copy}
          instanceId={instanceId}
          visibleSection={vm.visibleSection}
          activeOverlay={vm.activeOverlay}
          instanceBadge={
            vm.selectedInstance
              ? {
                  statusLabel: buildWorkspaceStatusLabel(vm.copy, vm.selectedInstance.status),
                  statusTone:
                    vm.selectedInstance.status === "running"
                      ? "live"
                      : vm.selectedInstance.status === "archived"
                        ? "archived"
                        : "neutral",
                  displayTitle: getWorkshopDisplayTitle(vm.selectedInstance),
                }
              : null
          }
          workshopId={vm.state.workshopId}
          selectedAgendaItemId={vm.selectedAgendaItem?.id ?? null}
          selectedSceneId={vm.selectedScene?.id ?? null}
          selectedTeamId={query?.team ?? null}
          showAgendaDetail={vm.showAgendaDetail}
          instanceWhenLabel={vm.instanceWhenLabel}
          instanceWhereLabel={vm.instanceWhereLabel}
          instanceOwnerLabel={vm.instanceOwnerLabel}
          summaryRows={vm.persistentSummaryRows}
          sessionState={vm.sessionState}
        />
        </div>

        <div className="grid gap-5 xl:grid-cols-[16rem_minmax(0,1fr)] 2xl:grid-cols-[17rem_minmax(0,1fr)] print:grid-cols-1">
          <OutlineRail
            lang={vm.lang}
            instanceId={instanceId}
            activeSection={vm.visibleSection}
            activeAgendaItemId={vm.selectedAgendaItem?.id ?? null}
            workshopLabel={vm.state.workshopId}
            agendaItems={vm.outlineAgendaItems}
            copy={vm.copy}
          />

          <div className="space-y-6 2xl:space-y-7">
            {vm.visibleSection === "run" ? (
              <RunSection
                lang={vm.lang}
                copy={vm.copy}
                instanceId={instanceId}
                state={vm.state}
                selectedAgendaItem={vm.selectedAgendaItem ?? null}
                currentAgendaItem={vm.currentAgendaItem ?? null}
                nextAgendaItem={vm.nextAgendaItem ?? null}
                overviewState={vm.overviewState}
                rotationSignals={vm.rotationSignals}
                pollSummary={pollSummary}
                participantFeedback={participantFeedback}
                handoffIsLive={vm.handoffIsLive}
                selectedAgendaOwnsHandoffControls={vm.selectedAgendaOwnsHandoffControls}
                handoffAgendaHref={vm.handoffAgendaHref}
                liveAgendaHref={vm.liveAgendaHref}
                selectedAgendaProjectionHref={vm.selectedAgendaProjectionHref}
                selectedAgendaParticipantMirrorHref={vm.selectedAgendaParticipantMirrorHref}
                teamModeEnabled={vm.selectedInstance?.teamModeEnabled ?? true}
              />
            ) : null}

            {vm.activeSection === "people" ? (
              <PeopleSection
                lang={vm.lang}
                copy={vm.copy}
                instanceId={instanceId}
                teams={vm.state.teams}
                teamModeEnabled={vm.selectedInstance?.teamModeEnabled ?? true}
              />
            ) : null}

            {vm.activeSection === "access" ? (
              <AccessSection
                lang={vm.lang}
                copy={vm.copy}
                instanceId={instanceId}
                isNeonMode={vm.isNeonMode}
                isOwner={vm.isOwner}
                currentFacilitatorGrantId={vm.currentFacilitator?.grant.id ?? null}
                fileModeUsername={vm.fileModeUsername}
                errorParam={vm.errorParam}
                participantAccess={vm.participantAccess}
                participantAccessExpiresValue={vm.participantAccessExpiresValue}
                participantAccessFlash={vm.participantAccessFlash}
                facilitatorGrants={vm.facilitatorGrants}
                allowWalkIns={vm.selectedInstance?.allowWalkIns ?? true}
                teamModeEnabled={vm.selectedInstance?.teamModeEnabled ?? true}
                instanceStatus={vm.selectedInstance?.status ?? "prepared"}
              />
            ) : null}

            {vm.activeSection === "summary" ? (
              <SummarySection
                lang={vm.lang}
                copy={vm.copy}
                instanceStatus={vm.selectedInstance?.status ?? "prepared"}
                aggregate={feedbackAggregate}
                participantsWithAccessCount={participantsWithAccessCount}
              />
            ) : null}

            {vm.activeSection === "settings" ? (
              <SettingsSection
                lang={vm.lang}
                copy={vm.copy}
                instanceId={instanceId}
                isNeonMode={vm.isNeonMode}
                hasAuth={Boolean(auth)}
                signedInEmail={vm.signedInEmail}
                currentFacilitator={vm.currentFacilitator}
                workshopId={vm.state.workshopId}
                participantStateLabel={vm.overviewState.participantState}
                passwordParam={vm.passwordParam}
                errorParam={vm.errorParam}
                teamModeEnabled={vm.selectedInstance?.teamModeEnabled ?? true}
                instanceStatus={vm.selectedInstance?.status ?? "prepared"}
                endError={query?.endError}
              />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
