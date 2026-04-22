"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 30_000;

export function ParticipantLiveRefresh({
  currentFingerprint,
}: {
  currentFingerprint: string;
}) {
  const router = useRouter();
  const knownFingerprint = useRef(currentFingerprint);

  useEffect(() => {
    knownFingerprint.current = currentFingerprint;
  }, [currentFingerprint]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let visible = true;

    async function checkFingerprint() {
      // Lean endpoint (~1 SQL query in Neon mode). The full RSC refresh
      // only runs when the reported fingerprint differs from the last
      // known value — steady-state polling no longer re-renders the tree.
      try {
        const response = await fetch("/api/event-context/fingerprint");
        if (!response.ok) return;
        const data = (await response.json()) as {
          stateVersion?: number;
          phaseLabel?: string;
        };
        const nextFingerprint =
          typeof data.stateVersion === "number" && typeof data.phaseLabel === "string"
            ? `${data.stateVersion}:${data.phaseLabel}`
            : "";
        if (nextFingerprint && nextFingerprint !== knownFingerprint.current) {
          knownFingerprint.current = nextFingerprint;
          router.refresh();
        }
      } catch {
        // Network error — skip this cycle
      }
    }

    function startPolling() {
      stopPolling();
      timer = setInterval(checkFingerprint, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        visible = false;
        stopPolling();
      } else if (!visible) {
        visible = true;
        // Re-entering the tab: hit fingerprint first, only refresh when
        // the state actually changed in the background.
        checkFingerprint().then(() => startPolling());
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}
