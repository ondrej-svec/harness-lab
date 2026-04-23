"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { adminCopy, UiLanguage } from "@/lib/ui-language";

import { adminGhostButtonClassName } from "../../../admin-ui";
import { revealParticipantEventCodeAction } from "../_actions/access";

type Copy = (typeof adminCopy)[UiLanguage];

const autoHideMs = 30_000;

// Client-side reveal affordance for the event-code pill. Holds the
// plaintext only in local component state, never in a data attribute,
// query string, or rendered HTML before the user clicks reveal. The
// server action handles auth and audit logging.
export function RunAccessRevealChip({
  copy,
  instanceId,
  canRevealCurrent,
  expiresTitle,
  serverKnownCode,
}: {
  copy: Copy;
  instanceId: string;
  canRevealCurrent: boolean;
  expiresTitle: string;
  /**
   * In dev (sample/bootstrap paths) the server already knows the
   * plaintext and it was safe to embed in the SSR payload long before
   * this feature. When that's the case, skip the reveal round-trip and
   * show it directly on click. Production-issued codes pass `null`.
   */
  serverKnownCode: string | null;
}) {
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearHideTimer();
    setPlaintext(null);
    setErrorMessage(null);
  }, [clearHideTimer]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  const scheduleAutoHide = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => {
      setPlaintext(null);
    }, autoHideMs);
  }, [clearHideTimer]);

  const handleReveal = () => {
    setErrorMessage(null);
    if (serverKnownCode) {
      setPlaintext(serverKnownCode);
      scheduleAutoHide();
      return;
    }
    startTransition(async () => {
      try {
        const result = await revealParticipantEventCodeAction(instanceId);
        if (result.ok) {
          setPlaintext(result.plaintext);
          scheduleAutoHide();
        } else {
          setErrorMessage(
            result.reason === "not-revealable"
              ? copy.participantAccessRevealRotateHint
              : copy.participantAccessRevealError,
          );
        }
      } catch {
        setErrorMessage(copy.participantAccessRevealError);
      }
    });
  };

  const handleCopy = async () => {
    if (!plaintext) return;
    try {
      await navigator.clipboard.writeText(plaintext);
    } catch {
      // Clipboard permissions can be denied in odd browser contexts.
      // Surface nothing — the plaintext is still visible for manual copy.
    }
  };

  if (!canRevealCurrent) {
    return (
      <span
        className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-[3px] font-mono text-[12px] tracking-[0.14em] text-[var(--text-muted)]"
        title={copy.participantAccessRevealRotateHint}
      >
        {copy.participantAccessUnavailableValue}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span
        className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-[3px] font-mono text-[12px] tracking-[0.14em] text-[var(--text-primary)]"
        title={expiresTitle}
      >
        {plaintext ?? copy.participantAccessHiddenValue}
      </span>
      {plaintext ? (
        <>
          <button
            type="button"
            onClick={handleCopy}
            className={adminGhostButtonClassName}
          >
            {copy.participantAccessCopyButton}
          </button>
          <button
            type="button"
            onClick={hide}
            className={adminGhostButtonClassName}
          >
            {copy.participantAccessHideButton}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleReveal}
          disabled={isPending}
          className={adminGhostButtonClassName}
        >
          {copy.participantAccessRevealButton}
        </button>
      )}
      {errorMessage ? (
        <span className="text-[11px] text-[var(--text-muted)]">{errorMessage}</span>
      ) : null}
    </span>
  );
}
