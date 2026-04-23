import { describe, expect, it } from "vitest";

import { computeAgendaItemTime } from "./workshop-data";

type Phase = Parameters<typeof computeAgendaItemTime>[0][number];

function phase(id: string, overrides: Partial<Phase> = {}): Phase {
  return {
    id,
    order: 0,
    label: id,
    goal: id,
    ...overrides,
  } as Phase;
}

describe("computeAgendaItemTime", () => {
  it("derives wall-clock from cumulative durationMinutes + anchor", () => {
    const phases = [
      phase("p1", { durationMinutes: 30 }),
      phase("p2", { durationMinutes: 25 }),
      phase("p3", { durationMinutes: 40 }),
    ];
    expect(computeAgendaItemTime(phases, 0, "09:10")).toBe("09:10");
    expect(computeAgendaItemTime(phases, 1, "09:10")).toBe("09:40");
    expect(computeAgendaItemTime(phases, 2, "09:10")).toBe("10:05");
  });

  it("falls back to phase.startTime when durationMinutes is missing", () => {
    const phases = [
      phase("p1", { startTime: "09:00" }),
      phase("p2", { startTime: "10:00" }),
    ];
    expect(computeAgendaItemTime(phases, 0)).toBe("09:00");
    expect(computeAgendaItemTime(phases, 1)).toBe("10:00");
  });

  it("uses the first phase's startTime as the anchor when agenda anchor is absent", () => {
    const phases = [
      phase("p1", { startTime: "08:30", durationMinutes: 15 }),
      phase("p2", { durationMinutes: 45 }),
    ];
    expect(computeAgendaItemTime(phases, 1)).toBe("08:45");
  });

  it("rolls over past midnight safely", () => {
    const phases = [
      phase("p1", { durationMinutes: 30 }),
      phase("p2", { durationMinutes: 60 }),
    ];
    expect(computeAgendaItemTime(phases, 1, "23:45")).toBe("00:15");
  });

  it("falls back per-phase when any preceding duration is missing", () => {
    const phases = [
      phase("p1", { durationMinutes: 30, startTime: "09:00" }),
      phase("p2", { startTime: "09:40" }),
      phase("p3", { durationMinutes: 25, startTime: "10:05" }),
    ];
    // p2 has no durationMinutes; p3's cumulative calc would miss it, so
    // the helper falls back to p3's own startTime string.
    expect(computeAgendaItemTime(phases, 2, "09:00")).toBe("10:05");
  });

  it("returns empty string when the phase index is out of range", () => {
    expect(computeAgendaItemTime([], 0)).toBe("");
  });
});
