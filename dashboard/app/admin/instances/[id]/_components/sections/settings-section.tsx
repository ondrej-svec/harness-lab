import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import { getBlueprintRepoUrl } from "@/lib/repo-links";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import {
  AdminPanel,
  FieldLabel,
  KeyValueRow,
  adminDangerButtonClassName,
  adminInputClassName,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "../../../../admin-ui";
import {
  archiveWorkshopAction,
  changePasswordAction,
  resetWorkshopAction,
  toggleRotationAction,
} from "../../_actions/settings";
import { endWorkshopAction } from "../../_actions/lifecycle";
import type { WorkshopInstanceStatus } from "@/lib/workshop-data";

type Copy = (typeof adminCopy)[UiLanguage];

type FacilitatorLike = {
  grant: { role: string };
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

export function SettingsSection({
  lang,
  copy,
  instanceId,
  isNeonMode,
  hasAuth,
  signedInEmail,
  currentFacilitator,
  workshopId,
  participantStateLabel,
  passwordParam,
  errorParam,
  teamModeEnabled = true,
  instanceStatus,
  endError,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  isNeonMode: boolean;
  hasAuth: boolean;
  signedInEmail: string | null;
  currentFacilitator: FacilitatorLike | null;
  workshopId: string;
  participantStateLabel: string;
  passwordParam: string | undefined;
  errorParam: string | undefined;
  teamModeEnabled?: boolean;
  instanceStatus: WorkshopInstanceStatus;
  endError?: string | undefined;
}) {
  const blueprintRepoUrl = getBlueprintRepoUrl();
  const canChangePassword = isNeonMode && hasAuth;
  const alreadyEnded = instanceStatus === "ended";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.18fr)]">
      <AdminPanel eyebrow={copy.accountEyebrow} title={copy.accountTitle} description={copy.accountDescription}>
        {!canChangePassword ? (
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
            <p className="text-sm text-[var(--text-muted)]">{copy.accountFileMode}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <KeyValueRow label={copy.signInEmailLabel} value={signedInEmail ?? "unknown"} />
            <KeyValueRow label="role" value={currentFacilitator?.grant.role ?? "unknown"} />
            <KeyValueRow label={copy.activeInstance} value={workshopId} />
          </div>
        )}
      </AdminPanel>

      <div className="space-y-6">
        <AdminPanel
          eyebrow={copy.settingsSafetyEyebrow}
          title={copy.participantSurfaceCardTitle}
          description={copy.participantSurfaceCardDescription}
        >
          <div className="space-y-4">
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
              {copy.participantStatePrefix} {participantStateLabel}.
            </div>
            {teamModeEnabled ? (
              <form action={toggleRotationAction} className="space-y-4">
                <HiddenState lang={lang} instanceId={instanceId} />
                <div className="grid grid-cols-2 gap-3">
                  <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`} name="revealed" value="true">
                    {copy.unlockButton}
                  </AdminSubmitButton>
                  <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`} name="revealed" value="false">
                    {copy.hideAgainButton}
                  </AdminSubmitButton>
                </div>
                <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.participantSurfaceRecoveryHint}</p>
              </form>
            ) : null}
          </div>
        </AdminPanel>

        <AdminPanel eyebrow={copy.accountEyebrow} title={copy.passwordCardTitle} description={copy.accountDescription}>
          {!canChangePassword ? (
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
              <p className="text-sm text-[var(--text-muted)]">{copy.accountFileMode}</p>
            </div>
          ) : (
            <form action={changePasswordAction} className="space-y-4">
              <HiddenState lang={lang} instanceId={instanceId} />
              <div>
                <FieldLabel htmlFor="current-password">{copy.currentPasswordLabel}</FieldLabel>
                <input id="current-password" name="currentPassword" type="password" required className={`${adminInputClassName} mt-2`} />
              </div>
              <div>
                <FieldLabel htmlFor="new-password">{copy.newPasswordLabel}</FieldLabel>
                <input id="new-password" name="newPassword" type="password" required className={`${adminInputClassName} mt-2`} />
              </div>
              <div>
                <FieldLabel htmlFor="confirm-password">{copy.confirmPasswordLabel}</FieldLabel>
                <input id="confirm-password" name="confirmPassword" type="password" required className={`${adminInputClassName} mt-2`} />
              </div>
              <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <input name="revokeOtherSessions" type="checkbox" defaultChecked />
                <span>{copy.revokeSessionsLabel}</span>
              </label>

              {passwordParam === "changed" ? (
                <p className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)]">
                  {copy.passwordChanged}
                </p>
              ) : null}

              {errorParam ? (
                <p className="rounded-[20px] border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
                  {errorParam === "password_mismatch" ? copy.passwordMismatch : decodeURIComponent(errorParam)}
                </p>
              ) : null}

              <AdminSubmitButton className={adminPrimaryButtonClassName}>
                {copy.changePasswordButton}
              </AdminSubmitButton>
            </form>
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

        <AdminPanel
          eyebrow={copy.settingsSafetyEyebrow}
          title={copy.archiveResetTitle}
          description={copy.archiveResetDescription}
        >
          <div className="space-y-4">
            <form action={archiveWorkshopAction} className="space-y-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <HiddenState lang={lang} instanceId={instanceId} />
              <textarea
                name="notes"
                rows={3}
                placeholder={copy.archivePlaceholder}
                className={adminInputClassName}
              />
              <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.archiveHint}</p>
              <AdminSubmitButton className={`${adminSecondaryButtonClassName} w-full`}>
                {copy.archiveButton}
              </AdminSubmitButton>
            </form>

            <form action={resetWorkshopAction} className="space-y-3 rounded-[20px] border border-[var(--danger-border)] bg-[var(--danger-surface)] p-4">
              <HiddenState lang={lang} instanceId={instanceId} />
              <p className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                {copy.resetBlueprintSummary}
              </p>
              <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.resetHint}</p>
              <details className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <summary className="cursor-pointer list-none text-sm font-medium text-[var(--text-primary)]">
                  {copy.resetButton}
                </summary>
                <div className="mt-4 space-y-3">
                  <p className="text-xs leading-5 text-[var(--text-muted)]">
                    {lang === "en"
                      ? `Type the instance id "${instanceId}" to confirm.`
                      : `Pro potvrzení napište id instance "${instanceId}".`}
                  </p>
                  <input
                    type="text"
                    name="confirmation"
                    required
                    autoComplete="off"
                    aria-label={lang === "en" ? "confirmation" : "potvrzení"}
                    placeholder={instanceId}
                    className="w-full rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />
                  <AdminSubmitButton className={`${adminDangerButtonClassName} w-full`}>
                    {lang === "en" ? "Reset workshop" : "Resetovat workshop"}
                  </AdminSubmitButton>
                </div>
              </details>
            </form>

            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{copy.blueprintLinkHint}</p>
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
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
