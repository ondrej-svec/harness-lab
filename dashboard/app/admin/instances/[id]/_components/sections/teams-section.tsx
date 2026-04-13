import { AdminRouteLink } from "@/app/admin/admin-route-link";
import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { buildAdminHref } from "@/lib/admin-page-view-model";
import type { Team, WorkshopState } from "@/lib/workshop-data";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import {
  AdminPanel,
  FieldLabel,
  adminInputClassName,
  adminPrimaryButtonClassName,
} from "../../../../admin-ui";
import { registerTeamAction } from "../../_actions/teams";

type Copy = (typeof adminCopy)[UiLanguage];

export function TeamsSection({
  lang,
  copy,
  instanceId,
  state,
  selectedTeam,
  selectedTeamCheckpoint,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  state: Pick<WorkshopState, "teams">;
  selectedTeam: Team | null;
  selectedTeamCheckpoint: { changed: string; verified: string; nextStep: string };
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.1fr)]">
      <AdminPanel
        eyebrow={copy.teamOpsEyebrow}
        title={selectedTeam ? copy.editTeamTitle : copy.registerTeamTitle}
        description={selectedTeam ? copy.editTeamDescription : copy.teamOpsDescription}
      >
        <div className="space-y-4">
          {selectedTeam ? (
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{selectedTeam.name}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{selectedTeam.id}</p>
                </div>
                <AdminRouteLink
                  href={buildAdminHref({ lang, section: "teams", instanceId })}
                  className="text-xs lowercase text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                >
                  {copy.createAnotherTeamLabel}
                </AdminRouteLink>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{selectedTeam.repoUrl}</p>
            </div>
          ) : null}

          <form action={registerTeamAction} className="grid gap-3 lg:grid-cols-2">
            <input name="lang" type="hidden" value={lang} />
            <input name="section" type="hidden" value="teams" />
            <input name="instanceId" type="hidden" value={instanceId} />
            <input name="id" type="hidden" value={selectedTeam?.id ?? ""} />
            <input name="name" placeholder={copy.teamNamePlaceholder} defaultValue={selectedTeam?.name ?? ""} className={adminInputClassName} />
            <input name="city" placeholder="Studio A" defaultValue={selectedTeam?.city ?? ""} className={adminInputClassName} />
            <input
              name="repoUrl"
              placeholder="https://github.com/..."
              defaultValue={selectedTeam?.repoUrl ?? ""}
              className={`${adminInputClassName} lg:col-span-2`}
            />
            <input name="projectBriefId" placeholder="standup-bot" defaultValue={selectedTeam?.projectBriefId ?? ""} className={adminInputClassName} />
            <input
              name="members"
              placeholder="Anna, David, Eva"
              defaultValue={selectedTeam?.members.join(", ") ?? ""}
              className={adminInputClassName}
            />
            <input
              name="anchor"
              placeholder="red brick / numbered card 3"
              defaultValue={selectedTeam?.anchor ?? ""}
              className={adminInputClassName}
            />
            <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)] lg:col-span-2">
              {copy.checkpointFormHint}
            </div>
            <div className="lg:col-span-2">
              <FieldLabel htmlFor="checkpoint-changed">{copy.checkpointChangedLabel}</FieldLabel>
              <textarea
                id="checkpoint-changed"
                name="checkpointChanged"
                rows={3}
                placeholder={copy.checkpointChangedLabel}
                defaultValue={selectedTeamCheckpoint.changed}
                className={`${adminInputClassName} mt-2`}
              />
            </div>
            <div className="lg:col-span-2">
              <FieldLabel htmlFor="checkpoint-verified">{copy.checkpointVerifiedLabel}</FieldLabel>
              <textarea
                id="checkpoint-verified"
                name="checkpointVerified"
                rows={3}
                placeholder={copy.checkpointVerifiedLabel}
                defaultValue={selectedTeamCheckpoint.verified}
                className={`${adminInputClassName} mt-2`}
              />
            </div>
            <div className="lg:col-span-2">
              <FieldLabel htmlFor="checkpoint-next-step">{copy.checkpointNextStepLabel}</FieldLabel>
              <textarea
                id="checkpoint-next-step"
                name="checkpointNextStep"
                rows={3}
                placeholder={copy.checkpointNextStepLabel}
                defaultValue={selectedTeamCheckpoint.nextStep}
                className={`${adminInputClassName} mt-2`}
              />
            </div>
            <AdminSubmitButton className={`${adminPrimaryButtonClassName} lg:col-span-2`}>
              {selectedTeam ? copy.updateTeamButton : copy.createTeamButton}
            </AdminSubmitButton>
          </form>
        </div>
      </AdminPanel>

      <AdminPanel eyebrow={copy.navTeams} title={copy.teamOpsTitle} description={copy.teamOpsDescription}>
        <div className="grid gap-3 2xl:grid-cols-2">
          {state.teams.map((team) => (
            <div
              key={team.id}
              className={`rounded-[20px] border p-4 ${
                selectedTeam?.id === team.id
                  ? "border-[var(--text-primary)] bg-[var(--surface)]"
                  : "border-[var(--border)] bg-[var(--surface-soft)]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{team.name}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{team.repoUrl}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{team.id}</p>
                  <AdminRouteLink
                    href={buildAdminHref({
                      lang,
                      section: "teams",
                      instanceId,
                      teamId: team.id,
                    })}
                    className="mt-2 inline-flex text-xs lowercase text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                  >
                    {copy.editActionLabel}
                  </AdminRouteLink>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">
                {team.checkIns[team.checkIns.length - 1]?.content ?? ""}
              </p>
              <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{team.members.join(", ")}</p>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
