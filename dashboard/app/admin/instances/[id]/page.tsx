import { auth } from "@/lib/auth/server";
import { buildWorkspaceStatusLabel, getWorkshopDisplayTitle } from "@/lib/admin-page-view-model";
import { ControlRoomCockpit } from "./_components/control-room-cockpit";
import { OutlineRail } from "./_components/outline-rail";
import { AccessSection } from "./_components/sections/access-section";
import { PeopleSection } from "./_components/sections/people-section";
import { RunSection } from "./_components/sections/run-section";
import { SettingsSection } from "./_components/sections/settings-section";
import { loadAdminPageViewModel, type AdminPageSearchParams } from "./_lib/admin-page-loader";

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
  const vm = await loadAdminPageViewModel({ instanceId, query });

  return (
    <main className="min-h-screen bg-[var(--surface-admin)] bg-[radial-gradient(circle_at_top_left,var(--ambient-right),transparent_34%),radial-gradient(circle_at_top_right,var(--ambient-left),transparent_24%),linear-gradient(180deg,var(--surface-admin),var(--surface-elevated))] px-4 py-5 text-[var(--text-primary)] sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-[112rem] flex-col gap-4 sm:gap-5">
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

        <div className="grid gap-5 xl:grid-cols-[16rem_minmax(0,1fr)] 2xl:grid-cols-[17rem_minmax(0,1fr)]">
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
                handoffIsLive={vm.handoffIsLive}
                selectedAgendaOwnsHandoffControls={vm.selectedAgendaOwnsHandoffControls}
                handoffAgendaHref={vm.handoffAgendaHref}
                liveAgendaHref={vm.liveAgendaHref}
                selectedAgendaProjectionHref={vm.selectedAgendaProjectionHref}
                selectedAgendaParticipantMirrorHref={vm.selectedAgendaParticipantMirrorHref}
              />
            ) : null}

            {vm.activeSection === "people" ? (
              <PeopleSection
                lang={vm.lang}
                copy={vm.copy}
                instanceId={instanceId}
                teams={vm.state.teams}
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
              />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
