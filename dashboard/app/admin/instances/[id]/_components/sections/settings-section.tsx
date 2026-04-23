import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { getBlueprintRepoUrl } from "@/lib/repo-links";
import type { InstanceGrantRecord } from "@/lib/runtime-contracts";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import {
  AdminPanel,
  KeyValueRow,
  adminInputClassName,
  adminPrimaryButtonClassName,
} from "../../../../admin-ui";
import {
  addFacilitatorAction,
  revokeFacilitatorAction,
} from "../../_actions/access";
import { endWorkshopAction } from "../../_actions/lifecycle";
import type {
  WorkshopInstanceRecord,
  WorkshopInstanceStatus,
} from "@/lib/workshop-data";

type Copy = (typeof adminCopy)[UiLanguage];

type FacilitatorLike = {
  grant: { role: string; id: string };
};

type GrantWithUser = InstanceGrantRecord & {
  userEmail?: string | null;
  userName?: string | null;
};

function HiddenState({ lang, instanceId }: { lang: UiLanguage; instanceId: string }) {
  return (
    <>
      <input name="lang" type="hidden" value={lang} />
      <input name="section" type="hidden" value="settings" />
      <input name="instanceId" type="hidden" value={instanceId} />
    </>
  );
}

// Slim Settings section under the 2026-04-23 minimal-UI plan.
//
// Kept (high-stakes, low-frequency, UI-appropriate):
//   - Identity readout (who is signed in, which instance)
//   - Instance metadata (blueprint, language, team-mode state, status)
//   - Facilitator grants (list + add/revoke — GDPR-adjacent; UI-primary)
//   - End workshop (freezes the cohort)
//   - Blueprint repo link (informational)
//
// Moved to CLI (per plan Q4 / Q7):
//   - Reset workshop → `harness instance reset`
//   - Archive workshop → `harness workshop archive`
//   - Change password → auth-provider UI
//   - Toggle team mode → blueprint-time default; CLI escape hatch only
//   - Rotation unlock/hide → blueprint-time + `harness` (retired here)
//
// Retired CLI-only surfaces keep the admin routes available for
// facilitators who are mid-event and can use the skill to invoke them.

