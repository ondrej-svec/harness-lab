import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";
import {
  AdminPanel,
  FieldLabel,
  KeyValueRow,
  adminInputClassName,
  adminPrimaryButtonClassName,
} from "../../../../admin-ui";
import {
  addFacilitatorAction,
  issueParticipantAccessAction,
  revokeFacilitatorAction,
} from "../../_actions/access";
import type { ParticipantAccessFlash } from "../../_lib/participant-access-flash";

type Copy = (typeof adminCopy)[UiLanguage];

type FacilitatorGrant = {
  id: string;
  neonUserId: string;
  userName: string | null;
  userEmail: string | null;
  role: string;
};

function HiddenState({ lang, instanceId }: { lang: UiLanguage; instanceId: string }) {
  return (
    <>
      <input name="lang" type="hidden" value={lang} />
      <input name="section" type="hidden" value="access" />
      <input name="instanceId" type="hidden" value={instanceId} />
    </>
  );
}

export function AccessSection({
  lang,
  copy,
  instanceId,
  isNeonMode,
  isOwner,
  currentFacilitatorGrantId,
  fileModeUsername,
  errorParam,
  participantAccess,
  participantAccessExpiresValue,
  participantAccessFlash,
  facilitatorGrants,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  isNeonMode: boolean;
  isOwner: boolean;
  currentFacilitatorGrantId: string | null;
  fileModeUsername: string;
  errorParam: string | undefined;
  participantAccess: {
    active: boolean;
    codeId: string | null;
    canRevealCurrent: boolean;
    currentCode: string | null;
  };
  participantAccessExpiresValue: string;
  participantAccessFlash: ParticipantAccessFlash | null;
  facilitatorGrants: readonly FacilitatorGrant[];
}) {
  return (
    <div className="space-y-6">
      <AdminPanel
        eyebrow={copy.participantAccessEyebrow}
        title={copy.participantAccessTitle}
        description={copy.participantAccessDescription}
      >
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
          <div className="space-y-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
            <div className="space-y-3">
              <KeyValueRow
                label={copy.participantAccessStatusLabel}
                value={participantAccess.active ? copy.participantAccessStatusActive : copy.participantAccessStatusMissing}
              />
              <KeyValueRow
                label={copy.participantAccessCodeIdLabel}
                value={participantAccess.codeId ?? copy.participantAccessUnavailableValue}
              />
              <KeyValueRow label={copy.participantAccessExpiresLabel} value={participantAccessExpiresValue} />
            </div>

            {participantAccessFlash ? (
              <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {copy.participantAccessIssuedCodeLabel}
                </p>
                <p className="mt-3 break-all text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  {participantAccessFlash.issuedCode}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  {copy.participantAccessIssuedCodeHint}
                </p>
              </div>
            ) : participantAccess.canRevealCurrent && participantAccess.currentCode ? (
              <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {copy.participantAccessCurrentCodeLabel}
                </p>
                <p className="mt-3 break-all text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  {participantAccess.currentCode}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  {copy.participantAccessRecoverableHint}
                </p>
              </div>
            ) : (
              <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
                {copy.participantAccessUnrecoverableHint}
              </div>
            )}
          </div>

          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
            <form action={issueParticipantAccessAction} className="space-y-4">
              <HiddenState lang={lang} instanceId={instanceId} />
              <div>
                <FieldLabel htmlFor="participant-access-code">{copy.participantAccessCustomCodeLabel}</FieldLabel>
                <input
                  id="participant-access-code"
                  name="code"
                  placeholder={copy.participantAccessCustomCodePlaceholder}
                  className={`${adminInputClassName} mt-2`}
                />
              </div>
              <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.participantAccessIssueHint}</p>
              {errorParam ? (
                <p className="rounded-[18px] border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger)]">
                  {decodeURIComponent(errorParam)}
                </p>
              ) : null}
              <AdminSubmitButton className={`${adminPrimaryButtonClassName} w-full`}>
                {copy.participantAccessIssueButton}
              </AdminSubmitButton>
            </form>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel eyebrow={copy.facilitatorsEyebrow} title={copy.facilitatorsTitle} description={copy.facilitatorsDescription}>
        {!isNeonMode ? (
          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {copy.fileModeFacilitatorsPanelTitle}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{copy.fileModeFacilitatorsPanelBody}</p>
              <p className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)]">
                {copy.fileModeFacilitators}
              </p>
              <div className="mt-4 space-y-3">
                <KeyValueRow label={copy.fileModeAuthModeLabel} value={copy.fileModeAuthModeValue} />
                <KeyValueRow label={copy.fileModeUsernameLabel} value={fileModeUsername} />
                <KeyValueRow label={copy.fileModeScopeLabel} value={copy.fileModeScopeValue} />
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.fileModeUpgradeTitle}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{copy.fileModeUpgradeBody}</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
                  {copy.fileModeUpgradeBenefitOne}
                </div>
                <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
                  {copy.fileModeUpgradeBenefitTwo}
                </div>
                <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
                  {copy.fileModeUpgradeBenefitThree}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.16fr)_minmax(22rem,0.84fr)]">
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
    </div>
  );
}
