import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import type { Team, WorkshopState } from "@/lib/workshop-data";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import {
  AdminPanel,
  FieldLabel,
  adminInputClassName,
  adminPrimaryButtonClassName,
} from "../../../../admin-ui";
import {
  appendTeamCheckpointAction,
  registerTeamAction,
  updateTeamFieldAction,
} from "../../_actions/teams";
import { InlineField } from "../inline-field";

type Copy = (typeof adminCopy)[UiLanguage];

export function TeamsSection({
  lang,
  copy,
  instanceId,
  state,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  state: Pick<WorkshopState, "teams">;
  /** @deprecated retained for page.tsx prop parity; no longer consumed. */
  selectedTeam?: Team | null;
  /** @deprecated retained for page.tsx prop parity; no longer consumed. */
  selectedTeamCheckpoint?: { changed: string; verified: string; nextStep: string };
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.1fr)]">
      <AdminPanel
        eyebrow={copy.teamOpsEyebrow}
        title={copy.registerTeamTitle}
        description={copy.teamOpsDescription}
      >
        <form action={registerTeamAction} className="grid gap-3 lg:grid-cols-2">
          <input name="lang" type="hidden" value={lang} />
          <input name="section" type="hidden" value="people" />
          <input name="instanceId" type="hidden" value={instanceId} />
          <input name="name" placeholder={copy.teamNamePlaceholder} className={adminInputClassName} />
          <input name="city" placeholder="Studio A" className={adminInputClassName} />
          <input
            name="repoUrl"
            placeholder="https://github.com/..."
            className={`${adminInputClassName} lg:col-span-2`}
          />
          <input name="projectBriefId" placeholder="standup-bot" className={adminInputClassName} />
          <input name="members" placeholder="Anna, David, Eva" className={adminInputClassName} />
          <input
            name="anchor"
            placeholder="red brick / numbered card 3"
            className={`${adminInputClassName} lg:col-span-2`}
          />
          <AdminSubmitButton className={`${adminPrimaryButtonClassName} lg:col-span-2`}>
            {copy.createTeamButton}
          </AdminSubmitButton>
        </form>
      </AdminPanel>

      <AdminPanel eyebrow={copy.navTeams} title={copy.teamOpsTitle} description={copy.teamOpsDescription}>
        <div className="grid gap-3 2xl:grid-cols-2">
          {state.teams.map((team) => {
            const latestCheckIn = team.checkIns[team.checkIns.length - 1]?.content ?? "";
            return (
              <div
                key={team.id}
                className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[var(--text-primary)]">
                      <InlineField
                        value={team.name}
                        fieldName="name"
                        label={copy.teamNamePlaceholder}
                        action={updateTeamFieldAction}
                        hiddenFields={{ instanceId, teamId: team.id, fieldName: "name" }}
                      />
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                      <InlineField
                        value={team.repoUrl}
                        fieldName="repoUrl"
                        label="repo url"
                        action={updateTeamFieldAction}
                        hiddenFields={{ instanceId, teamId: team.id, fieldName: "repoUrl" }}
                      />
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                      <InlineField
                        value={team.city}
                        fieldName="city"
                        label="city"
                        action={updateTeamFieldAction}
                        hiddenFields={{ instanceId, teamId: team.id, fieldName: "city" }}
                      />
                    </div>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{team.id}</p>
                </div>
                <div className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  <FieldLabel htmlFor={`team-${team.id}-checkpoint`}>{copy.checkpointFormHint}</FieldLabel>
                  <form
                    action={appendTeamCheckpointAction}
                    id={`team-${team.id}-checkpoint`}
                    className="mt-2 flex items-start gap-2"
                  >
                    <input name="instanceId" type="hidden" value={instanceId} />
                    <input name="teamId" type="hidden" value={team.id} />
                    <textarea
                      name="checkpoint"
                      rows={2}
                      placeholder={latestCheckIn || copy.checkpointFormHint}
                      className={`${adminInputClassName} flex-1`}
                    />
                    <AdminSubmitButton className={adminPrimaryButtonClassName}>
                      +
                    </AdminSubmitButton>
                  </form>
                  {latestCheckIn ? (
                    <p className="mt-2 whitespace-pre-line text-xs leading-5 text-[var(--text-muted)]">
                      {latestCheckIn}
                    </p>
                  ) : null}
                </div>
                <div className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                  <InlineField
                    value={team.members.join(", ")}
                    fieldName="members"
                    label="členové"
                    action={updateTeamFieldAction}
                    hiddenFields={{ instanceId, teamId: team.id, fieldName: "members" }}
                  />
                </div>
                <div className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                  <InlineField
                    value={team.anchor ?? ""}
                    fieldName="anchor"
                    label="anchor"
                    placeholder="red brick / numbered card 3"
                    action={updateTeamFieldAction}
                    hiddenFields={{ instanceId, teamId: team.id, fieldName: "anchor" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </AdminPanel>
    </div>
  );
}