export function SettingsSection({
  lang,
  copy,
  instanceId,
  isNeonMode,
  signedInEmail,
  currentFacilitator,
  workshopId,
  isOwner,
  facilitatorGrants,
  currentFacilitatorGrantId,
  selectedInstance,
  instanceStatus,
  endError,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  isNeonMode: boolean;
  signedInEmail: string | null;
  currentFacilitator: FacilitatorLike | null;
  workshopId: string;
  isOwner: boolean;
  facilitatorGrants: GrantWithUser[];
  currentFacilitatorGrantId: string | null;
  selectedInstance: WorkshopInstanceRecord | null;
  instanceStatus: WorkshopInstanceStatus;
  endError?: string | undefined;
}) {
  const blueprintRepoUrl = getBlueprintRepoUrl();
  const alreadyEnded = instanceStatus === "ended";
  const teamModeLabel = selectedInstance?.teamModeEnabled ? copy.workshopModeTeamLabel : copy.workshopModeParticipantLabel;
  const languageLabel = selectedInstance?.workshopMeta.contentLang === "en" ? "English" : "Čeština";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.18fr)]">
      {/* Left: identity + instance metadata (read-only) */}
      <div className="space-y-6">
        <AdminPanel eyebrow={copy.accountEyebrow} title={copy.accountTitle} description={copy.accountDescription}>
          {!isNeonMode ? (
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
              <p className="text-sm text-[var(--text-muted)]">{copy.accountFileMode}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <KeyValueRow label={copy.signInEmailLabel} value={signedInEmail ?? "unknown"} />
              <KeyValueRow label="role" value={currentFacilitator?.grant.role ?? "unknown"} />
            </div>
          )}
        </AdminPanel>

        <AdminPanel
          eyebrow={copy.settingsSafetyEyebrow}
          title={copy.activeInstance}
          description={copy.blueprintLinkHint}
        >
          <div className="space-y-3">
            <KeyValueRow label={copy.activeInstance} value={workshopId} />
            {selectedInstance?.blueprintId ? (
              <KeyValueRow
                label={lang === "en" ? "blueprint" : "blueprint"}
                value={`${selectedInstance.blueprintId}${selectedInstance.blueprintVersion ? ` · v${selectedInstance.blueprintVersion}` : ""}`}
              />
            ) : null}
            <KeyValueRow label={lang === "en" ? "language" : "jazyk"} value={languageLabel} />
            <KeyValueRow label={lang === "en" ? "team mode" : "režim týmů"} value={teamModeLabel} />
            <KeyValueRow label={lang === "en" ? "status" : "stav"} value={instanceStatus} />
            {blueprintRepoUrl ? (
              <a
                href={blueprintRepoUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-medium lowercase text-[var(--text-primary)] transition hover:text-[var(--text-secondary)]"
              >
                {copy.blueprintLinkLabel}
              </a>
            ) : null}
          </div>
        </AdminPanel>
      </div>

      {/* Right: grants + end-workshop */}
      <div className="space-y-6">
        <AdminPanel
          eyebrow={copy.facilitatorsEyebrow}
          title={copy.facilitatorsTitle}
          description={copy.facilitatorsDescription}
        >
          {!isNeonMode ? (
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
              <p className="text-sm text-[var(--text-secondary)]">{copy.fileModeFacilitatorsPanelBody}</p>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.16fr)_minmax(18rem,0.84fr)]">
              <div className="space-y-3">
                {facilitatorGrants.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">{copy.facilitatorListEmpty}</p>
                ) : (
                  facilitatorGrants.map((grant) => (
                    <div
                      key={grant.id}
                      className="flex items-center justify-between gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {grant.userName ?? grant.userEmail ?? grant.neonUserId}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {grant.userEmail ? `${grant.userEmail} · ` : ""}
                          {grant.role}
                        </p>
                      </div>
                      {isOwner && grant.id !== currentFacilitatorGrantId ? (
                        <form action={revokeFacilitatorAction}>
                          <HiddenState lang={lang} instanceId={instanceId} />
                          <input name="grantId" type="hidden" value={grant.id} />
                          <AdminSubmitButton className="text-sm lowercase text-[var(--danger)] transition hover:text-[var(--text-primary)]">
                            {copy.revokeButton}
                          </AdminSubmitButton>
                        </form>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              {isOwner ? (
                <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                  <h3 className="text-lg font-medium text-[var(--text-primary)]">{copy.addFacilitatorTitle}</h3>
                  <form action={addFacilitatorAction} className="mt-4 grid gap-3">
                    <HiddenState lang={lang} instanceId={instanceId} />
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder={copy.facilitatorEmailPlaceholder}
                      className={adminInputClassName}
                    />
                    <select name="role" className={adminInputClassName}>
                      <option value="operator">operator</option>
                      <option value="owner">owner</option>
                      <option value="observer">observer</option>
                    </select>
                    <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>
                      {copy.addFacilitatorButton}
                    </AdminSubmitButton>
                  </form>
                </div>
              ) : null}
            </div>
          )}
        </AdminPanel>

        <AdminPanel
          eyebrow={copy.endWorkshopEyebrow}
          title={copy.endWorkshopTitle}
          description={copy.endWorkshopDescription}
        >
          {alreadyEnded ? (
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{copy.endWorkshopAlreadyEnded}</p>
            </div>
          ) : (
            <form
              action={endWorkshopAction}
              className="space-y-3 rounded-[20px] border border-[var(--border-strong)] bg-[var(--surface-soft)] p-4"
            >
              <HiddenState lang={lang} instanceId={instanceId} />
              <details className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <summary className="cursor-pointer list-none text-sm font-medium text-[var(--text-primary)]">
                  {copy.endWorkshopButton}
                </summary>
                <div className="mt-4 space-y-3">
                  <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.endWorkshopConfirmHint}</p>
                  <input
                    type="text"
                    name="confirmation"
                    required
                    autoComplete="off"
                    aria-label={copy.endWorkshopConfirmPlaceholder}
                    placeholder={instanceId}
                    className="w-full rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />
                  {endError === "confirm" ? (
                    <p className="text-xs leading-5 text-[var(--danger)]">{copy.endWorkshopConfirmError}</p>
                  ) : null}
                  <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>
                    {copy.endWorkshopButton}
                  </AdminSubmitButton>
                </div>
              </details>
            </form>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
