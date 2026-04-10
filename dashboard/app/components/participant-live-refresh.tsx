"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 30_000;

export function ParticipantLiveRefresh({
  currentAgendaItemId,
}: {
  currentAgendaItemId: string | undefined;
}) {
  const router = useRouter();
  const knownItemId = useRef(currentAgendaItemId);

  useEffect(() => {
    knownItemId.current = currentAgendaItemId;
  }, [currentAgendaItemId]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let visible = true;

    function startPolling() {
      stopPolling();
      timer = setInterval(async () => {
        try {
          const response = await fetch("/api/event-context/core");
          if (!response.ok) return;
          const data = await response.json();
          const currentItem = data.agenda?.find(
            (item: { status: string }) => item.status === "current",
          );
          const newId = currentItem?.id ?? data.agenda?.[0]?.id;
          if (newId && newId !== knownItemId.current) {
            knownItemId.current = newId;
            router.refresh();
          }
        } catch {
          // Network error — skip this cycle
        }
      }, POLL_INTERVAL_MS);
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
        router.refresh();
        startPolling();
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
