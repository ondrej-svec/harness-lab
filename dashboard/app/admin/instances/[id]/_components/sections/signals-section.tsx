import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import type { WorkshopState } from "@/lib/workshop-data";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import {
  AdminPanel,
  FieldLabel,
  adminInputClassName,
  adminPrimaryButtonClassName,
} from "../../../../admin-ui";
import {
  addCheckpointFeedAction,
  completeChallengeAction,
} from "../../_actions/signals";

// Signals section of the facilitator admin — sprint feedback form +
// complete-challenge form. Extracted from page.tsx as part of the
// focused-canvas refactor (Phase 3/#3). Server component; composes
// client-side AdminSubmitButton.

export function SignalsSection({
  lang,
  copy,
  instanceId,
  state,
}: {
  lang: UiLanguage;
  copy: (typeof adminCopy)[UiLanguage];
  instanceId: string;
  state: Pick<WorkshopState, "teams" | "challenges">;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
      <AdminPanel
        eyebrow={copy.signalEyebrow}
        title={copy.sprintFeedTitle}
        description={copy.signalDescription}
      >
        <form action={addCheckpointFeedAction} className="grid gap-3 lg:grid-cols-2">
          <input name="lang" type="hidden" value={lang} />
          <input name="section" type="hidden" value="signals" />
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
          <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)] lg:col-span-2">
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
          <AdminSubmitButton className={`${adminPrimaryButtonClassName} lg:col-span-2`}>
            {copy.addUpdateButton}
          </AdminSubmitButton>
        </form>
      </AdminPanel>

      <AdminPanel
        eyebrow={copy.signalEyebrow}
        title={copy.completeChallengeTitle}
        description={copy.signalDescription}
      >
        <form action={completeChallengeAction} className="space-y-3">
          <input name="lang" type="hidden" value={lang} />
          <input name="section" type="hidden" value="signals" />
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
          <AdminSubmitButton className={adminPrimaryButtonClassName}>
            {copy.recordCompletionButton}
          </AdminSubmitButton>
        </form>
      </AdminPanel>
    </div>
  );
}
