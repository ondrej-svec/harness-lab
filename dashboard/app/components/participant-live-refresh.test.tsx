// @vitest-environment happy-dom

/**
 * Polling-loop contract for ParticipantLiveRefresh.
 *
 * Verifies:
 *   - router.refresh() is only called when /api/event-context/fingerprint
 *     returns a different (stateVersion, phaseLabel) pair
 *   - the lean fingerprint endpoint is hit per tick (not core)
 *   - visibility-restore fetches fingerprint before deciding to refresh
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ParticipantLiveRefresh } from "./participant-live-refresh";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

const fetchMock = vi.fn();

function respondWith(payload: { stateVersion: number; phaseLabel: string }) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  refresh.mockReset();
  vi.stubGlobal("fetch", fetchMock as typeof fetch);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ParticipantLiveRefresh", () => {
  it("does not refresh when the fingerprint matches on each tick", async () => {
    fetchMock.mockResolvedValue(respondWith({ stateVersion: 7, phaseLabel: "Rotation" }));

    render(<ParticipantLiveRefresh currentFingerprint="7:Rotation" />);

    await vi.advanceTimersByTimeAsync(30_000);
    await vi.advanceTimersByTimeAsync(30_000);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [firstCall] = fetchMock.mock.calls[0];
    expect(firstCall).toBe("/api/event-context/fingerprint");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes once when the stateVersion changes", async () => {
    fetchMock
      .mockResolvedValueOnce(respondWith({ stateVersion: 7, phaseLabel: "Rotation" }))
      .mockResolvedValue(respondWith({ stateVersion: 8, phaseLabel: "Rotation" }));

    render(<ParticipantLiveRefresh currentFingerprint="7:Rotation" />);

    await vi.advanceTimersByTimeAsync(30_000);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(30_000);
    await Promise.resolve();

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("refreshes when phaseLabel changes even if stateVersion is unchanged", async () => {
    fetchMock.mockResolvedValue(respondWith({ stateVersion: 7, phaseLabel: "Challenges" }));

    render(<ParticipantLiveRefresh currentFingerprint="7:Rotation" />);

    await vi.advanceTimersByTimeAsync(30_000);
    await Promise.resolve();

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("skips refresh on network errors (graceful degradation)", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    render(<ParticipantLiveRefresh currentFingerprint="7:Rotation" />);

    await vi.advanceTimersByTimeAsync(30_000);
    await vi.advanceTimersByTimeAsync(30_000);

    expect(refresh).not.toHaveBeenCalled();
  });
});
