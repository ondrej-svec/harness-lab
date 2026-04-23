import { AdminSubmitButton } from "@/app/admin/admin-submit-button";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";

import { adminGhostButtonClassName } from "../../../admin-ui";
import {
  issueParticipantAccessAction,
  toggleWalkInsAction,
} from "../_actions/access";
import { AdminActionStateFields } from "./admin-action-state-fields";
import { RunAccessRevealChip } from "./run-access-reveal-chip";

type Copy = (typeof adminCopy)[UiLanguage];

// Compact access strip for the Run topbar. Surfaces two controls that
// used to live in the retired Access section:
//   1. The current participant event code (plus a rotate button).
//   2. The walk-in participant policy toggle.
//
// Facilitator grants stay in Settings; custom code / expiry selection
// and the richer permission model move to the CLI under the 2026-04-23
// minimal-UI plan. This strip is intentionally mid-scene fast: one
// glance, one tap to rotate or flip.

export function RunAccessStrip({
  lang,
  copy,
  instanceId,
  participantAccess,
  participantAccessExpiresValue,
  allowWalkIns,
}: {
  lang: UiLanguage;
  copy: Copy;
  instanceId: string;
  participantAccess: {
    active: boolean;
    codeId: string | null;
    currentCode: string | null;
    canRevealCurrent: boolean;
  };
  participantAccessExpiresValue: string;
  allowWalkIns: boolean;
}) {
  const hasCode = participantAccess.active;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
      {/* Event code chip + rotate */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {copy.participantAccessEyebrow}
        </span>
        {hasCode ? (
          <RunAccessRevealChip
            copy={copy}
            instanceId={instanceId}
            canRevealCurrent={participantAccess.canRevealCurrent}
            expiresTitle={participantAccessExpiresValue}
            serverKnownCode={participantAccess.currentCode}
          />
        ) : (
          <span className="text-[12px] text-[var(--text-muted)]">
            {copy.participantAccessStatusMissing}
          </span>
        )}
        <form action={issueParticipantAccessAction}>
          <AdminActionStateFields lang={lang} section="run" instanceId={instanceId} />
          <input type="hidden" name="expiresInDays" value="14" />
          <AdminSubmitButton className={adminGhostButtonClassName}>
            {copy.participantAccessIssueButton}
          </AdminSubmitButton>
        </form>
      </div>

      <span className="hidden h-5 w-px bg-[var(--border)] md:inline-block" aria-hidden="true" />

      {/* Walk-ins policy toggle */}
      <form action={toggleWalkInsAction} className="flex items-center gap-2">
        <AdminActionStateFields lang={lang} section="run" instanceId={instanceId} />
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {copy.walkInPolicyEyebrow}
        </span>
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-[var(--text-primary)]">
          <input
            type="radio"
            name="allowWalkIns"
            value="true"
            defaultChecked={allowWalkIns}
          />
          {copy.walkInPolicyAllowLabel}
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-[var(--text-primary)]">
          <input
            type="radio"
            name="allowWalkIns"
            value="false"
            defaultChecked={!allowWalkIns}
          />
          {copy.walkInPolicyDenyLabel}
        </label>
        <AdminSubmitButton className={`${adminGhostButtonClassName} ml-1`}>
          {copy.walkInPolicySaveButton}
        </AdminSubmitButton>
      </form>
    </div>
  );
}
