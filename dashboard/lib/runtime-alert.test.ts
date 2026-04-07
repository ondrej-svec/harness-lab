import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("runtime-alert", () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-07T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes error alerts to console.error", async () => {
    const { emitRuntimeAlert } = await import("./runtime-alert");

    emitRuntimeAlert({
      category: "facilitator_auth_failure",
      severity: "error",
      instanceId: "instance-a",
    });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"severity":"error"'),
    );
    expect(warnSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("writes warning and info alerts to the expected console methods", async () => {
    const { emitRuntimeAlert } = await import("./runtime-alert");

    emitRuntimeAlert({
      category: "participant_redeem_rate_limited",
      severity: "warning",
      instanceId: "instance-a",
    });
    emitRuntimeAlert({
      category: "instance_archive_created",
      severity: "info",
      instanceId: "instance-a",
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"severity":"warning"'),
    );
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('"severity":"info"'),
    );
  });
});
